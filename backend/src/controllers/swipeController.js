const { User, Swipe, Match } = require('../models');
const { publicProfile } = require('../utils/auth');
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

  // Block enforcement: if either side has blocked the other, no swipe/like/match
  // can form between them (discovery hides them, but the endpoint is directly
  // callable, so enforce here too).
  const iBlocked = (me.blockedUsers || []).some((id) => String(id) === String(toUserId));
  const blockedMe = (target.blockedUsers || []).some((id) => String(id) === String(fromUserId));
  if (iBlocked || blockedMe) {
    return res.status(403).json({ message: 'This person is unavailable.', code: 'BLOCKED' });
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

      let createdNow = false;
      if (!match) {
        try {
          match = await Match.create({ userA: fromUserId, userB: toUserId, crossProfession });
          createdNow = true;
        } catch (err) {
          // Both users liked simultaneously — the unique pairKey index rejected
          // the second insert. Re-fetch the winner's match instead of erroring.
          if (err.code === 11000) {
            match = await Match.findOne({
              $or: [
                { userA: fromUserId, userB: toUserId },
                { userA: toUserId, userB: fromUserId }
              ]
            });
          } else {
            throw err;
          }
        }
      }

      if (createdNow) {
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
    status: 'active',
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

// POST /swipes/undo — rewind your most recent swipe so that person reappears.
// Removes the swipe and any match it created (so an accidental like is fully
// reversed). Returns the restored profile for the client to re-insert.
const FREE_UNDO_LIMIT = 1; // free users get 1 rewind, ever; Pro is unlimited.

async function undoSwipe(req, res) {
  const fromUserId = req.auth.id;

  const me = await User.findById(fromUserId);
  if (!me) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Gate: free users may undo only FREE_UNDO_LIMIT times total.
  const pro = isProActive(me);
  if (!pro && (me.undosUsed || 0) >= FREE_UNDO_LIMIT) {
    return res.status(403).json({
      message: 'You’ve used your free rewind. Go Pro for unlimited rewinds.',
      code: 'UNDO_LIMIT'
    });
  }

  const last = await Swipe.findOne({ fromUserId }).sort({ createdAt: -1 });
  if (!last) {
    return res.status(404).json({ message: 'Nothing to undo', code: 'NOTHING_TO_UNDO' });
  }

  // If that like formed a match, undo the match too.
  await Match.deleteOne({
    $or: [
      { userA: fromUserId, userB: last.toUserId },
      { userA: last.toUserId, userB: fromUserId }
    ]
  });

  const profile = await User.findById(last.toUserId);
  await Swipe.deleteOne({ _id: last._id });

  // Count the undo for free users (Pro is unlimited, no need to track).
  if (!pro) {
    me.undosUsed = (me.undosUsed || 0) + 1;
    await me.save();
  }

  const undosLeft = pro ? null : Math.max(0, FREE_UNDO_LIMIT - me.undosUsed);
  return res.json({ ok: true, profile: profile ? publicProfile(profile) : null, isPro: pro, undosLeft });
}

module.exports = {
  upsertSwipe,
  getMatches,
  undoSwipe
};
