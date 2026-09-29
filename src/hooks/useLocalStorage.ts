import { useCallback, useMemo } from 'react';

export const useLocalStorage = <T = unknown>(key: string, storageType: 'local' | 'session' = 'local') => {
  const store = storageType === 'session' ? window.sessionStorage : window.localStorage;

  const setItem = useCallback((value: T) => {
    try {
      store.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(error);
    }
  }, [store, key]);

  const getItem = useCallback((): T | null => {
    try {
      const item = store.getItem(key);
      return item ? (JSON.parse(item) as T) : null;
    } catch (error) {
      console.error(error);
      return null;
    }
  }, [store, key]);

  const removeItem = useCallback(() => {
    try {
      store.removeItem(key);
    } catch (error) {
      console.error(error);
    }
  }, [store, key]);

  return useMemo(() => ({ setItem, getItem, removeItem }), [setItem, getItem, removeItem]);
};
