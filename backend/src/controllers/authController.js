const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { User, Otp } = require('../models');
const { createToken, sanitizeUser } = require('../utils/auth');
const { sendSms, DEV_MODE } = require('../utils/sms');

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_OTP_ATTEMPTS = 5;
const DEV_OTP_CODE = '123456';

function normalizePhone(raw) {
  // Keep a leading + then digits only, e.g. "+91 98765 43210" -> "+919876543210"
  const trimmed = String(raw || '').trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  return hasPlus ? `+${digits}` : digits;
}

// ---------- Email / password (existing) ----------

async function register(req, res) {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'name, email and password are required' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const exists = await User.findOne({ email: normalizedEmail });
  if (exists) {
    return res.status(409).json({ message: 'Email already in use' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name: name.trim(), email: normalizedEmail, passwordHash });

  const token = createToken(user);
  return res.status(201).json({ token, user: sanitizeUser(user) });
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user || !user.passwordHash) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = createToken(user);
  return res.json({ token, user: sanitizeUser(user) });
}

// ---------- Phone / OTP ----------

async function requestOtp(req, res) {
  const phone = normalizePhone(req.body.phone);

  if (!phone || phone.replace(/\D/g, '').length < 8) {
    return res.status(400).json({ message: 'A valid phone number is required' });
  }

  // In dev the code is fixed (123456) so testing is frictionless; in prod it's random.
  const code = DEV_MODE ? DEV_OTP_CODE : String(crypto.randomInt(100000, 1000000));
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  // One active challenge per phone — replace any previous one.
  await Otp.findOneAndUpdate(
    { phone },
    { phone, codeHash, attempts: 0, expiresAt },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await sendSms(phone, `Your Pro Match verification code is ${code}`);

  // Only leak the code back to the client in dev mode.
  return res.json({ sent: true, ...(DEV_MODE ? { devCode: code } : {}) });
}

async function verifyOtp(req, res) {
  const phone = normalizePhone(req.body.phone);
  const code = String(req.body.code || '').trim();

  if (!phone || !code) {
    return res.status(400).json({ message: 'phone and code are required' });
  }

  const challenge = await Otp.findOne({ phone });

  if (!challenge || challenge.expiresAt < new Date()) {
    return res.status(400).json({ message: 'Code expired. Please request a new one.' });
  }

  if (challenge.attempts >= MAX_OTP_ATTEMPTS) {
    await Otp.deleteOne({ _id: challenge._id });
    return res.status(429).json({ message: 'Too many attempts. Please request a new code.' });
  }

  const valid = await bcrypt.compare(code, challenge.codeHash);
  if (!valid) {
    challenge.attempts += 1;
    await challenge.save();
    return res.status(401).json({ message: 'Incorrect code' });
  }

  // Success — consume the challenge.
  await Otp.deleteOne({ _id: challenge._id });

  // Find-or-create the user by phone.
  let user = await User.findOne({ phone });
  let isNewUser = false;

  if (!user) {
    isNewUser = true;
    user = await User.create({ name: 'New User', phone });
  } else if (user.isDeactivated) {
    // Logging back in reactivates a deactivated account ("welcome back").
    user.isDeactivated = false;
    user.deactivatedAt = null;
    await user.save();
  }

  const token = createToken(user);
  return res.json({ token, user: sanitizeUser(user), isNewUser });
}

module.exports = {
  register,
  login,
  requestOtp,
  verifyOtp
};
