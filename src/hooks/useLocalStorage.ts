export const useLocalStorage = <T = unknown>(key: string, storageType: 'local' | 'session' = 'local') => {
  const store = storageType === 'session' ? window.sessionStorage : window.localStorage;

  const setItem = (value: T) => {
    try {
      store.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(error);
    }
  };

  const getItem = (): T | null => {
    try {
      const item = store.getItem(key);
      return item ? (JSON.parse(item) as T) : null;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  const removeItem = () => {
    try {
      store.removeItem(key);
    } catch (error) {
      console.error(error);
    }
  };

  return { setItem, getItem, removeItem };
};
