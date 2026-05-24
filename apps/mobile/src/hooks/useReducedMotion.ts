/**
 * Учёт системной настройки «уменьшить движение» (ТЗ §17, аналог
 * prefers-reduced-motion из web globals.css). При включённой настройке
 * анимации отключаются.
 */
import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (mounted) setReduced(value);
    });
    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduced,
    );
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  return reduced;
}
