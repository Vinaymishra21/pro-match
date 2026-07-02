const { User, Swipe, Reveal } = require('../models');
const { publicProfile } = require('../utils/auth');
const { isProActive } = require('../utils/entitlements');
const { REVEAL_COST_CREDITS } = require('../config/monetization');

// Builds the blurred teaser shown to free users for an unrevealed liker.
function blurredCard(likerUser, crossProfession, superLike = false) {
  return {
    likerId: likerUser.id,
    blurred: true,
    profession: likerUser.profession,
    crossProfession,
    superLike,
    // Coarse hint only — no name, no photos.
    teaser: superLike
      ? `⭐ Someone in ${likerUser.profession} Super Liked you`
      : `Someone in ${likerUser.profession} liked you`
  };
}

function revealedCard(likerUser, crossProfession, superLike = false) {
  return {
    ...publicProfile(likerUser),
    likerId: likerUser.id,
    blurred: false,
    crossProfession,
    superLike
  };
}

// GET /likes/incoming — people who liked you and you haven't liked back yet.
// Pro users see everyone unblurred; free users see blurred teasers plus any
// individuals they've spot-revealed with credits.
async function getIncomingLikes(req, res) {
  const me = await User.findById(req.auth.id);
  if (!me) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Likes received.
  const incoming = await Swipe.find({ toUserId: me.id, action: 'like' }).sort({ createdAt: -1 });

  // Exclude people I've already liked back (those are matches, not pending likes).
  const myLikes = await Swipe.find({ fromUserId: me.id, action: 'like' }).select('toUserId');
  const likedBack = new Set(myLikes.map((s) => String(s.toUserId)));
  const pending = incoming.filter((s) => !likedBack.has(String(s.fromUserId)));

  const pro = isProActive(me);
  const revealedRows = pro
    ? []
    : await Reveal.find({ userId: me.id }).select('likerId');
  const revealedSet = new Set(revealedRows.map((r) => String(r.likerId)));

  const likerIds = pending.map((s) => s.fromUserId);
  // Hide likes from accounts that shouldn't be visible (banned / shadow-banned /
  // deactivated) so moderated abusers don't keep surfacing in who-likes-you.
  const likers = await User.find({
    _id: { $in: likerIds },
    isBanned: { $ne: true },
    isShadowBanned: { $ne: true },
    isDeactivated: { $ne: true }
  });
  const likerMap = new Map(likers.map((u) => [String(u.id), u]));

  // Super Likes float to the top of the list; within each group, newest first
  // (pending is already newest-first from the query).
  const ordered = [...pending].sort((a, b) => Number(b.superLike) - Number(a.superLike));

  const cards = ordered
    .map((s) => {
      const liker = likerMap.get(String(s.fromUserId));
      if (!liker) return null;
      const showFull = pro || revealedSet.has(String(liker.id));
      return showFull
        ? revealedCard(liker, s.crossProfession, s.superLike)
        : blurredCard(liker, s.crossProfession, s.superLike);
    })
    .filter(Boolean);

  return res.json({
    likes: cards,
    count: cards.length,
    isPro: pro,
    revealCost: REVEAL_COST_CREDITS,
    credits: me.credits
  });
}

// POST /likes/reveal { likerId } — spend 1 credit to reveal one specific liker
// (the ₹10 spot-reveal). Pro users and already-revealed likers are free.
async function revealLiker(req, res) {
  const { likerId } = req.body;
  if (!likerId) {
    return res.status(400).json({ message: 'likerId is required' });
  }

  const me = await User.findById(req.auth.id);
  if (!me) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Verify this person actually liked me.
  const like = await Swipe.findOne({ fromUserId: likerId, toUserId: me.id, action: 'like' });
  if (!like) {
    return res.status(404).json({ message: 'This person has not liked you' });
  }

  const liker = await User.findById(likerId);
  if (!liker) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Free cases: Pro, or already revealed.
  if (isProActive(me)) {
    return res.json({ liker: revealedCard(liker, like.crossProfession), charged: 0, credits: me.credits });
  }
  const already = await Reveal.findOne({ userId: me.id, likerId });
  if (already) {
    return res.json({ liker: revealedCard(liker, like.crossProfession), charged: 0, credits: me.credits });
  }

  // Atomically debit a credit (guards against double-spend / races).
  const debited = await User.findOneAndUpdate(
    { _id: me.id, credits: { $gte: REVEAL_COST_CREDITS } },
    { $inc: { credits: -REVEAL_COST_CREDITS } },
    { new: true }
  );

  if (!debited) {
    return res.status(402).json({
      message: 'Not enough credits. Buy credits or go Pro to reveal who likes you.',
      code: 'INSUFFICIENT_CREDITS',
      revealCost: REVEAL_COST_CREDITS,
      credits: me.credits
    });
  }

  // Record the reveal (unique index makes this idempotent under races).
  try {
    await Reveal.create({ userId: me.id, likerId });
  } catch (err) {
    // Duplicate => someone already created it; not an error for the user.
    if (err.code !== 11000) throw err;
  }

  return res.json({
    liker: revealedCard(liker, like.crossProfession),
    charged: REVEAL_COST_CREDITS,
    credits: debited.credits
  });
}

module.exports = {
  getIncomingLikes,
  revealLiker
};
