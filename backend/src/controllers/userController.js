const { readDb, writeDb } = require('../utils/db');
const { sanitizeUser } = require('../utils/auth');

function getMe(req, res) {
  const db = readDb();
  const user = db.users.find((u) => u.id === req.auth.id);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  return res.json({ user: sanitizeUser(user) });
}

function updateProfession(req, res) {
  const { profession } = req.body;

  if (!profession || typeof profession !== 'string') {
    return res.status(400).json({ message: 'profession is required' });
  }

  const db = readDb();
  const user = db.users.find((u) => u.id === req.auth.id);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  user.profession = profession.trim();
  writeDb(db);

  return res.json({ user: sanitizeUser(user) });
}

function updateProfile(req, res) {
  const {
    bio,
    age,
    name,
    location,
    lookingFor,
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
    weekendVibe
  } = req.body;

  const db = readDb();
  const user = db.users.find((u) => u.id === req.auth.id);

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
    lookingFor,
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

  writeDb(db);
  return res.json({ user: sanitizeUser(user) });
}

module.exports = {
  getMe,
  updateProfession,
  updateProfile
};
