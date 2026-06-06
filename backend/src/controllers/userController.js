const { User } = require('../models');
const { sanitizeUser } = require('../utils/auth');

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

// POST /users/verify-profession
// Marks the user's profession as verified. Today this is a lightweight stub
// (instant in dev) so the badge + flow are testable; swap the body for a real
// check later (work-email domain, LinkedIn OAuth, or doc upload + review).
async function verifyProfession(req, res) {
  const user = await User.findById(req.auth.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  if (!user.profession) {
    return res.status(400).json({ message: 'Set your profession before verifying.' });
  }

  user.professionVerified = true;
  await user.save();

  return res.json({ user: sanitizeUser(user) });
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
    name,
    location,
    gender,
    genderPreference,
    agePreference,
    lookingFor,
    maxDistance,
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
    user.photos = photos
      .filter((item) => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 6);
  }

  await user.save();
  return res.json({ user: sanitizeUser(user) });
}

module.exports = {
  getMe,
  updatePushToken,
  updateProfession,
  verifyProfession,
  updateProfile
};
