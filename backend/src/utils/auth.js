const jwt = require('jsonwebtoken');

function createToken(user) {
  const payload = {
    id: user.id,
    email: user.email
  };

  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// The OWNER's own account payload — safe to include contact + account state
// because it's only ever returned to that same authenticated user.
function sanitizeUser(user) {
  if (!user) return user;
  // Mongoose docs strip passwordHash via the schema toJSON transform.
  if (typeof user.toJSON === 'function') {
    return user.toJSON();
  }
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

// Fields that are safe to expose about OTHER users (discovery cards, revealed
// likers, match/profile popups). Deliberately EXCLUDES contact + account data:
// email, phone, passwordHash, blockedUsers, pushToken, isAdmin, isBanned,
// isDeactivated, tier/proExpiresAt, credits, undosUsed, and all the weekly
// usage counters. Leaking phone/email here was a real PII hole.
const PUBLIC_PROFILE_FIELDS = [
  'id',
  'name',
  'profession',
  'professionVerified',
  'bio',
  'headline',
  'age',
  'location',
  'gender',
  'lookingFor',
  'height',
  'languages',
  'religion',
  'education',
  'company',
  'jobTitle',
  'interests',
  'photos',
  'drinking',
  'smoking',
  'workout',
  'pets',
  'professionWhy',
  'professionLoveLevel',
  'firstDateIdea',
  'weekendVibe',
  'customPrompts',
  'createdAt'
];

// Projects a user document down to the public-safe fields above.
function publicProfile(user) {
  if (!user) return user;
  const src = typeof user.toJSON === 'function' ? user.toJSON() : user;
  const out = {};
  for (const key of PUBLIC_PROFILE_FIELDS) {
    if (src[key] !== undefined) out[key] = src[key];
  }
  return out;
}

module.exports = {
  createToken,
  sanitizeUser,
  publicProfile,
  PUBLIC_PROFILE_FIELDS
};
