const { readDb } = require('../utils/db');
const { sanitizeUser } = require('../utils/auth');

function getDiscover(req, res) {
  const db = readDb();
  const me = db.users.find((u) => u.id === req.auth.id);

  if (!me) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (!me.profession) {
    return res.status(400).json({ message: 'Profession not set' });
  }

  const swipedIds = new Set(
    db.swipes
      .filter((s) => s.fromUserId === me.id)
      .map((s) => s.toUserId)
  );

  const candidates = db.users
    .filter((u) => u.id !== me.id)
    .filter((u) => u.profession && u.profession === me.profession)
    .filter((u) => !swipedIds.has(u.id))
    .map((u) => sanitizeUser(u));

  return res.json({ profiles: candidates });
}

module.exports = {
  getDiscover
};
