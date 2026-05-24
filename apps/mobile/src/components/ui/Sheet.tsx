/**
 * Нижний лист на @gorhom/bottom-sheet (ТЗ §4.5). Стекло strong-варианта,
 * spring damping18/stiffness220 (§6.6).
 */
import {
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetModalProps,
} from '@gorhom/bottom-sheet';
import { forwardRef } from 'react';
import { StyleSheet } from 'react-native';

import { colors, motion, radius } from '@/theme';

export interface SheetProps
  extends Partial<Omit<BottomSheetModalProps, 'children' | 'ref'>> {
  children: React.ReactNode;
}

export const Sheet = forwardRef<BottomSheetModal, SheetProps>(function Sheet(
  { children, snapPoints, ...rest },
  ref,
) {
  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      enableDynamicSizing={!snapPoints}
      animationConfigs={undefined}
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.handle}
      backdropComponent={undefined}
      enablePanDownToClose
      {...rest}
    >
      <BottomSheetView style={styles.content}>{children}</BottomSheetView>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  background: {
    backgroundColor: colors.bg.strong,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.strong,
  },
  handle: {
    backgroundColor: colors.text.disabled,
    width: 36,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
  },
});

// Используется как маркер для tree-shaking конфигов motion (см. ТЗ §6.6).
export const SHEET_SPRING = motion.sheetSpring;
