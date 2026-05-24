/**
 * Socket.IO singleton (ТЗ §9). Namespace '/', авторизация через auth.token
 * в handshake. Бэкенд (WebsocketsGateway) сам добавляет в комнаты
 * user:<id> / role:<role> / team:<teamId>; экраны подписываются на
 * channel:entityId через subscribe/unsubscribe.
 */
import { io, type Socket } from 'socket.io-client';

import { env } from './env';

export type SocketChannel = 'chat' | 'deal' | 'contact' | 'pipeline';

let socket: Socket | null = null;

/** Возвращает singleton-сокет, создавая его при первом вызове. */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(env.apiUrl, {
      transports: ['websocket'],
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
  }
  return socket;
}

/** Подключение с актуальным accessToken. */
export function connectSocket(accessToken: string): Socket {
  const s = getSocket();
  s.auth = { token: accessToken };
  if (!s.connected) s.connect();
  return s;
}

/** Переустановка токена после refresh (ТЗ §9.1). */
export function updateSocketToken(accessToken: string): void {
  const s = getSocket();
  s.auth = { token: accessToken };
  if (s.connected) {
    s.disconnect();
    s.connect();
  }
}

export function disconnectSocket(): void {
  socket?.disconnect();
}

/** Подписка на комнату channel:entityId. Возвращает функцию отписки. */
export function subscribeRoom(channel: SocketChannel, entityId: string): () => void {
  const s = getSocket();
  s.emit('subscribe', { channel, entityId });
  return () => {
    s.emit('unsubscribe', { channel, entityId });
  };
}
