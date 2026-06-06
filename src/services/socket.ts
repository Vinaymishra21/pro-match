import { io, type Socket } from 'socket.io-client';
import { API_BASE_URL } from '../constants/api';

let socket: Socket | null = null;

// One shared, authenticated socket connection for the whole app.
export function getSocket(token: string): Socket {
  if (socket && socket.connected) {
    return socket;
  }

  if (socket) {
    socket.auth = { token };
    socket.connect();
    return socket;
  }

  socket = io(API_BASE_URL, {
    auth: { token },
    transports: ['websocket'],
    autoConnect: true
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
