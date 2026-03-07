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
  const { bio, age, name } = req.body;

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

  writeDb(db);
  return res.json({ user: sanitizeUser(user) });
}

module.exports = {
  getMe,
  updateProfession,
  updateProfile
};
