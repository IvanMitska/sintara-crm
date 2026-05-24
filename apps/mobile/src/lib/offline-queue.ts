/**
 * Offline outbox (ТЗ §11.2). Очередь мутаций в MMKV: при отсутствии сети
 * запись ставится в очередь, при восстановлении — FIFO-синхронизация
 * (≤ 3 параллельно, exponential retry, лимит 100).
 *
 * В outbox попадают только idempotent-безопасные операции (ТЗ §11.2):
 * создание задач/активностей/заметок, отправка сообщений, смена статуса
 * задачи. Перемещение сделок, удаления, merge — только онлайн (§11.3).
 */
import axios from 'axios';

import { api } from '@/api/client';
import { queryClient } from '@/lib/query';
import { kv } from '@/lib/storage';
import { toast } from '@/lib/toast';

const QUEUE_KEY = 'outbox.queue';
const MAX_ITEMS = 100;
const MAX_RETRIES = 6;
const PARALLEL = 3;

export interface OutboxItem {
  id: string;
  /** Человекочитаемая подпись для тостов. */
  label: string;
  method: 'post' | 'patch';
  endpoint: string;
  body?: unknown;
  /** queryKey-префиксы для инвалидации после успешной синхронизации. */
  invalidate: readonly (readonly unknown[])[];
  createdAt: string;
  retries: number;
  lastError?: string;
}

function read(): OutboxItem[] {
  return kv.getJSON<OutboxItem[]>(QUEUE_KEY) ?? [];
}

function write(items: OutboxItem[]): void {
  kv.setJSON(QUEUE_KEY, items);
}

export function outboxSize(): number {
  return read().length;
}

/** Поставить мутацию в очередь. Возвращает id элемента. */
export function enqueue(
  item: Omit<OutboxItem, 'id' | 'createdAt' | 'retries'>,
): string {
  const items = read();
  if (items.length >= MAX_ITEMS) {
    // Переполнение — отбрасываем старейший (ТЗ §11.2).
    items.shift();
    toast.error('Очередь офлайн-операций переполнена', 'Старые записи отброшены');
  }
  const entry: OutboxItem = {
    ...item,
    id: `ob-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    retries: 0,
  };
  write([...items, entry]);
  return entry.id;
}

let processing = false;

/** FIFO-обработка очереди. Вызывается при восстановлении сети и на старте. */
export async function processOutbox(): Promise<void> {
  if (processing) return;
  processing = true;
  try {
    const items = read();
    for (let i = 0; i < items.length; i += PARALLEL) {
      const batch = items.slice(i, i + PARALLEL);
      await Promise.all(batch.map(processItem));
    }
  } finally {
    processing = false;
  }
}

async function processItem(item: OutboxItem): Promise<void> {
  try {
    await api.request({ method: item.method, url: item.endpoint, data: item.body });
    removeItem(item.id);
    for (const key of item.invalidate) {
      void queryClient.invalidateQueries({ queryKey: key });
    }
  } catch (error) {
    const status = axios.isAxiosError(error) ? (error.response?.status ?? 0) : 0;
    if (status >= 400 && status < 500) {
      // Ошибка клиента — повтор не поможет, снимаем с очереди (ТЗ §11.2).
      removeItem(item.id);
      toast.error('Офлайн-операция отклонена', item.label);
    } else {
      // Сеть/сервер — оставляем, наращиваем счётчик.
      const retries = item.retries + 1;
      if (retries >= MAX_RETRIES) {
        removeItem(item.id);
        toast.error('Не удалось синхронизировать', item.label);
      } else {
        updateItem(item.id, {
          retries,
          lastError: status ? `HTTP ${status}` : 'network',
        });
      }
    }
  }
}

function removeItem(id: string): void {
  write(read().filter((i) => i.id !== id));
}

function updateItem(id: string, patch: Partial<OutboxItem>): void {
  write(read().map((i) => (i.id === id ? { ...i, ...patch } : i)));
}
