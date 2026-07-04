const { Types } = require('mongoose');
const { User, Swipe } = require('../models');
const { publicProfile } = require('../utils/auth');
const {
  isProActive,
  getWeeklyUnlockState,
  getBoostState,
  canAccessProfession
} = require('../utils/entitlements');

// GET /discover?profession=<optional>
// Without a profession (or with your own) you get your same-profession deck —
// always free and unlimited (the core USP). Requesting a DIFFERENT profession
// consumes a weekly free unlock (or is unlimited for Pro), and is blocked once
// the free quota is used up.
async function getDiscover(req, res) {
  const me = await User.findById(req.auth.id);

  if (!me) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (!me.profession) {
    return res.status(400).json({ message: 'Profession not set' });
  }

  const requested = (req.query.profession || me.profession).trim();
  const access = canAccessProfession(me, requested);

  if (!access.allowed) {
    return res.status(403).json({
      message: `You've used all ${getWeeklyUnlockState(me).limit} free profession explores this week. Go Pro for unlimited access.`,
      code: 'PROFESSION_LOCKED',
      profession: requested,
      unlock: getWeeklyUnlockState(me),
      isPro: isProActive(me)
    });
  }

  // Consuming a free slot — record the unlock for this week and persist.
  if (access.willConsumeSlot) {
    const state = getWeeklyUnlockState(me);
    me.professionUnlocks = {
      weekStart: state.weekStart,
      professions: [...state.professions, requested]
    };
    await me.save();
  }

  const swipes = await Swipe.find({ fromUserId: me.id }).select('toUserId');
  const swipedIds = swipes.map((s) => s.toUserId);

  // Exclude people I blocked, and people who blocked me (mutual invisibility).
  const blockedByMe = (me.blockedUsers || []).map(String);
  const blockedMe = await User.find({ blockedUsers: me.id }).select('_id');
  const blockedMeIds = blockedMe.map((u) => String(u._id));
  const excludeIds = [...new Set([...swipedIds.map(String), ...blockedByMe, ...blockedMeIds])];

  // --- Build the query: profession (core USP) + optional filters ---------
  // _id values are cast to ObjectId up front: `find()` would cast strings
  // automatically, but the $geoNear aggregation below bypasses Mongoose
  // casting entirely — string ids there would silently exclude nobody.
  const meObjectId = new Types.ObjectId(String(me.id));
  const excludeObjectIds = excludeIds
    .filter((id) => Types.ObjectId.isValid(id))
    .map((id) => new Types.ObjectId(id));

  const query = {
    _id: { $ne: meObjectId, $nin: excludeObjectIds },
    profession: requested,
    // Never surface deactivated, banned, or shadow-banned accounts.
    isDeactivated: { $ne: true },
    isBanned: { $ne: true },
    isShadowBanned: { $ne: true },
    // Completeness gate: hide empty/bot-like profiles (no photo or no age). Keeps
    // low-effort fakes and half-finished accounts out of the deck.
    'photos.0': { $exists: true },
    age: { $ne: null }
  };

  // Age range filter.
  const minAge = parseInt(req.query.minAge, 10);
  const maxAge = parseInt(req.query.maxAge, 10);
  if (!Number.isNaN(minAge) || !Number.isNaN(maxAge)) {
    query.age = {};
    if (!Number.isNaN(minAge)) query.age.$gte = minAge;
    if (!Number.isNaN(maxAge)) query.age.$lte = maxAge;
  }

  // Gender filter — the genders I want to see (CSV from the client).
  const wantGenders = (req.query.genders || '')
    .split(',')
    .map((g) => g.trim())
    .filter(Boolean);
  if (wantGenders.length) {
    query.gender = { $in: wantGenders };
  }

  // "Looking for" filter (CSV).
  const wantLookingFor = (req.query.lookingFor || '')
    .split(',')
    .map((l) => l.trim())
    .filter(Boolean);
  if (wantLookingFor.length) {
    query.lookingFor = { $in: wantLookingFor };
  }

  // Religion filter (CSV).
  const wantReligions = (req.query.religions || '')
    .split(',')
    .map((r) => r.trim())
    .filter(Boolean);
  if (wantReligions.length) {
    query.religion = { $in: wantReligions };
  }

  // Languages filter (CSV) — match anyone who speaks at least one.
  const wantLanguages = (req.query.languages || '')
    .split(',')
    .map((l) => l.trim())
    .filter(Boolean);
  if (wantLanguages.length) {
    query.languages = { $in: wantLanguages };
  }

  // Verified-only filter.
  if (req.query.verifiedOnly === 'true') {
    query.professionVerified = true;
  }

  // --- JS post-filters (shared by every fetch path below) ----------------
  // They read plain fields, so they work on Mongoose docs and on the plain
  // objects that come back from the aggregation pipeline alike.
  const minCm = parseInt(req.query.minHeightCm, 10);
  const maxCm = parseInt(req.query.maxHeightCm, 10);
  const applyJsFilters = (list) => {
    let out = list;

    // Height range filter (heights are stored as strings like 5'9" (175 cm) —
    // parse the cm value out and compare). Done in JS since it's a derived value.
    if (!Number.isNaN(minCm) || !Number.isNaN(maxCm)) {
      out = out.filter((u) => {
        const match = /\((\d+)\s*cm\)/.exec(u.height || '');
        if (!match) return false; // no height set → excluded when filtering on height
        const cm = parseInt(match[1], 10);
        if (!Number.isNaN(minCm) && cm < minCm) return false;
        if (!Number.isNaN(maxCm) && cm > maxCm) return false;
        return true;
      });
    }

    // --- Mutual gender preference (profession AND gender) ------------------
    // Only show people whose own genderPreference includes my gender (or who are
    // open to everyone). This makes matching two-sided, not just my filter.
    if (me.gender) {
      out = out.filter(
        (u) => !u.genderPreference || u.genderPreference.length === 0 || u.genderPreference.includes(me.gender)
      );
    }

    return out;
  };

  // --- Distance: nearest-first deck + optional radius cap ----------------
  // Client contract: GET /discover?...&maxDistanceKm=<number> (kilometers).
  // The query param (filter slider) wins over the user's saved preference
  // (me.maxDistanceKm); null/absent = no hard cap, just nearest-first sorting.
  let radiusKm = Number(req.query.maxDistanceKm) || me.maxDistanceKm || null;
  if (!Number.isFinite(radiusKm) || radiusKm <= 0) radiusKm = null;

  const hasGeo = me.geo?.coordinates?.length === 2;

  let candidates;

  if (hasGeo) {
    // Requester has coordinates → $geoNear returns candidates sorted by
    // distance ASC (as plain objects, each with distanceMeters). It applies
    // the exact same `query` filters via its `query` option.
    const geoStage = {
      $geoNear: {
        near: { type: 'Point', coordinates: [me.geo.coordinates[0], me.geo.coordinates[1]] },
        distanceField: 'distanceMeters',
        spherical: true,
        key: 'geo',
        query,
        ...(radiusKm ? { maxDistance: radiusKm * 1000 } : {})
      }
    };
    const geoResults = await User.aggregate([geoStage]);
    const geoCandidates = applyJsFilters(geoResults).map((u) => ({
      ...u,
      // Aggregation returns raw docs: no `id` virtual — map _id so the public
      // profile shape stays identical to the find() path.
      id: String(u._id),
      distanceKm: Math.round((u.distanceMeters / 1000) * 10) / 10
    }));

    // Transition fallback: $geoNear only ever returns docs that HAVE geo, so
    // users who haven't shared coordinates yet would silently vanish. Fetch
    // them too and append AFTER all distance-sorted results (distance unknown).
    const geoIds = geoResults.map((c) => c._id);
    const nonGeoQuery = {
      ...query,
      _id: { $ne: meObjectId, $nin: [...excludeObjectIds, ...geoIds] },
      geo: { $exists: false }
    };
    const nonGeo = applyJsFilters(await User.find(nonGeoQuery));

    candidates = { geo: geoCandidates, tail: nonGeo };
  } else {
    // Requester has no location → previous behavior, nobody gets a distance.
    candidates = { geo: null, tail: applyJsFilters(await User.find(query)) };
  }

  // Boost/Spotlight: people with an active boost float to the front of the deck.
  // Stable within each group (boosted vs not), so existing ordering — distance
  // ASC for geo results — is otherwise preserved. The non-geo tail is sorted
  // the same way but always stays after the geo block.
  const now = Date.now();
  const isBoosted = (u) => u.boostExpiresAt && new Date(u.boostExpiresAt).getTime() > now;
  const boostSort = (list) => list.sort((a, b) => Number(isBoosted(b)) - Number(isBoosted(a)));
  candidates = [...(candidates.geo ? boostSort(candidates.geo) : []), ...boostSort(candidates.tail)];

  return res.json({
    profiles: candidates.map((u) => ({
      ...publicProfile(u),
      boosted: isBoosted(u),
      distanceKm: u.distanceKm ?? null
    })),
    profession: requested,
    isOwnProfession: requested === me.profession,
    unlock: getWeeklyUnlockState(me),
    isPro: isProActive(me),
    myBoost: getBoostState(me)
  });
}

// GET /discover/access — current weekly unlock state, for the "Explore other
// professions" UI (how many free slots remain, which are unlocked, Pro status).
async function getAccess(req, res) {
  const me = await User.findById(req.auth.id);
  if (!me) {
    return res.status(404).json({ message: 'User not found' });
  }

  return res.json({
    profession: me.profession,
    unlock: getWeeklyUnlockState(me),
    isPro: isProActive(me)
  });
}

module.exports = {
  getDiscover,
  getAccess
};
