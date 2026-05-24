/**
 * Глобальная real-time синхронизация (ТЗ §9.3–9.4).
 * Слушает события Socket.IO и инвалидирует соответствующие queryKeys.
 * Монтируется один раз — в layout вкладок.
 */
import { useEffect } from 'react';

import { qk } from '@/lib/query';
import { queryClient } from '@/lib/query';
import { getSocket } from '@/lib/socket';

/** Карта: имя события → список queryKey-префиксов для инвалидации. */
const EVENT_MAP: Record<string, readonly (readonly unknown[])[]> = {
  'notification:new': [qk.notifications.all],
  'deal:created': [qk.deals.all, qk.analytics.all],
  'deal:updated': [qk.deals.all, qk.analytics.all],
  'deal:deleted': [qk.deals.all, qk.analytics.all],
  'deal:moved': [qk.deals.all, qk.analytics.all],
  'lead:created': [qk.leads.all, qk.analytics.all],
  'lead:updated': [qk.leads.all, qk.analytics.all],
  'lead:assigned': [qk.leads.all],
  'task:created': [qk.tasks.all, qk.analytics.all],
  'task:updated': [qk.tasks.all, qk.analytics.all],
  'task:completed': [qk.tasks.all, qk.analytics.all],
  'task:assigned': [qk.tasks.all],
  'message:new': [qk.inbox.all, qk.analytics.all],
  'message:read': [qk.inbox.all],
  'contact:created': [qk.contacts.all],
  'contact:updated': [qk.contacts.all],
  'activity:created': [qk.activities.all, qk.analytics.all],
  userOnline: [qk.team.online],
  userOffline: [qk.team.online],
};

export function useRealtimeSync(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;
    const socket = getSocket();

    const handlers: { event: string; fn: () => void }[] = Object.entries(
      EVENT_MAP,
    ).map(([event, keys]) => ({
      event,
      fn: () => {
        for (const key of keys) {
          void queryClient.invalidateQueries({ queryKey: key });
        }
      },
    }));

    for (const { event, fn } of handlers) socket.on(event, fn);

    return () => {
      for (const { event, fn } of handlers) socket.off(event, fn);
    };
  }, [enabled]);
}
