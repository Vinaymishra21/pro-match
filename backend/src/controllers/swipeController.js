const { User, Swipe, Match } = require('../models');
const { sendPush } = require('../utils/push');
const { isProActive, getWeeklyUnlockState } = require('../utils/entitlements');

async function upsertSwipe(req, res) {
  const { toUserId, action } = req.body;
  const fromUserId = req.auth.id;

  if (!toUserId || !['like', 'pass'].includes(action)) {
    return res.status(400).json({ message: 'toUserId and valid action are required' });
  }

  const [me, target] = await Promise.all([
    User.findById(fromUserId),
    User.findById(toUserId)
  ]);

  if (!me || !target) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (!me.profession) {
    return res.status(400).json({ message: 'Set your profession before swiping' });
  }

  // Same-profession is always allowed. Cross-profession swiping is allowed only
  // for the decks the user can access (Pro, or unlocked this week) — this stops
  // a client from liking outside professions it never paid to explore.
  const crossProfession = target.profession !== me.profession;
  if (crossProfession) {
    const hasAccess =
      isProActive(me) || getWeeklyUnlockState(me).professions.includes(target.profession);
    if (!hasAccess) {
      return res.status(403).json({
        message: 'Unlock this profession to like people in it.',
        code: 'PROFESSION_LOCKED'
      });
    }
  }

  await Swipe.findOneAndUpdate(
    { fromUserId, toUserId },
    { fromUserId, toUserId, action, crossProfession },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  let match = null;

  if (action === 'like') {
    const reciprocalLike = await Swipe.findOne({
      fromUserId: toUserId,
      toUserId: fromUserId,
      action: 'like'
    });

    if (reciprocalLike) {
      match = await Match.findOne({
        $or: [
          { userA: fromUserId, userB: toUserId },
          { userA: toUserId, userB: fromUserId }
        ]
      });

      if (!match) {
        match = await Match.create({ userA: fromUserId, userB: toUserId, crossProfession });

        // It's a brand-new mutual match — notify both people.
        if (me.pushToken) {
          sendPush(me.pushToken, {
            title: "It's a match! 🎉",
            body: `You and ${target.name} both liked each other.`,
            data: { type: 'match', matchId: String(match.id) }
          }).catch((err) => console.warn('match push failed:', err.message));
        }
        if (target.pushToken) {
          sendPush(target.pushToken, {
            title: "It's a match! 🎉",
            body: `You and ${me.name} both liked each other.`,
            data: { type: 'match', matchId: String(match.id) }
          }).catch((err) => console.warn('match push failed:', err.message));
        }
      }
    }
  }

  return res.json({ matched: Boolean(match), match: match ? match.toJSON() : null });
}

async function getMatches(req, res) {
  const userId = req.auth.id;

  const matches = await Match.find({
    $or: [{ userA: userId }, { userB: userId }]
  })
    .populate('userA', 'name profession bio photos')
    .populate('userB', 'name profession bio photos')
    .sort({ createdAt: -1 });

  const userMatches = matches
    .map((m) => {
      const other =
        String(m.userA._id) === String(userId) ? m.userB : m.userA;

      return {
        id: m.id,
        createdAt: m.createdAt,
        crossProfession: Boolean(m.crossProfession),
        user: other
          ? {
              id: other.id,
              name: other.name,
              profession: other.profession,
              bio: other.bio,
              photos: other.photos || []
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
