/**
 * Сообщения / омниканальный инбокс. Сверено с messages.controller.ts.
 * Backend агрегирует переписку ПО КОНТАКТУ — диалог = тред с contactId.
 */
import type {
  ChannelStat,
  ConversationsResponse,
  ConversationThread,
} from '@/types';

import { api } from './client';

export interface ConversationsFilter {
  skip?: number;
  take?: number;
  channel?: string;
  search?: string;
  unreadOnly?: boolean;
}

export interface SendMessagePayload {
  contactId: string;
  channel: string;
  content: string;
}

export const messagesApi = {
  /** GET /messages/conversations — { data, total, channels }. */
  conversations: (filter?: ConversationsFilter) =>
    api
      .get<ConversationsResponse>('/messages/conversations', { params: filter })
      .then((r) => r.data),

  /** GET /messages/conversations/:contactId — тред переписки. */
  thread: (contactId: string) =>
    api
      .get<ConversationThread>(`/messages/conversations/${contactId}`)
      .then((r) => r.data),

  /** PATCH /messages/conversations/:contactId/read — пометить тред прочитанным. */
  markThreadRead: (contactId: string) =>
    api
      .patch(`/messages/conversations/${contactId}/read`)
      .then((r) => r.data),

  /** GET /messages/stats/channels. */
  channelStats: () =>
    api.get<ChannelStat[]>('/messages/stats/channels').then((r) => r.data),

  /** GET /messages/stats/unread → { unreadCount } — для бэйджа таб-бара. */
  unreadStats: () =>
    api
      .get<{ unreadCount: number }>('/messages/stats/unread')
      .then((r) => r.data),

  /** POST /messages/send — бэкенд роутит в нужный канал. */
  send: (payload: SendMessagePayload) =>
    api.post('/messages/send', payload).then((r) => r.data),

  /** PATCH /messages/:id/read. */
  markRead: (id: string) =>
    api.patch(`/messages/${id}/read`).then((r) => r.data),
};
