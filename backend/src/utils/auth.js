const jwt = require('jsonwebtoken');

function createToken(user) {
  const payload = {
    id: user.id,
    email: user.email
  };

  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function sanitizeUser(user) {
  if (!user) return user;
  // Mongoose docs strip passwordHash via the schema toJSON transform.
  if (typeof user.toJSON === 'function') {
    return user.toJSON();
  }
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

module.exports = {
  createToken,
  sanitizeUser
};
