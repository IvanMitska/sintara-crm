/** Типы booking + automation. Сверены с schema.prisma и booking.service.ts. */
import type { Booking } from './entities';

export interface Resource {
  id: string;
  name: string;
  type: string;
  category: string;
  color: string;
  avatar?: string | null;
  description?: string | null;
  slotDuration: number;
  isActive: boolean;
}

export interface Service {
  id: string;
  name: string;
  description?: string | null;
  duration: number;
  price: string;
  currency: string;
  color: string;
  isActive: boolean;
}

/** GET /booking/schedule → { bookings, byResource, total }. */
export interface ScheduleOverview {
  bookings: Booking[];
  byResource: Record<string, Booking[]>;
  total: number;
}

/** GET /booking/stats. */
export interface BookingStats {
  total: number;
  byStatus: {
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    noShow: number;
  };
}

/** Автоматизация (триггер/условия/действия — Json, на мобильном read-only). */
export interface Automation {
  id: string;
  name: string;
  description?: string | null;
  trigger: unknown;
  conditions?: unknown;
  actions: unknown;
  isActive: boolean;
  lastRunAt?: string | null;
  createdAt: string;
  updatedAt: string;
}
