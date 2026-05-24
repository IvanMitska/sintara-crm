/** Онлайн-запись. Сверено с booking.controller.ts. */
import type {
  Booking,
  BookingStats,
  ListResponse,
  Resource,
  ScheduleOverview,
  Service,
} from '@/types';

import { api } from './client';

export const bookingApi = {
  /** GET /booking/resources — Resource[]. */
  resources: () => api.get<Resource[]>('/booking/resources').then((r) => r.data),

  /** GET /booking/services — Service[]. */
  services: () => api.get<Service[]>('/booking/services').then((r) => r.data),

  /** GET /booking — { data, total, skip, take }. */
  bookings: (params?: { skip?: number; take?: number; status?: string }) =>
    api.get<ListResponse<Booking>>('/booking', { params }).then((r) => r.data),

  /** GET /booking/:id. */
  byId: (id: string) => api.get<Booking>(`/booking/${id}`).then((r) => r.data),

  /** GET /booking/schedule?resourceIds=&dateFrom=&dateTo=. */
  schedule: (dateFrom: string, dateTo: string, resourceIds?: string[]) =>
    api
      .get<ScheduleOverview>('/booking/schedule', {
        params: { dateFrom, dateTo, resourceIds: resourceIds?.join(',') },
      })
      .then((r) => r.data),

  /** GET /booking/stats?dateFrom=&dateTo=. */
  stats: (dateFrom?: string, dateTo?: string) =>
    api
      .get<BookingStats>('/booking/stats', { params: { dateFrom, dateTo } })
      .then((r) => r.data),

  /** POST /booking — создать бронь. */
  create: (data: BookingInput) =>
    api.post<Booking>('/booking', data).then((r) => r.data),

  /** PATCH /booking/:id/confirm. */
  confirm: (id: string) =>
    api.patch<Booking>(`/booking/${id}/confirm`).then((r) => r.data),

  /** PATCH /booking/:id/cancel. */
  cancel: (id: string, reason?: string) =>
    api.patch<Booking>(`/booking/${id}/cancel`, { reason }).then((r) => r.data),

  /** PATCH /booking/:id/complete. */
  complete: (id: string) =>
    api.patch<Booking>(`/booking/${id}/complete`).then((r) => r.data),

  /** PATCH /booking/:id/no-show. */
  noShow: (id: string) =>
    api.patch<Booking>(`/booking/${id}/no-show`).then((r) => r.data),
};

export interface BookingInput {
  title?: string;
  description?: string;
  startTime: string;
  endTime: string;
  notes?: string;
  resourceId: string;
  serviceId?: string;
  contactId?: string;
  clientName?: string;
  clientPhone?: string;
}
