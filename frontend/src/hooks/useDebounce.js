import { useState, useEffect } from 'react';

/**
 * Hook pour debouncer une valeur
 * @param {any} value - La valeur à debouncer
 * @param {number} delay - Le délai en millisecondes (défaut: 500ms)
 * @returns {any} La valeur debouncée
 */
export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};
