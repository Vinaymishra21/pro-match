const { v4: uuidv4 } = require('uuid');
const { readDb, writeDb } = require('../utils/db');

function getMessages(req, res) {
  const { matchId } = req.params;
  const userId = req.auth.id;

  const db = readDb();
  const match = db.matches.find((m) => m.id === matchId);

  if (!match) {
    return res.status(404).json({ message: 'Match not found' });
  }

  if (match.userA !== userId && match.userB !== userId) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const messages = db.messages
    .filter((msg) => msg.matchId === matchId)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  return res.json({ messages });
}

function sendMessage(req, res) {
  const { matchId } = req.params;
  const { text } = req.body;
  const userId = req.auth.id;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ message: 'Message text is required' });
  }

  const db = readDb();
  const match = db.matches.find((m) => m.id === matchId);

  if (!match) {
    return res.status(404).json({ message: 'Match not found' });
  }

  if (match.userA !== userId && match.userB !== userId) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const message = {
    id: uuidv4(),
    matchId,
    senderId: userId,
    text: text.trim(),
    createdAt: new Date().toISOString()
  };

  db.messages.push(message);
  writeDb(db);

  return res.status(201).json({ message });
}

module.exports = {
  getMessages,
  sendMessage
};
