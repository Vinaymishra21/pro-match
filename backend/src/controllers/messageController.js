const { Match, Message, User } = require('../models');
const { emitNewMessage, emitMessagesRead, emitToUser } = require('../realtime/io');
const { sendPush } = require('../utils/push');
const { publicProfile } = require('../utils/auth');
const { isProActive } = require('../utils/entitlements');
const { scanText, describe } = require('../utils/contentFilter');
const { recordSpamStrike } = require('../utils/moderation');

function isParticipant(match, userId) {
  return (
    String(match.userA) === String(userId) || String(match.userB) === String(userId)
  );
}

// Cross-profession matches require Pro to open the conversation. Returns the
// requesting user document (loaded once) when allowed, or sends a 403 and
// returns null when blocked.
async function ensureChatAllowed(match, userId, res) {
  // A match that's been unmatched or blocked is no longer a conversation.
  if (match.status && match.status !== 'active') {
    res.status(403).json({ message: 'This conversation is no longer available.', code: 'MATCH_ENDED' });
    return false;
  }
  if (!match.crossProfession) {
    return true;
  }
  const user = await User.findById(userId);
  if (!isProActive(user)) {
    res.status(403).json({
      message: 'Upgrade to Pro to chat with matches from other professions.',
      code: 'PRO_REQUIRED'
    });
    return false;
  }
  return true;
}

// Marks the OTHER participant's unread messages as read and, if any changed,
// tells the room so their "· Read" updates live. Returns how many were marked.
async function markOtherMessagesRead(match, userId) {
  const otherId = String(match.userA) === String(userId) ? match.userB : match.userA;
  const readAt = new Date();
  const result = await Message.updateMany(
    { matchId: match._id, senderId: otherId, readAt: null },
    { $set: { readAt } }
  );
  if (result.modifiedCount > 0) {
    emitMessagesRead(match._id, {
      matchId: String(match._id),
      readerId: String(userId),
      readAt: readAt.toISOString()
    });
  }
  return result.modifiedCount;
}

async function getMessages(req, res) {
  const { matchId } = req.params;
  const userId = req.auth.id;

  const match = await Match.findById(matchId);

  if (!match) {
    return res.status(404).json({ message: 'Match not found' });
  }

  if (!isParticipant(match, userId)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  if (!(await ensureChatAllowed(match, userId, res))) {
    return undefined;
  }

  const otherId = String(match.userA) === String(userId) ? match.userB : match.userA;

  // Opening the chat marks the other person's messages read (+ live receipt).
  await markOtherMessagesRead(match, userId);

  // Pagination: newest `limit` messages, older ones fetched via `?before=<ISO>`.
  // We query newest-first with the cursor, then reverse to chronological order.
  const limit = Math.min(Number(req.query.limit) || 30, 100);
  const query = { matchId };
  if (req.query.before) {
    const before = new Date(req.query.before);
    if (!Number.isNaN(before.getTime())) query.createdAt = { $lt: before };
  }
  const page = await Message.find(query).sort({ createdAt: -1 }).limit(limit + 1);
  const hasMore = page.length > limit;
  const messages = page.slice(0, limit).reverse();

  // Only the first page (no cursor) needs the profile for opener suggestions.
  const other = req.query.before ? null : await User.findById(otherId);

  return res.json({
    messages: messages.map((m) => m.toJSON()),
    hasMore,
    otherUser: other ? publicProfile(other) : null
  });
}

async function sendMessage(req, res) {
  const { matchId } = req.params;
  const { text } = req.body;
  const userId = req.auth.id;

  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ message: 'Message text is required' });
  }
  if (text.length > 2000) {
    return res.status(400).json({ message: 'Message is too long (2000 characters max).' });
  }

  // Content filter: block off-platform hand-offs / links / scam solicitations.
  // Each blocked attempt is a strike; enough strikes shadow-bans the sender.
  const scan = scanText(text);
  if (!scan.clean) {
    const strike = await recordSpamStrike(userId, 'blocked chat content');
    return res.status(400).json({
      message: `Message blocked — it looks like it contains ${describe(scan.reasons)}. For your safety, keep chats on Wovnn and don't share contact details.`,
      code: 'CONTENT_BLOCKED',
      reasons: scan.reasons.map((r) => r.code),
      shadowBanned: strike.shadowBanned
    });
  }

  const match = await Match.findById(matchId);

  if (!match) {
    return res.status(404).json({ message: 'Match not found' });
  }

  if (!isParticipant(match, userId)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  if (!(await ensureChatAllowed(match, userId, res))) {
    return undefined;
  }

  const message = await Message.create({
    matchId,
    senderId: userId,
    text: text.trim()
  });

  match.lastMessageAt = message.createdAt;
  await match.save();

  const payload = message.toJSON();
  // Broadcast to the match room so the other participant gets it in real time.
  emitNewMessage(matchId, payload);

  // Push-notify the recipient (fire-and-forget; never blocks the response).
  const recipientId = String(match.userA) === String(userId) ? match.userB : match.userA;

  // Live unread-badge bump — reaches the recipient even if they aren't in this
  // chat room (personal user room), so the Matches tab badge updates instantly.
  emitToUser(recipientId, 'unread:bump', { matchId: String(matchId) });
  Promise.all([User.findById(recipientId), User.findById(userId)])
    .then(([recipient, sender]) => {
      if (recipient?.pushToken) {
        return sendPush(recipient.pushToken, {
          title: sender?.name || 'New message',
          body: text.trim().slice(0, 120),
          data: { type: 'message', matchId: String(matchId) }
        });
      }
    })
    .catch((err) => console.warn('message push failed:', err.message));

  return res.status(201).json({ message: payload });
}

// POST /messages/:matchId/read — mark the other person's messages read. Called
// when a message arrives while the chat is already open (open itself goes
// through getMessages).
async function markRead(req, res) {
  const { matchId } = req.params;
  const userId = req.auth.id;

  const match = await Match.findById(matchId);
  if (!match) {
    return res.status(404).json({ message: 'Match not found' });
  }
  if (!isParticipant(match, userId)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const readCount = await markOtherMessagesRead(match, userId);
  return res.json({ readCount });
}

module.exports = {
  getMessages,
  sendMessage,
  markRead
};
