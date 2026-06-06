const { User, Swipe } = require('../models');
const { sanitizeUser } = require('../utils/auth');
const {
  isProActive,
  getWeeklyUnlockState,
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
  const query = {
    _id: { $ne: me.id, $nin: excludeIds },
    profession: requested
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

  let candidates = await User.find(query);

  // Height range filter (heights are stored as strings like 5'9" (175 cm) —
  // parse the cm value out and compare). Done in JS since it's a derived value.
  const minCm = parseInt(req.query.minHeightCm, 10);
  const maxCm = parseInt(req.query.maxHeightCm, 10);
  if (!Number.isNaN(minCm) || !Number.isNaN(maxCm)) {
    candidates = candidates.filter((u) => {
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
    candidates = candidates.filter(
      (u) => !u.genderPreference || u.genderPreference.length === 0 || u.genderPreference.includes(me.gender)
    );
  }

  return res.json({
    profiles: candidates.map((u) => sanitizeUser(u)),
    profession: requested,
    isOwnProfession: requested === me.profession,
    unlock: getWeeklyUnlockState(me),
    isPro: isProActive(me)
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
