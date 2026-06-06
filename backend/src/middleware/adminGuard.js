const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Like authGuard, but also requires the user to have isAdmin = true.
// Admin tokens carry { id, admin: true }; we re-check the DB flag each request
// so revoking admin takes effect immediately.
async function adminGuard(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    req.auth = decoded;
    req.adminUser = user;
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

module.exports = { adminGuard };
