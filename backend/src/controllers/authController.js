const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const { User, Otp, PasswordReset, EmailVerification } = require('../models');
const { createToken, sanitizeUser } = require('../utils/auth');
const { isIdentifierBanned } = require('../utils/identity');
const { sendSms, DEV_MODE } = require('../utils/sms');
const { sendEmail, DEV_MODE: EMAIL_DEV_MODE } = require('../utils/email');

// Verifies Google ID tokens against our Web OAuth client. Optional: if the env
// var is unset, /auth/google returns 503 rather than crashing the server.
const GOOGLE_CLIENT_ID = process.env.GOOGLE_WEB_CLIENT_ID;
const googleClient = new OAuth2Client();

const BANNED_RESPONSE = { message: 'This account has been suspended.', code: 'BANNED' };

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

// Issues (or replaces) an email-verification challenge and "sends" it. Returns
// the code so dev mode can hand it straight back to the client.
async function issueEmailVerification(email) {
  const code = EMAIL_DEV_MODE ? DEV_OTP_CODE : String(crypto.randomInt(100000, 1000000));
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);
  await EmailVerification.findOneAndUpdate(
    { email },
    { email, codeHash, attempts: 0, expiresAt },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  await sendEmail(email, 'Verify your Wovnn email', `Your Wovnn verification code is ${code}. It expires in 10 minutes.`);
  return code;
}

async function register(req, res) {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'name, email and password are required' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Ban-evasion: refuse signups whose identifier is on the blocklist.
  if (await isIdentifierBanned(normalizedEmail)) {
    return res.status(403).json(BANNED_RESPONSE);
  }

  const exists = await User.findOne({ email: normalizedEmail });
  if (exists) {
    return res.status(409).json({ message: 'Email already in use' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name: name.trim(), email: normalizedEmail, passwordHash });

  const token = createToken(user);
  // Fire off email verification (dev mode returns the code for testing).
  const emailCode = await issueEmailVerification(normalizedEmail);
  return res.status(201).json({
    token,
    user: sanitizeUser(user),
    ...(EMAIL_DEV_MODE ? { devEmailCode: emailCode } : {})
  });
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

  if (user.isBanned) {
    return res.status(403).json({ message: 'This account has been suspended.', code: 'BANNED' });
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

  await sendSms(phone, `Your Wovnn verification code is ${code}`);

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

  // Ban-evasion: this phone was previously banned (even if the account is gone).
  if (await isIdentifierBanned(phone)) {
    return res.status(403).json(BANNED_RESPONSE);
  }

  // Find-or-create the user by phone.
  let user = await User.findOne({ phone });
  let isNewUser = false;

  // A banned account cannot log back in (unlike self-deactivation below).
  if (user && user.isBanned) {
    return res.status(403).json(BANNED_RESPONSE);
  }

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

// ---------- Google (ID token) ----------

async function googleAuth(req, res) {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ message: 'idToken is required' });
  }
  if (!GOOGLE_CLIENT_ID) {
    return res.status(503).json({ message: 'Google sign-in is not configured' });
  }

  // Verify the token's signature, audience and issuer against Google's keys.
  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
    payload = ticket.getPayload();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid Google token' });
  }

  if (!payload || !payload.email || !payload.email_verified) {
    return res.status(401).json({ message: 'Google account email not verified' });
  }

  const normalizedEmail = payload.email.trim().toLowerCase();

  if (await isIdentifierBanned(normalizedEmail)) {
    return res.status(403).json(BANNED_RESPONSE);
  }

  // Find-or-create by email — same shape as verifyOtp's phone path.
  let user = await User.findOne({ email: normalizedEmail });
  let isNewUser = false;

  if (user && user.isBanned) {
    return res.status(403).json(BANNED_RESPONSE);
  }

  if (!user) {
    isNewUser = true;
    // Google already verified this email, so trust it.
    user = await User.create({ name: payload.name || 'New User', email: normalizedEmail, emailVerified: true });
  } else if (user.isDeactivated) {
    user.isDeactivated = false;
    user.deactivatedAt = null;
    await user.save();
  }

  const token = createToken(user);
  return res.json({ token, user: sanitizeUser(user), isNewUser });
}

// ---------- Password reset (email) ----------

async function forgotPassword(req, res) {
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!email) {
    return res.status(400).json({ message: 'email is required' });
  }

  const user = await User.findOne({ email });

  // Only issue a code for an existing password account — but always respond the
  // same way so we never reveal which emails are registered.
  if (user && user.passwordHash) {
    const code = EMAIL_DEV_MODE ? DEV_OTP_CODE : String(crypto.randomInt(100000, 1000000));
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await PasswordReset.findOneAndUpdate(
      { email },
      { email, codeHash, attempts: 0, expiresAt },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    await sendEmail(email, 'Your Wovnn password reset code', `Your Wovnn password reset code is ${code}. It expires in 10 minutes.`);

    // Dev convenience: hand the code straight back (no real email is sent).
    if (EMAIL_DEV_MODE) return res.json({ sent: true, devCode: code });
  }

  return res.json({ sent: true });
}

async function resetPassword(req, res) {
  const email = String(req.body.email || '').trim().toLowerCase();
  const code = String(req.body.code || '').trim();
  const newPassword = String(req.body.newPassword || '');

  if (!email || !code || !newPassword) {
    return res.status(400).json({ message: 'email, code and newPassword are required' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  const challenge = await PasswordReset.findOne({ email });
  if (!challenge || challenge.expiresAt < new Date()) {
    return res.status(400).json({ message: 'Code expired. Please request a new one.' });
  }
  if (challenge.attempts >= MAX_OTP_ATTEMPTS) {
    await PasswordReset.deleteOne({ _id: challenge._id });
    return res.status(429).json({ message: 'Too many attempts. Please request a new code.' });
  }

  const valid = await bcrypt.compare(code, challenge.codeHash);
  if (!valid) {
    challenge.attempts += 1;
    await challenge.save();
    return res.status(401).json({ message: 'Incorrect code' });
  }

  const user = await User.findOne({ email });
  if (!user) {
    await PasswordReset.deleteOne({ _id: challenge._id });
    return res.status(400).json({ message: 'Account not found' });
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();
  await PasswordReset.deleteOne({ _id: challenge._id });

  // Sign them straight in after a successful reset.
  const token = createToken(user);
  return res.json({ token, user: sanitizeUser(user) });
}

// ---------- Email verification ----------

async function verifyEmail(req, res) {
  const code = String(req.body.code || '').trim();
  if (!code) {
    return res.status(400).json({ message: 'code is required' });
  }

  const user = await User.findById(req.auth.id);
  if (!user || !user.email) {
    return res.status(400).json({ message: 'No email on this account' });
  }
  if (user.emailVerified) {
    return res.json({ user: sanitizeUser(user) });
  }

  const challenge = await EmailVerification.findOne({ email: user.email });
  if (!challenge || challenge.expiresAt < new Date()) {
    return res.status(400).json({ message: 'Code expired. Please request a new one.' });
  }
  if (challenge.attempts >= MAX_OTP_ATTEMPTS) {
    await EmailVerification.deleteOne({ _id: challenge._id });
    return res.status(429).json({ message: 'Too many attempts. Please request a new code.' });
  }

  const valid = await bcrypt.compare(code, challenge.codeHash);
  if (!valid) {
    challenge.attempts += 1;
    await challenge.save();
    return res.status(401).json({ message: 'Incorrect code' });
  }

  user.emailVerified = true;
  await user.save();
  await EmailVerification.deleteOne({ _id: challenge._id });
  return res.json({ user: sanitizeUser(user) });
}

async function resendEmailVerification(req, res) {
  const user = await User.findById(req.auth.id);
  if (!user || !user.email) {
    return res.status(400).json({ message: 'No email on this account' });
  }
  if (user.emailVerified) {
    return res.json({ sent: true, alreadyVerified: true });
  }
  const code = await issueEmailVerification(user.email);
  return res.json({ sent: true, ...(EMAIL_DEV_MODE ? { devCode: code } : {}) });
}

module.exports = {
  register,
  login,
  requestOtp,
  verifyOtp,
  googleAuth,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendEmailVerification
};
