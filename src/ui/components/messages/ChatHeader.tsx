import { useServerStatus } from '../../../hooks/useServerStatus'
import { logError } from '../../../utils/logError'

const SERVER_HOST = (() => {
  try {
    return new URL(import.meta.env.VITE_SERVER_API_URL).host
  } catch (e) {
    logError('ChatHeader.parseServerHost', e)
    return import.meta.env.VITE_SERVER_API_URL ?? '서버'
  }
})()

const STATUS_CONFIG = {
  ok:       { dot: 'bg-status-ok',    pulse: false, label: SERVER_HOST,    text: 'text-status-ok'    },
  error:    { dot: 'bg-status-error', pulse: false, label: '서버 오류',    text: 'text-status-error'  },
  checking: { dot: 'bg-status-muted', pulse: false, label: '확인 중...',   text: 'text-text-muted'    },
}

function ServerStatusLight() {
  const status = useServerStatus()
  const { dot, pulse, label, text } = STATUS_CONFIG[status]

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <div className="relative flex items-center justify-center w-4 h-4">
        {pulse && (
          <span className={`absolute inline-flex w-4 h-4 rounded-full animate-ping opacity-75`} />
        )}
        <span className={`relative inline-flex w-2.5 h-2.5 rounded-full ${dot}`} />
      </div>
      <span className={`text-xs font-medium ${text}`}>{label}</span>
    </div>
  )
}

interface ChatHeaderProps {
  title: string;
}

export default function ChatHeader({ title }: ChatHeaderProps) {
  return (
    <header className="h-16 px-6 flex items-center justify-between border-b border-surface-border">
      <h1 className="text-base font-bold text-text-primary truncate">{title}</h1>
      <ServerStatusLight />
    </header>
  );
}