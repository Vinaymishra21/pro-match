const { User, Match, Report } = require('../models');
const { REPORT_REASONS } = require('../models/Report');

// POST /safety/block { userId }
// Adds userId to my block list and soft-marks any match between us as 'blocked'.
async function blockUser(req, res) {
  const meId = req.auth.id;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'userId is required' });
  }
  if (String(userId) === String(meId)) {
    return res.status(400).json({ message: "You can't block yourself" });
  }

  const target = await User.findById(userId);
  if (!target) {
    return res.status(404).json({ message: 'User not found' });
  }

  await User.updateOne({ _id: meId }, { $addToSet: { blockedUsers: userId } });

  // Hide any match between us from both sides.
  await Match.updateMany(
    {
      status: 'active',
      $or: [
        { userA: meId, userB: userId },
        { userA: userId, userB: meId }
      ]
    },
    { status: 'blocked', endedBy: meId }
  );

  return res.json({ ok: true, blockedUserId: String(userId) });
}

// POST /safety/unblock { userId }
async function unblockUser(req, res) {
  const meId = req.auth.id;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'userId is required' });
  }

  await User.updateOne({ _id: meId }, { $pull: { blockedUsers: userId } });
  // Note: a blocked match is NOT auto-restored — they'd need to re-match.
  return res.json({ ok: true, unblockedUserId: String(userId) });
}

// GET /safety/blocked — list of users I've blocked (for a settings screen).
async function getBlocked(req, res) {
  const me = await User.findById(req.auth.id).populate('blockedUsers', 'name profession photos');
  if (!me) {
    return res.status(404).json({ message: 'User not found' });
  }

  const blocked = (me.blockedUsers || []).map((u) => ({
    id: u.id,
    name: u.name,
    profession: u.profession,
    photo: (u.photos && u.photos[0]) || ''
  }));

  return res.json({ blocked });
}

// POST /safety/unmatch { matchId }
// Soft-ends a match. Either participant can unmatch; hidden from both.
async function unmatch(req, res) {
  const meId = req.auth.id;
  const { matchId } = req.body;

  if (!matchId) {
    return res.status(400).json({ message: 'matchId is required' });
  }

  const match = await Match.findById(matchId);
  if (!match) {
    return res.status(404).json({ message: 'Match not found' });
  }

  const isParticipant =
    String(match.userA) === String(meId) || String(match.userB) === String(meId);
  if (!isParticipant) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  if (match.status === 'active') {
    match.status = 'unmatched';
    match.endedBy = meId;
    await match.save();
  }

  return res.json({ ok: true, matchId: String(matchId) });
}

// GET /safety/report-reasons — the valid reason list for the client picker.
function getReportReasons(_req, res) {
  return res.json({ reasons: REPORT_REASONS });
}

// POST /safety/report { userId, reason, note?, alsoBlock? }
// Files a moderation report. If alsoBlock is true, also blocks the user and
// ends any active match between them (same effect as /safety/block).
async function reportUser(req, res) {
  const meId = req.auth.id;
  const { userId, reason, note, alsoBlock } = req.body;

  if (!userId || !reason) {
    return res.status(400).json({ message: 'userId and reason are required' });
  }
  if (String(userId) === String(meId)) {
    return res.status(400).json({ message: "You can't report yourself" });
  }
  if (!REPORT_REASONS.includes(reason)) {
    return res.status(400).json({ message: 'Invalid reason' });
  }

  const target = await User.findById(userId);
  if (!target) {
    return res.status(404).json({ message: 'User not found' });
  }

  const wantsBlock = Boolean(alsoBlock);

  await Report.create({
    reporter: meId,
    reportedUser: userId,
    reason,
    note: typeof note === 'string' ? note.slice(0, 1000) : '',
    alsoBlocked: wantsBlock
  });

  if (wantsBlock) {
    await User.updateOne({ _id: meId }, { $addToSet: { blockedUsers: userId } });
    await Match.updateMany(
      {
        status: 'active',
        $or: [
          { userA: meId, userB: userId },
          { userA: userId, userB: meId }
        ]
      },
      { status: 'blocked', endedBy: meId }
    );
  }

  return res.json({ ok: true, blocked: wantsBlock });
}

module.exports = {
  blockUser,
  unblockUser,
  getBlocked,
  unmatch,
  getReportReasons,
  reportUser
};
