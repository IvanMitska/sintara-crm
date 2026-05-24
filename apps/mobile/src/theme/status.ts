/**
 * Семантика статусов → цвета бэйджей (ТЗ §6.4).
 * Значения enum'ов сверены с apps/backend/prisma/schema.prisma.
 */
import { colors } from './tokens';

const GRAY = 'rgba(245,245,247,0.55)';

export const dealStatusColor: Record<string, string> = {
  NEW: GRAY,
  QUALIFICATION: colors.status.info,
  PROPOSAL: colors.brand.accent600,
  NEGOTIATION: colors.status.warning,
  CONTRACT: colors.brand.primary500,
  PAYMENT: colors.brand.accent500,
  SUCCESS: colors.status.success,
  LOST: colors.status.danger,
};

export const dealPriorityColor: Record<string, string> = {
  LOW: GRAY,
  MEDIUM: colors.status.warning,
  HIGH: colors.status.danger,
};

export const dealTemperature: Record<string, { color: string; icon: string }> = {
  HOT: { color: colors.status.danger, icon: '🔥' },
  WARM: { color: colors.status.warning, icon: '🌡' },
  COLD: { color: colors.status.info, icon: '❄️' },
};

export const taskStatusColor: Record<string, string> = {
  PENDING: GRAY,
  IN_PROGRESS: colors.status.info,
  COMPLETED: colors.status.success,
  CANCELLED: GRAY,
};

export const taskPriorityColor: Record<string, string> = {
  LOW: GRAY,
  MEDIUM: colors.status.warning,
  HIGH: colors.status.danger,
  URGENT: colors.status.danger, // URGENT — красный пульсирующий (анимация в Badge)
};

export const leadStatusColor: Record<string, string> = {
  NEW: GRAY,
  IN_PROGRESS: colors.status.info,
  QUALIFIED: colors.status.warning,
  CONVERTED: colors.status.success,
  LOST: colors.status.danger,
};

export const bookingStatusColor: Record<string, string> = {
  PENDING: GRAY,
  CONFIRMED: colors.status.info,
  IN_PROGRESS: colors.brand.primary500,
  COMPLETED: colors.status.success,
  CANCELLED: GRAY,
  NO_SHOW: colors.status.danger,
};
