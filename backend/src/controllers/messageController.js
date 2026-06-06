const { Match, Message, User } = require('../models');
const { emitNewMessage } = require('../realtime/io');
const { sendPush } = require('../utils/push');
const { isProActive } = require('../utils/entitlements');

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

  const messages = await Message.find({ matchId }).sort({ createdAt: 1 });

  return res.json({ messages: messages.map((m) => m.toJSON()) });
}

async function sendMessage(req, res) {
  const { matchId } = req.params;
  const { text } = req.body;
  const userId = req.auth.id;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ message: 'Message text is required' });
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

module.exports = {
  getMessages,
  sendMessage
};
