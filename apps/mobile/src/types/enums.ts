/* eslint-disable @typescript-eslint/no-redeclare -- намеренный паттерн:
   const-объект + одноимённый тип (замена TS enum, tree-shakeable). */
/**
 * Доменные enum'ы. Сверены 1:1 с apps/backend/prisma/schema.prisma.
 * При изменении схемы — синхронизировать здесь (ТЗ §5: опционально вынести в packages/shared).
 */

export const UserRole = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  OPERATOR: 'OPERATOR',
  SUPERVISOR: 'SUPERVISOR',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const OrgRole = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  OPERATOR: 'OPERATOR',
} as const;
export type OrgRole = (typeof OrgRole)[keyof typeof OrgRole];

export const DealStatus = {
  NEW: 'NEW',
  QUALIFICATION: 'QUALIFICATION',
  PROPOSAL: 'PROPOSAL',
  NEGOTIATION: 'NEGOTIATION',
  CONTRACT: 'CONTRACT',
  PAYMENT: 'PAYMENT',
  SUCCESS: 'SUCCESS',
  LOST: 'LOST',
} as const;
export type DealStatus = (typeof DealStatus)[keyof typeof DealStatus];

export const DealPriority = { LOW: 'LOW', MEDIUM: 'MEDIUM', HIGH: 'HIGH' } as const;
export type DealPriority = (typeof DealPriority)[keyof typeof DealPriority];

export const DealTemperature = { HOT: 'HOT', WARM: 'WARM', COLD: 'COLD' } as const;
export type DealTemperature = (typeof DealTemperature)[keyof typeof DealTemperature];

export const TaskStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const TaskPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;
export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority];

export const LeadStatus = {
  NEW: 'NEW',
  IN_PROGRESS: 'IN_PROGRESS',
  QUALIFIED: 'QUALIFIED',
  CONVERTED: 'CONVERTED',
  LOST: 'LOST',
} as const;
export type LeadStatus = (typeof LeadStatus)[keyof typeof LeadStatus];

export const LeadSource = {
  WEBSITE: 'WEBSITE',
  CALL: 'CALL',
  EMAIL: 'EMAIL',
  SOCIAL: 'SOCIAL',
  TELEGRAM: 'TELEGRAM',
  WHATSAPP: 'WHATSAPP',
  REFERRAL: 'REFERRAL',
  OTHER: 'OTHER',
} as const;
export type LeadSource = (typeof LeadSource)[keyof typeof LeadSource];

export const ContactSource = {
  WEBSITE: 'WEBSITE',
  PHONE: 'PHONE',
  EMAIL: 'EMAIL',
  WHATSAPP: 'WHATSAPP',
  INSTAGRAM: 'INSTAGRAM',
  TELEGRAM: 'TELEGRAM',
  VK: 'VK',
  REFERRAL: 'REFERRAL',
  DIRECT: 'DIRECT',
  OTHER: 'OTHER',
} as const;
export type ContactSource = (typeof ContactSource)[keyof typeof ContactSource];

export const InvitationStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
} as const;
export type InvitationStatus = (typeof InvitationStatus)[keyof typeof InvitationStatus];

export const BookingStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW',
} as const;
export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

/** Поддерживаемые валюты организаций (Organization.currency). */
export type Currency = 'THB' | 'RUB' | 'USD' | 'EUR';
