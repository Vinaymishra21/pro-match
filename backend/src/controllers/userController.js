const { User, Swipe, Match, Message, Reveal, Report, VerificationRequest } = require('../models');
const { sanitizeUser } = require('../utils/auth');
const { scanFields, describe } = require('../utils/contentFilter');
const { recordSpamStrike } = require('../utils/moderation');

async function getMe(req, res) {
  const user = await User.findById(req.auth.id);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  return res.json({ user: sanitizeUser(user) });
}

async function updatePushToken(req, res) {
  const { pushToken } = req.body;

  if (typeof pushToken !== 'string') {
    return res.status(400).json({ message: 'pushToken is required' });
  }

  const user = await User.findById(req.auth.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  user.pushToken = pushToken.trim();
  await user.save();

  return res.json({ ok: true });
}

// POST /users/verify-profession { linkedinUrl?, documentUrl?, note? }
// SUBMITS a verification REQUEST (with evidence) for admin review — it does NOT
// grant the badge (that was a trust hole: anyone could self-verify in one tap).
// A request must carry at least one piece of evidence (a LinkedIn URL or an
// uploaded proof document). The badge is set only when an admin approves the
// evidence (see adminController.reviewVerification). Automated checks (work-email
// OTP, LinkedIn OAuth) can slot in here later without changing the client contract.
async function verifyProfession(req, res) {
  const user = await User.findById(req.auth.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  if (!user.profession) {
    return res.status(400).json({ message: 'Set your profession before verifying.' });
  }
  if (user.professionVerified) {
    return res.json({ user: sanitizeUser(user), status: 'verified' });
  }

  const linkedinUrl = typeof req.body.linkedinUrl === 'string' ? req.body.linkedinUrl.trim().slice(0, 300) : '';
  const documentUrl = typeof req.body.documentUrl === 'string' ? req.body.documentUrl.trim().slice(0, 500) : '';
  const note = typeof req.body.note === 'string' ? req.body.note.trim().slice(0, 500) : '';

  // Require at least one evidence item so the badge stays meaningful.
  if (!linkedinUrl && !documentUrl) {
    return res.status(400).json({
      message: 'Add your LinkedIn URL or upload a proof document to request verification.',
      code: 'NO_EVIDENCE'
    });
  }
  // Light sanity check on the LinkedIn URL (if provided).
  if (linkedinUrl && !/linkedin\.com\//i.test(linkedinUrl)) {
    return res.status(400).json({
      message: 'That doesn’t look like a LinkedIn profile URL (e.g. linkedin.com/in/your-name).',
      code: 'BAD_LINKEDIN'
    });
  }

  user.verificationStatus = 'pending';
  await user.save();

  // One open request per user (unique partial index); upsert so repeated taps
  // just refresh the pending request rather than pile up.
  await VerificationRequest.findOneAndUpdate(
    { user: user.id, status: 'pending' },
    { user: user.id, profession: user.profession, linkedinUrl, documentUrl, note, status: 'pending' },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return res.json({ user: sanitizeUser(user), status: 'pending' });
}

async function updateProfession(req, res) {
  const { profession } = req.body;

  if (!profession || typeof profession !== 'string') {
    return res.status(400).json({ message: 'profession is required' });
  }

  const user = await User.findById(req.auth.id);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  user.profession = profession.trim();
  await user.save();

  return res.json({ user: sanitizeUser(user) });
}

async function updateProfile(req, res) {
  const {
    bio,
    age,
    dob,
    name,
    location,
    gender,
    genderPreference,
    agePreference,
    lookingFor,
    maxDistance,
    maxDistanceKm,
    coordinates,
    lat,
    lng,
    height,
    languages,
    religion,
    education,
    company,
    jobTitle,
    headline,
    interests,
    photos,
    drinking,
    smoking,
    workout,
    pets,
    professionWhy,
    professionLoveLevel,
    firstDateIdea,
    weekendVibe,
    customPrompts
  } = req.body;

  const user = await User.findById(req.auth.id);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Content filter: don't let profiles carry links / contact details / scam text
  // (bio, headline, and prompt answers are the common hiding spots).
  const promptText = Array.isArray(customPrompts)
    ? customPrompts.map((p) => (p && typeof p.answer === 'string' ? p.answer : '')).join('  ')
    : '';
  const scan = scanFields({ bio, headline, prompts: promptText });
  if (!scan.clean) {
    const strike = await recordSpamStrike(user.id, 'blocked profile content');
    return res.status(400).json({
      message: `Your ${scan.field === 'prompts' ? 'prompt answers' : scan.field} can't include ${describe(scan.reasons)}. Please remove contact details and links.`,
      code: 'CONTENT_BLOCKED',
      field: scan.field,
      reasons: scan.reasons.map((r) => r.code),
      shadowBanned: strike.shadowBanned
    });
  }

  if (typeof bio === 'string') {
    user.bio = bio.trim();
  }

  if (typeof name === 'string' && name.trim()) {
    user.name = name.trim();
  }

  if (typeof age === 'number' && age >= 18 && age <= 80) {
    user.age = age;
  }

  if (age === null) {
    user.age = null;
  }

  // Date of birth → derive + store age (used by the discovery age filter).
  // Enforce the 18+ floor server-side so it can't be bypassed by a custom client.
  if (typeof dob === 'string' && dob) {
    const d = new Date(dob);
    if (Number.isNaN(d.getTime())) {
      return res.status(400).json({ message: 'Invalid date of birth.', code: 'BAD_DOB' });
    }
    const now = new Date();
    let derivedAge = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) derivedAge -= 1;
    if (derivedAge < 18) {
      return res.status(400).json({ message: 'You must be at least 18 to use Pro Match.', code: 'UNDERAGE' });
    }
    if (derivedAge > 100) {
      return res.status(400).json({ message: 'Please enter a valid date of birth.', code: 'BAD_DOB' });
    }
    user.dob = d;
    user.age = derivedAge;
  }

  const stringUpdates = {
    location,
    gender,
    lookingFor,
    maxDistance,
    height,
    religion,
    education,
    company,
    jobTitle,
    headline,
    drinking,
    smoking,
    workout,
    pets,
    professionWhy,
    professionLoveLevel,
    firstDateIdea,
    weekendVibe
  };

  Object.entries(stringUpdates).forEach(([key, value]) => {
    if (typeof value === 'string') {
      user[key] = value.trim();
    }
  });

  // GPS coordinates → GeoJSON point (powers nearest-first discovery). Accepts
  // either `coordinates: [lng, lat]` or separate `lat` + `lng` numbers.
  // Absent/invalid values leave the stored point untouched (we never wipe geo
  // on a partial profile update).
  let lngLat = null;
  if (Array.isArray(coordinates) && coordinates.length === 2) {
    lngLat = [coordinates[0], coordinates[1]];
  } else if (lat !== undefined || lng !== undefined) {
    lngLat = [lng, lat];
  }
  if (
    lngLat &&
    Number.isFinite(lngLat[0]) &&
    Number.isFinite(lngLat[1]) &&
    lngLat[0] >= -180 &&
    lngLat[0] <= 180 &&
    lngLat[1] >= -90 &&
    lngLat[1] <= 90
  ) {
    user.geo = { type: 'Point', coordinates: [lngLat[0], lngLat[1]] };
  }

  // Numeric max-distance radius (km) for discovery. Explicit null clears the
  // cap (nearby-first with no radius limit); otherwise require a sane number.
  if (maxDistanceKm === null) {
    user.maxDistanceKm = null;
  } else if (typeof maxDistanceKm === 'number' && Number.isFinite(maxDistanceKm) && maxDistanceKm >= 1) {
    user.maxDistanceKm = maxDistanceKm;
  }

  if (Array.isArray(genderPreference)) {
    user.genderPreference = genderPreference
      .filter((item) => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (Array.isArray(agePreference)) {
    const nums = agePreference.filter((n) => typeof n === 'number' && n >= 18 && n <= 80);
    user.agePreference = nums.length === 2 ? [Math.min(...nums), Math.max(...nums)] : [];
  }

  if (Array.isArray(languages)) {
    user.languages = languages
      .filter((item) => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 8);
  }

  if (Array.isArray(customPrompts)) {
    user.customPrompts = customPrompts
      .filter((p) => p && typeof p.prompt === 'string' && typeof p.answer === 'string')
      .map((p) => ({ prompt: p.prompt.trim(), answer: p.answer.trim() }))
      .filter((p) => p.prompt && p.answer)
      .slice(0, 6);
  }

  if (Array.isArray(interests)) {
    user.interests = interests
      .filter((item) => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 12);
  }

  if (Array.isArray(photos)) {
    const cleaned = photos
      .filter((item) => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 6);
    // Enforce the 2-photo minimum (can't be bypassed from a custom client).
    if (cleaned.length === 1) {
      return res.status(400).json({ message: 'A profile needs at least 2 photos.', code: 'MIN_PHOTOS' });
    }
    user.photos = cleaned;
  }

  await user.save();
  return res.json({ user: sanitizeUser(user) });
}

// POST /users/deactivate — hide the account everywhere; reversible on next login.
async function deactivateAccount(req, res) {
  const user = await User.findById(req.auth.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  user.isDeactivated = true;
  user.deactivatedAt = new Date();
  await user.save();

  return res.json({ ok: true });
}

// POST /users/reactivate — un-hide. Called automatically on login (see auth),
// but also exposed for an explicit "welcome back" action.
async function reactivateAccount(req, res) {
  const user = await User.findById(req.auth.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  user.isDeactivated = false;
  user.deactivatedAt = null;
  await user.save();

  return res.json({ user: sanitizeUser(user) });
}

// DELETE /users/me — permanent deletion. Cascades all of the user's data so
// nothing dangles (GDPR + app-store requirement).
async function deleteAccount(req, res) {
  const meId = req.auth.id;

  const myMatches = await Match.find({ $or: [{ userA: meId }, { userB: meId }] }).select('_id');
  const myMatchIds = myMatches.map((m) => m._id);

  await Promise.all([
    User.deleteOne({ _id: meId }),
    Swipe.deleteMany({ $or: [{ fromUserId: meId }, { toUserId: meId }] }),
    Match.deleteMany({ $or: [{ userA: meId }, { userB: meId }] }),
    Message.deleteMany({ $or: [{ matchId: { $in: myMatchIds } }, { senderId: meId }] }),
    Reveal.deleteMany({ $or: [{ userId: meId }, { likerId: meId }] }),
    Report.deleteMany({ reporter: meId }),
    // Remove me from anyone else's block lists so I don't linger as a dead ref.
    User.updateMany({ blockedUsers: meId }, { $pull: { blockedUsers: meId } })
  ]);

  return res.json({ ok: true });
}

module.exports = {
  getMe,
  updatePushToken,
  updateProfession,
  verifyProfession,
  updateProfile,
  deactivateAccount,
  reactivateAccount,
  deleteAccount
};
