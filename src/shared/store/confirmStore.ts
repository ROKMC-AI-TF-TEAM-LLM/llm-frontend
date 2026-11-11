import { create } from 'zustand'

export interface ConfirmOptions {
  /** 묻는 말 (예: "'보고서' 문서를 삭제하시겠습니까?") */
  title: string
  /** 덧붙이는 설명. 줄바꿈은 그대로 보인다 */
  message?: string
  /** 삭제처럼 되돌릴 수 없는 동작이면 true (확인 버튼 글자가 '삭제'가 된다) */
  danger?: boolean
  confirmLabel?: string
  cancelLabel?: string
}

interface ConfirmState {
  /** 지금 떠 있는 확인 창. 없으면 null */
  current: (ConfirmOptions & { resolve: (ok: boolean) => void }) | null
  open: (options: ConfirmOptions, resolve: (ok: boolean) => void) => void
  close: (ok: boolean) => void
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  current: null,
  open: (options, resolve) => {
    // 이미 떠 있는 창이 있으면 취소한 것으로 끝낸다
    get().current?.resolve(false)
    set({ current: { ...options, resolve } })
  },
  close: (ok) => {
    get().current?.resolve(ok)
    set({ current: null })
  },
}))

/**
 * 확인 창을 띄우고 사용자의 선택을 기다린다. showToast처럼 컴포넌트 밖(훅·이벤트 핸들러)에서도 부를 수 있다.
 *
 *   const ok = await confirm({ title: '삭제하시겠습니까?', message: '되돌릴 수 없습니다.', danger: true })
 *
 * 창은 앱 루트의 ConfirmHost가 그린다. 브라우저 기본 확인·알림 창은 쓰지 않는다.
 */
export const confirm = (options: ConfirmOptions): Promise<boolean> =>
  new Promise((resolve) => useConfirmStore.getState().open(options, resolve))
