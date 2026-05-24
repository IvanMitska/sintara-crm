/** Тактильная отдача (ТЗ §6.6). selectionAsync на тапах, notify на создании. */
import * as Haptics from 'expo-haptics';

export const haptics = {
  /** Лёгкий отклик на тапах/выборе. */
  select: () => {
    void Haptics.selectionAsync();
  },
  /** Успех — создание сущности. */
  success: () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },
  warning: () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },
  error: () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },
  impact: () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },
};
