import { useEffect } from 'react'

/** 모달·서랍이 떠 있는 동안 뒤 화면이 스크롤되지 않게 한다 (global.css의 body.modal-open) */
export function useBodyScrollLock(locked = true) {
  useEffect(() => {
    if (!locked) return
    document.body.classList.add('modal-open')
    return () => document.body.classList.remove('modal-open')
  }, [locked])
}
