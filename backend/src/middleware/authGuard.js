const jwt = require('jsonwebtoken');
const { User } = require('../models');

async function authGuard(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  // Enforce moderation bans on every request so an existing (still-valid) token
  // stops working the moment the account is banned. Minimal projection keeps
  // this cheap. A missing user (deleted account) is also rejected.
  const account = await User.findById(decoded.id).select('isBanned');
  if (!account) {
    return res.status(401).json({ message: 'Account not found', code: 'NO_ACCOUNT' });
  }
  if (account.isBanned) {
    return res.status(403).json({ message: 'This account has been suspended.', code: 'BANNED' });
  }

  req.auth = decoded;
  return next();
}

module.exports = {
  authGuard
};
