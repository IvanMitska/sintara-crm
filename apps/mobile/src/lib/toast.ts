/** Нативные тосты через burnt (ТЗ §4.5). */
import * as Burnt from 'burnt';

export const toast = {
  success: (title: string, message?: string) => {
    Burnt.toast({ title, message, preset: 'done', haptic: 'success' });
  },
  error: (title: string, message?: string) => {
    Burnt.toast({ title, message, preset: 'error', haptic: 'error' });
  },
  info: (title: string, message?: string) => {
    Burnt.toast({ title, message, preset: 'none', haptic: 'none' });
  },
};
