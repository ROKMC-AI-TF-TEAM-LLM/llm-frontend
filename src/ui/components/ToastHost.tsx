import { useToastStore } from '../../api/store/toastStore'
import Toast from './Toast'

export default function ToastHost() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)

  return (
    <>
      {toasts.map((t, i) => (
        <Toast
          key={t.id}
          message={t.message}
          type={t.type}
          stackIndex={i}
          onClose={() => dismiss(t.id)}
        />
      ))}
    </>
  )
}
