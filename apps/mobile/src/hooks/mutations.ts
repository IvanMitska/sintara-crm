/**
 * Mutation-хуки (ТЗ §21 Фаза 3). Создание/редактирование/удаление + действия.
 * Optimistic updates (§9.5) для: выполнение задачи, перемещение сделки,
 * отправка сообщения.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  activitiesApi,
  bookingApi,
  companiesApi,
  contactsApi,
  dealsApi,
  integrationsApi,
  invitationsApi,
  leadsApi,
  messagesApi,
  productsApi,
  tasksApi,
  teamApi,
} from '@/api';
import type {
  ActivityInput,
  BookingInput,
  DealInput,
  LeadInput,
  ProductInput,
  SendMessagePayload,
  TaskInput,
} from '@/api';
import { enqueue } from '@/lib/offline-queue';
import { qk } from '@/lib/query';
import { useUiStore } from '@/store/ui.store';
import type {
  Company,
  Contact,
  ConversationThread,
  ListResponse,
  Message,
  OrgRole,
  PipelineBoard,
  Task,
  TaskStatus,
} from '@/types';

/** true, если сейчас нет сети (для решения «онлайн или в outbox»). */
function isOffline(): boolean {
  return useUiStore.getState().offline;
}

// ─── Deals ──────────────────────────────────────────────────────────────────

export function useCreateDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: DealInput) => dealsApi.create(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.deals.all });
      void qc.invalidateQueries({ queryKey: qk.analytics.all });
    },
  });
}

export function useUpdateDeal(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<DealInput>) => dealsApi.update(id, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.deals.all });
    },
  });
}

export function useDeleteDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dealsApi.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.deals.all });
      void qc.invalidateQueries({ queryKey: qk.analytics.all });
    },
  });
}

/** Перемещение сделки между этапами с optimistic-обновлением доски (§9.5). */
export function useMoveDeal(pipelineId: string) {
  const qc = useQueryClient();
  const boardKey = qk.deals.board(pipelineId);

  return useMutation({
    mutationFn: ({ dealId, stageId }: { dealId: string; stageId: string }) =>
      dealsApi.move(dealId, stageId),
    onMutate: async ({ dealId, stageId }) => {
      await qc.cancelQueries({ queryKey: boardKey });
      const prev = qc.getQueryData<PipelineBoard>(boardKey);
      if (prev) {
        const next: PipelineBoard = {
          ...prev,
          stages: (() => {
            // Находим перемещаемую сделку.
            let moved: PipelineBoard['stages'][number]['deals'][number] | undefined;
            const stripped = prev.stages.map((stage) => {
              const found = stage.deals.find((d) => d.id === dealId);
              if (found) moved = found;
              return {
                ...stage,
                deals: stage.deals.filter((d) => d.id !== dealId),
              };
            });
            if (!moved) return prev.stages;
            return stripped.map((stage) =>
              stage.id === stageId
                ? { ...stage, deals: [{ ...moved!, stageId }, ...stage.deals] }
                : stage,
            );
          })(),
        };
        qc.setQueryData(boardKey, next);
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(boardKey, ctx.prev);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: qk.deals.all });
    },
  });
}

export function useDealStageAction(id: string) {
  const qc = useQueryClient();
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: qk.deals.all });
    void qc.invalidateQueries({ queryKey: qk.analytics.all });
  };
  return {
    win: useMutation({ mutationFn: () => dealsApi.won(id), onSuccess: invalidate }),
    lose: useMutation({ mutationFn: () => dealsApi.lost(id), onSuccess: invalidate }),
    duplicate: useMutation({
      mutationFn: () => dealsApi.duplicate(id),
      onSuccess: invalidate,
    }),
  };
}

// ─── Leads ──────────────────────────────────────────────────────────────────

export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: LeadInput) => leadsApi.create(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.leads.all });
      void qc.invalidateQueries({ queryKey: qk.analytics.all });
    },
  });
}

export function useUpdateLead(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<LeadInput>) => leadsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.leads.all }),
  });
}

export function useConvertLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => leadsApi.convert(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.leads.all });
      void qc.invalidateQueries({ queryKey: qk.deals.all });
      void qc.invalidateQueries({ queryKey: qk.contacts.all });
    },
  });
}

export function useDeleteLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => leadsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.leads.all }),
  });
}

// ─── Contacts ───────────────────────────────────────────────────────────────

export function useCreateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Contact>) => contactsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.contacts.all }),
  });
}

export function useUpdateContact(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Contact>) => contactsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.contacts.all }),
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => contactsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.contacts.all }),
  });
}

/** Объединение дубликатов контактов (ТЗ §8.6). */
export function useMergeContacts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      originalId,
      duplicateId,
    }: {
      originalId: string;
      duplicateId: string;
    }) => contactsApi.merge(originalId, duplicateId),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.contacts.all }),
  });
}

// ─── Companies ──────────────────────────────────────────────────────────────

export function useCreateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Company>) => companiesApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.companies.all }),
  });
}

export function useUpdateCompany(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Company>) => companiesApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.companies.all }),
  });
}

// ─── Tasks ──────────────────────────────────────────────────────────────────

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TaskInput): Promise<Task | null> => {
      if (isOffline()) {
        enqueue({
          label: 'Создание задачи',
          method: 'post',
          endpoint: '/tasks',
          body: data,
          invalidate: [qk.tasks.all, qk.analytics.all],
        });
        return Promise.resolve(null);
      }
      return tasksApi.create(data);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.tasks.all });
      void qc.invalidateQueries({ queryKey: qk.analytics.all });
    },
  });
}

export function useCreateRecurringTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TaskInput & { pattern: string }) =>
      tasksApi.createRecurring(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.tasks.all }),
  });
}

export function useUpdateTask(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<TaskInput & { status: TaskStatus }>) =>
      tasksApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.tasks.all }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tasksApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.tasks.all }),
  });
}

/** Выполнение задачи с optimistic-обновлением списков и «Сегодня» (§9.5). */
export function useCompleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string): Promise<Task | null> => {
      if (isOffline()) {
        enqueue({
          label: 'Выполнение задачи',
          method: 'post',
          endpoint: `/tasks/${id}/complete`,
          invalidate: [qk.tasks.all, qk.analytics.all],
        });
        return Promise.resolve(null);
      }
      return tasksApi.complete(id);
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: qk.tasks.all });
      const snapshots = qc.getQueriesData<ListResponse<Task>>({
        queryKey: ['tasks', 'list'],
      });
      // Помечаем задачу выполненной в каждом закэшированном списке.
      for (const [key, value] of snapshots) {
        if (!value) continue;
        qc.setQueryData<ListResponse<Task>>(key, {
          ...value,
          data: value.data.map((t) =>
            t.id === id ? { ...t, status: 'COMPLETED' as TaskStatus } : t,
          ),
        });
      }
      const today = qc.getQueryData<Task[]>(qk.analytics.todayTasks);
      if (today) {
        qc.setQueryData<Task[]>(
          qk.analytics.todayTasks,
          today.map((t) =>
            t.id === id ? { ...t, status: 'COMPLETED' as TaskStatus } : t,
          ),
        );
      }
      return { snapshots, today };
    },
    onError: (_e, _id, ctx) => {
      ctx?.snapshots?.forEach(([key, value]) => qc.setQueryData(key, value));
      if (ctx?.today) qc.setQueryData(qk.analytics.todayTasks, ctx.today);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: qk.tasks.all });
      void qc.invalidateQueries({ queryKey: qk.analytics.all });
    },
  });
}

// ─── Activities ─────────────────────────────────────────────────────────────

export function useCreateActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ActivityInput): Promise<unknown> => {
      if (isOffline()) {
        enqueue({
          label: 'Создание активности',
          method: 'post',
          endpoint: '/activities',
          body: data,
          invalidate: [qk.activities.all],
        });
        return Promise.resolve(null);
      }
      return activitiesApi.create(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.activities.all }),
  });
}

// ─── Products ───────────────────────────────────────────────────────────────

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ProductInput) => productsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.products.all }),
  });
}

export function useUpdateProduct(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ProductInput>) => productsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.products.all }),
  });
}

// ─── Messages ───────────────────────────────────────────────────────────────

/** Отправка сообщения с optimistic-добавлением в тред (§9.5, отклик < 50мс). */
export function useSendMessage(contactId: string) {
  const qc = useQueryClient();
  const threadKey = qk.inbox.thread(contactId);

  return useMutation({
    mutationFn: (payload: SendMessagePayload): Promise<unknown> => {
      if (isOffline()) {
        enqueue({
          label: 'Отправка сообщения',
          method: 'post',
          endpoint: '/messages/send',
          body: payload,
          invalidate: [threadKey, qk.inbox.all],
        });
        return Promise.resolve(null);
      }
      return messagesApi.send(payload);
    },
    onMutate: async (payload) => {
      await qc.cancelQueries({ queryKey: threadKey });
      const prev = qc.getQueryData<ConversationThread>(threadKey);
      if (prev) {
        const optimistic: Message = {
          id: `temp-${Date.now()}`,
          channel: payload.channel,
          direction: 'outbound',
          content: payload.content,
          isRead: true,
          contactId,
          createdAt: new Date().toISOString(),
        };
        qc.setQueryData<ConversationThread>(threadKey, {
          ...prev,
          messages: [...prev.messages, optimistic],
        });
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(threadKey, ctx.prev);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: threadKey });
      void qc.invalidateQueries({ queryKey: qk.inbox.all });
    },
  });
}

// ─── Booking ────────────────────────────────────────────────────────────────

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: BookingInput) => bookingApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.booking.all }),
  });
}

export function useBookingStatusAction() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: qk.booking.all });
  return {
    confirm: useMutation({
      mutationFn: (id: string) => bookingApi.confirm(id),
      onSuccess: invalidate,
    }),
    cancel: useMutation({
      mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
        bookingApi.cancel(id, reason),
      onSuccess: invalidate,
    }),
    complete: useMutation({
      mutationFn: (id: string) => bookingApi.complete(id),
      onSuccess: invalidate,
    }),
    noShow: useMutation({
      mutationFn: (id: string) => bookingApi.noShow(id),
      onSuccess: invalidate,
    }),
  };
}

// ─── Team / Invitations ─────────────────────────────────────────────────────

export function useChangeUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: OrgRole }) =>
      teamApi.changeRole(id, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.team.users }),
  });
}

export function useToggleUserActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => teamApi.toggleActive(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.team.users }),
  });
}

export function useCreateInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { email: string; role?: string }) =>
      invitationsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invitations'] }),
  });
}

export function useResendInvitation() {
  return useMutation({ mutationFn: (id: string) => invitationsApi.resend(id) });
}

export function useCancelInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invitationsApi.cancel(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invitations'] }),
  });
}

// ─── Integrations ───────────────────────────────────────────────────────────

export function useConnectIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      config,
    }: {
      id: string;
      config: Record<string, unknown>;
    }) => integrationsApi.connect(id, config),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['integrations'] }),
  });
}

export function useDisconnectIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => integrationsApi.disconnect(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['integrations'] }),
  });
}
