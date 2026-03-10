const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { readDb, writeDb } = require('../utils/db');
const { createToken, sanitizeUser } = require('../utils/auth');

async function register(req, res) {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'name, email and password are required' });
  }

  const db = readDb();
  const normalizedEmail = email.trim().toLowerCase();

  const exists = db.users.some((u) => u.email === normalizedEmail);
  if (exists) {
    return res.status(409).json({ message: 'Email already in use' });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = {
    id: uuidv4(),
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    profession: '',
    bio: '',
    age: null,
    location: '',
    lookingFor: '',
    education: '',
    company: '',
    jobTitle: '',
    headline: '',
    interests: [],
    photos: [],
    drinking: '',
    smoking: '',
    workout: '',
    pets: '',
    professionWhy: '',
    professionLoveLevel: '',
    firstDateIdea: '',
    weekendVibe: '',
    createdAt: new Date().toISOString()
  };

  db.users.push(user);
  writeDb(db);

  const token = createToken(user);
  return res.status(201).json({ token, user: sanitizeUser(user) });
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required' });
  }

  const db = readDb();
  const normalizedEmail = email.trim().toLowerCase();
  const user = db.users.find((u) => u.email === normalizedEmail);

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = createToken(user);
  return res.json({ token, user: sanitizeUser(user) });
}

module.exports = {
  register,
  login
};
