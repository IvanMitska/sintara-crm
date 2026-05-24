/**
 * Космический фон (ТЗ §6.3, наследует .cosmic-bg из globals.css).
 * Базовый градиент + мягкие цветные «орбы». Без анимации — статичная подложка.
 */
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { colors } from '@/theme';

export function CosmicBg({ children }: { children?: React.ReactNode }) {
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[colors.bg.base, colors.bg.raised, colors.bg.base]}
        style={StyleSheet.absoluteFill}
      />
      {/* Орбы — мягкие радиальные пятна имитируются полупрозрачными кругами. */}
      <View style={[styles.orb, styles.orbPurple]} />
      <View style={[styles.orb, styles.orbIndigo]} />
      <View style={[styles.orb, styles.orbTeal]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.base },
  orb: { position: 'absolute', borderRadius: 9999, opacity: 0.5 },
  orbPurple: {
    width: 320,
    height: 320,
    top: -80,
    left: -100,
    backgroundColor: 'rgba(139,92,246,0.10)',
  },
  orbIndigo: {
    width: 280,
    height: 280,
    bottom: 40,
    right: -90,
    backgroundColor: 'rgba(99,102,241,0.08)',
  },
  orbTeal: {
    width: 220,
    height: 220,
    bottom: -60,
    left: 60,
    backgroundColor: 'rgba(20,184,166,0.06)',
  },
});
