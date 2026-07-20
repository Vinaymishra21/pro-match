const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { Match, User } = require('../models');
const { isProActive } = require('../utils/entitlements');

let io = null;

// In-memory presence: userId -> number of open sockets (multi-device), and
// last-seen timestamps for offline users. Resets on restart (fine — presence is
// ephemeral). ponytail: unbounded lastSeen map; cap or evict if user count grows.
const onlineCount = new Map();
const lastSeen = new Map();

function roomFor(matchId) {
  return `match:${matchId}`;
}

function isParticipant(match, userId) {
  return String(match.userA) === String(userId) || String(match.userB) === String(userId);
}

function presenceOf(userId) {
  const id = String(userId);
  const online = (onlineCount.get(id) || 0) > 0;
  return { userId: id, online, lastSeen: online ? null : lastSeen.get(id) || null };
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
    // Personal room for user-targeted events (e.g. unread badge bumps) that
    // must reach the user even when they're not viewing that specific match.
    socket.join(`user:${socket.userId}`);

    // Presence: count this connection as online.
    onlineCount.set(socket.userId, (onlineCount.get(socket.userId) || 0) + 1);

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

        // Exchange presence: tell me the other person's status, and tell the
        // room I just came into view (so they see me online).
        const otherId = String(match.userA) === String(socket.userId) ? match.userB : match.userA;
        socket.emit('presence', presenceOf(otherId));
        socket.to(roomFor(matchId)).emit('presence', { userId: String(socket.userId), online: true, lastSeen: null });
      } catch (err) {
        if (typeof ack === 'function') ack({ ok: false, error: 'Join failed' });
      }
    });

    socket.on('match:leave', (matchId) => {
      socket.leave(roomFor(matchId));
    });

    // Typing indicator: relay to the rest of the room (ephemeral, no DB). Only
    // honoured for rooms this socket actually joined.
    socket.on('typing', ({ matchId, typing } = {}) => {
      if (!matchId || !socket.rooms.has(roomFor(matchId))) return;
      socket.to(roomFor(matchId)).emit('typing', {
        matchId: String(matchId),
        userId: String(socket.userId),
        typing: Boolean(typing)
      });
    });

    // Presence: on the last socket closing, mark offline + stamp last-seen and
    // notify every match room this socket was viewing. `disconnecting` fires
    // while socket.rooms is still populated.
    socket.on('disconnecting', () => {
      const next = (onlineCount.get(socket.userId) || 1) - 1;
      if (next > 0) {
        onlineCount.set(socket.userId, next);
        return;
      }
      onlineCount.delete(socket.userId);
      const seen = new Date().toISOString();
      lastSeen.set(socket.userId, seen);
      for (const room of socket.rooms) {
        if (room.startsWith('match:')) {
          socket.to(room).emit('presence', { userId: String(socket.userId), online: false, lastSeen: seen });
        }
      }
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

// Tell a match room that one participant just read the other's messages.
function emitMessagesRead(matchId, payload) {
  if (io) {
    io.to(roomFor(matchId)).emit('messages:read', payload);
  }
}

// Send an event to a specific user across all their devices (personal room).
function emitToUser(userId, event, payload) {
  if (io) {
    io.to(`user:${userId}`).emit(event, payload);
  }
}

function getIo() {
  return io;
}

module.exports = { initIo, emitNewMessage, emitMessagesRead, emitToUser, getIo, roomFor };
