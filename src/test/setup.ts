// 모든 테스트 전에 실행된다 (vitest.config.ts의 setupFiles).
// Node에는 브라우저 저장소가 없으므로(있어도 설정에 따라 동작이 다르다) 메모리 저장소로 채운다.
import { afterEach } from 'vitest'

class MemoryStorage implements Storage {
  private items = new Map<string, string>()
  get length() {
    return this.items.size
  }
  clear() {
    this.items.clear()
  }
  getItem(key: string) {
    return this.items.get(key) ?? null
  }
  key(index: number) {
    return [...this.items.keys()][index] ?? null
  }
  removeItem(key: string) {
    this.items.delete(key)
  }
  setItem(key: string, value: string) {
    this.items.set(key, String(value))
  }
}

// vi.stubGlobal로 넣으면 테스트의 vi.unstubAllGlobals()가 함께 지우므로 직접 정의한다
for (const name of ['localStorage', 'sessionStorage'])
  Object.defineProperty(globalThis, name, {
    value: new MemoryStorage(),
    configurable: true,
    writable: true,
  })

afterEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})
