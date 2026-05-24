/** Debounce значения (ТЗ §7.4: поиск 200ms, §8.6: контакты 250ms). */
import { useEffect, useState } from 'react';

export function useDebounced<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
