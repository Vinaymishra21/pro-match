import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { getUnreadTotal } from '../services/apiService';
import { getSocket } from '../services/socket';

interface UnreadValue {
  total: number;
  refresh: () => void;
}

const UnreadContext = createContext<UnreadValue>({ total: 0, refresh: () => {} });

export function useUnread() {
  return useContext(UnreadContext);
}

// Tracks the total unread-message count for the Matches tab badge. Refetches the
// authoritative count on login / foreground / explicit refresh, and bumps it
// live via a per-user socket event so it updates even for unopened chats.
export function UnreadProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [total, setTotal] = useState(0);

  const refresh = useCallback(() => {
    if (!token) {
      setTotal(0);
      return;
    }
    getUnreadTotal(token)
      .then((res) => setTotal(res.total || 0))
      .catch(() => {}); // non-fatal; keep the last known count
  }, [token]);

  // Authoritative refetch on login and whenever the app returns to foreground.
  useEffect(() => {
    refresh();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  // Live bump when a message lands in any of my matches while the app is open.
  useEffect(() => {
    if (!token) return undefined;
    const socket = getSocket(token);
    const bump = () => setTotal((t) => t + 1);
    socket.on('unread:bump', bump);
    return () => {
      socket.off('unread:bump', bump);
    };
  }, [token]);

  return <UnreadContext.Provider value={{ total, refresh }}>{children}</UnreadContext.Provider>;
}
