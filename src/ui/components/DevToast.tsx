import { useEffect, useState } from 'react'
import Toast from './Toast'

const EVENT = 'mars:devtoast'

export const showDevToast = (message = '개발 중인 기능입니다.') => {
  window.dispatchEvent(new CustomEvent<string>(EVENT, { detail: message }))
}

export default function DevToast() {
  const [msg, setMsg] = useState('')
  const [seq, setSeq] = useState(0)

  useEffect(() => {
    const onToast = (e: Event) => {
      setMsg((e as CustomEvent<string>).detail || '개발 중인 기능입니다.')
      setSeq((s) => s + 1)
    }
    window.addEventListener(EVENT, onToast)
    return () => window.removeEventListener(EVENT, onToast)
  }, [])

  if (!msg) return null
  return <Toast key={seq} message={msg} onClose={() => setMsg('')} />
}
