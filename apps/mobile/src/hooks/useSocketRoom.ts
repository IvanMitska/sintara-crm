/**
 * Подписка экрана на комнату Socket.IO (ТЗ §9.2).
 * subscribe при монтировании, unsubscribe при размонтировании;
 * опционально вешает обработчики на события и инвалидирует queryKeys.
 */
import { useEffect } from 'react';

import { queryClient } from '@/lib/query';
import { getSocket, subscribeRoom, type SocketChannel } from '@/lib/socket';

interface UseSocketRoomOptions {
  /** События комнаты → queryKeys для инвалидации. */
  invalidateOn?: Record<string, readonly unknown[]>;
}

export function useSocketRoom(
  channel: SocketChannel,
  entityId: string | undefined,
  options?: UseSocketRoomOptions,
): void {
  const invalidateOn = options?.invalidateOn;

  useEffect(() => {
    if (!entityId) return;
    const unsubscribe = subscribeRoom(channel, entityId);
    const socket = getSocket();

    const handlers: { event: string; fn: () => void }[] = [];
    if (invalidateOn) {
      for (const [event, key] of Object.entries(invalidateOn)) {
        const fn = () => {
          void queryClient.invalidateQueries({ queryKey: key });
        };
        socket.on(event, fn);
        handlers.push({ event, fn });
      }
    }

    return () => {
      for (const { event, fn } of handlers) socket.off(event, fn);
      unsubscribe();
    };
    // invalidateOn — стабильный объект из вызывающего кода.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, entityId]);
}
