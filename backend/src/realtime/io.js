const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { Match, User } = require('../models');
const { isProActive } = require('../utils/entitlements');

let io = null;

function roomFor(matchId) {
  return `match:${matchId}`;
}

function isParticipant(match, userId) {
  return String(match.userA) === String(userId) || String(match.userB) === String(userId);
}

function initIo(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: '*' }
  });

  // Authenticate every socket via the same JWT used for REST.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Unauthorized'));
    }
    try {
      socket.userId = jwt.verify(token, process.env.JWT_SECRET).id;
      return next();
    } catch (err) {
      return next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    // Join a match room only if the user is a participant.
    socket.on('match:join', async (matchId, ack) => {
      try {
        const match = await Match.findById(matchId);
        if (!match || !isParticipant(match, socket.userId)) {
          if (typeof ack === 'function') ack({ ok: false, error: 'Forbidden' });
          return;
        }
        // Cross-profession chat requires Pro (mirrors the REST guard).
        if (match.crossProfession) {
          const user = await User.findById(socket.userId);
          if (!isProActive(user)) {
            if (typeof ack === 'function') ack({ ok: false, error: 'PRO_REQUIRED' });
            return;
          }
        }
        socket.join(roomFor(matchId));
        if (typeof ack === 'function') ack({ ok: true });
      } catch (err) {
        if (typeof ack === 'function') ack({ ok: false, error: 'Join failed' });
      }
    });

    socket.on('match:leave', (matchId) => {
      socket.leave(roomFor(matchId));
    });
  });

  return io;
}

// Broadcast a newly created message to everyone in the match room.
function emitNewMessage(matchId, message) {
  if (io) {
    io.to(roomFor(matchId)).emit('message:new', message);
  }
}

function getIo() {
  return io;
}

module.exports = { initIo, emitNewMessage, getIo, roomFor };
