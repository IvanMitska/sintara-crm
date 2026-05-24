import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { ScanLine, X } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CosmicBg } from '@/components/glass';
import { Button, Text } from '@/components/ui';
import { haptics } from '@/lib/haptics';
import { toast } from '@/lib/toast';
import { colors, radius, spacing } from '@/theme';

/**
 * Сканер визиток (ТЗ §8.6). Снимок визитки → форма создания контакта.
 *
 * ⚠️ Автоматическое распознавание текста (OCR) требует нативного MLKit-плагина
 * (react-native-vision-camera + text-recognition). В текущей сборке снимок
 * служит подсказкой — поля контакта заполняются вручную.
 */
export default function ScannerScreen() {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [capturing, setCapturing] = useState(false);

  const onCapture = async () => {
    setCapturing(true);
    try {
      await cameraRef.current?.takePictureAsync({ quality: 0.6 });
      haptics.success();
      toast.info('Визитка снята', 'Заполните данные контакта');
      router.replace('/(tabs)/more/contacts/new');
    } catch {
      toast.error('Не удалось сделать снимок');
    } finally {
      setCapturing(false);
    }
  };

  if (!permission) {
    return <CosmicBg />;
  }

  if (!permission.granted) {
    return (
      <CosmicBg>
        <View style={[styles.center, { paddingTop: insets.top }]}>
          <ScanLine size={48} color={colors.brand.primary500} strokeWidth={1.5} />
          <Text variant="headline" weight="semibold" center>
            Доступ к камере
          </Text>
          <Text variant="callout" tone="muted" center style={styles.hint}>
            Разрешите доступ к камере, чтобы сканировать визитки.
          </Text>
          <Button title="Разрешить" onPress={() => void requestPermission()} />
          <Button title="Отмена" variant="ghost" onPress={() => router.back()} />
        </View>
      </CosmicBg>
    );
  }

  return (
    <View style={styles.root}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

      {/* Рамка визитки */}
      <View style={styles.overlay} pointerEvents="none">
        <View style={styles.frame} />
        <Text variant="callout" tone="secondary" center style={styles.frameHint}>
          Поместите визитку в рамку
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Закрыть"
        hitSlop={10}
        onPress={() => router.back()}
        style={[styles.close, { top: insets.top + spacing[2] }]}
      >
        <X size={26} color="#fff" />
      </Pressable>

      <View style={[styles.controls, { paddingBottom: insets.bottom + spacing[6] }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Снять"
          disabled={capturing}
          onPress={onCapture}
          style={[styles.shutter, capturing && styles.shutterBusy]}
        >
          <View style={styles.shutterInner} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[8],
    gap: spacing[3],
  },
  hint: { maxWidth: 280 },
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  frame: {
    width: '82%',
    aspectRatio: 1.6,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  frameHint: { marginTop: spacing[3] },
  close: {
    position: 'absolute',
    left: spacing[4],
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  controls: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
  shutter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterBusy: { opacity: 0.5 },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
  },
});
