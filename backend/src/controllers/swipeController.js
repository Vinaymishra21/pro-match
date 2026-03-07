const { v4: uuidv4 } = require('uuid');
const { readDb, writeDb } = require('../utils/db');

function upsertSwipe(req, res) {
  const { toUserId, action } = req.body;
  const fromUserId = req.auth.id;

  if (!toUserId || !['like', 'pass'].includes(action)) {
    return res.status(400).json({ message: 'toUserId and valid action are required' });
  }

  const db = readDb();
  const me = db.users.find((u) => u.id === fromUserId);
  const target = db.users.find((u) => u.id === toUserId);

  if (!me || !target) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (!me.profession || me.profession !== target.profession) {
    return res.status(400).json({ message: 'You can only swipe users with the same profession' });
  }

  const existing = db.swipes.find(
    (s) => s.fromUserId === fromUserId && s.toUserId === toUserId
  );

  if (existing) {
    existing.action = action;
    existing.updatedAt = new Date().toISOString();
  } else {
    db.swipes.push({
      id: uuidv4(),
      fromUserId,
      toUserId,
      action,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  let match = null;

  if (action === 'like') {
    const reciprocalLike = db.swipes.find(
      (s) => s.fromUserId === toUserId && s.toUserId === fromUserId && s.action === 'like'
    );

    if (reciprocalLike) {
      const alreadyMatched = db.matches.find(
        (m) =>
          (m.userA === fromUserId && m.userB === toUserId) ||
          (m.userA === toUserId && m.userB === fromUserId)
      );

      if (!alreadyMatched) {
        match = {
          id: uuidv4(),
          userA: fromUserId,
          userB: toUserId,
          createdAt: new Date().toISOString()
        };
        db.matches.push(match);
      } else {
        match = alreadyMatched;
      }
    }
  }

  writeDb(db);
  return res.json({ matched: Boolean(match), match });
}

function getMatches(req, res) {
  const db = readDb();
  const userId = req.auth.id;

  const userMatches = db.matches
    .filter((m) => m.userA === userId || m.userB === userId)
    .map((m) => {
      const otherId = m.userA === userId ? m.userB : m.userA;
      const otherUser = db.users.find((u) => u.id === otherId);

      return {
        id: m.id,
        createdAt: m.createdAt,
        user: otherUser
          ? {
              id: otherUser.id,
              name: otherUser.name,
              profession: otherUser.profession,
              bio: otherUser.bio
            }
          : null
      };
    })
    .filter((m) => m.user);

  return res.json({ matches: userMatches });
}

module.exports = {
  upsertSwipe,
  getMatches
};
