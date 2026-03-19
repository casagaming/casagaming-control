import { useState, useEffect, useCallback } from 'react';
import Pusher from 'pusher-js';
import { db } from './db';

const STORAGE_KEY = 'kace_lastSeenOrdersAt';

export function useNewOrders() {
  const [newCount, setNewCount] = useState(0);

  const getLastSeen = (): string => {
    return localStorage.getItem(STORAGE_KEY) || new Date(0).toISOString();
  };

  const markAsSeen = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    setNewCount(0);
  }, []);

  useEffect(() => {
    async function fetchNewCount() {
      try {
        const lastSeen = getLastSeen();
        const result = await db.execute({
          sql: "SELECT COUNT(*) as count FROM orders WHERE created_at > ?",
          args: [lastSeen],
        });
        setNewCount(Number(result.rows[0]?.count || 0));
      } catch {}
    }
    fetchNewCount();
  }, []);

  return { newCount, markAsSeen };
}

export function usePusherOrders(onNewOrder: (data: any) => void) {
  useEffect(() => {
    const pusher = new Pusher('6f398ffd3b06e741d29f', { cluster: 'eu' });
    const channel = pusher.subscribe('orders-channel');
    channel.bind('new-order', onNewOrder);
    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      pusher.disconnect();
    };
  }, [onNewOrder]);
}
