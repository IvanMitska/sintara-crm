/** Каркас экрана вкладки: космический фон + шапка + контент. */
import { StyleSheet, View } from 'react-native';

import { CosmicBg } from '@/components/glass';

import { AppHeader } from './AppHeader';

/** Высота кастомного таб-бара без safe-area (см. TabBar.tsx). */
export const TAB_BAR_HEIGHT = 60;

interface ScreenProps {
  title: string;
  /** Скрыть шапку (для экранов внутри stack со своим заголовком). */
  hideHeader?: boolean;
  children: React.ReactNode;
}

export function Screen({ title, hideHeader, children }: ScreenProps) {
  return (
    <CosmicBg>
      {!hideHeader ? <AppHeader title={title} /> : null}
      <View style={styles.body}>{children}</View>
    </CosmicBg>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1 },
});
