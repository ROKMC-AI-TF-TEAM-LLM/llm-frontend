import { useCallback, useMemo } from 'react'
import { logError } from '../utils/logError'

export const useLocalStorage = <T = unknown>(
  key: string,
  storageType: 'local' | 'session' = 'local',
) => {
  const store =
    storageType === 'session' ? window.sessionStorage : window.localStorage

  const setItem = useCallback(
    (value: T) => {
      try {
        store.setItem(key, JSON.stringify(value))
      } catch (error) {
        logError(`useLocalStorage.set:${key}`, error)
      }
    },
    [store, key],
  )

  const getItem = useCallback((): T | null => {
    try {
      const item = store.getItem(key)
      return item ? (JSON.parse(item) as T) : null
    } catch (error) {
      logError(`useLocalStorage.get:${key}`, error)
      return null
    }
  }, [store, key])

  const removeItem = useCallback(() => {
    try {
      store.removeItem(key)
    } catch (error) {
      logError(`useLocalStorage.remove:${key}`, error)
    }
  }, [store, key])

  return useMemo(
    () => ({ setItem, getItem, removeItem }),
    [setItem, getItem, removeItem],
  )
}
