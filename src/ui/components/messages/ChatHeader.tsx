import { useMemo, useState } from 'react'
import { useServerStatus } from '../../../hooks/useServerStatus'
import { useChatStore } from '../../../api/store/chatStore'
import FilesDrawer from './FilesDrawer'
import type { FileAttachment } from '../../../types'

const STATUS_CONFIG = {
  ok:       { dot: 'bg-status-ok',    pulse: false, label: '서버 양호',    text: 'text-status-ok'    },
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
  const messages = useChatStore((s) => s.messages);
  const [filesOpen, setFilesOpen] = useState(false);

  // 세션의 모든 AI 메시지에서 첨부를 모은다(같은 attachment_id 중복 제거).
  const files = useMemo(() => {
    const seen = new Set<string>();
    const out: FileAttachment[] = [];
    for (const m of messages) {
      if (m.type !== 'text' || m.role !== 'assistant' || !m.attachments) continue;
      for (const a of m.attachments) {
        if (seen.has(a.attachment_id)) continue;
        seen.add(a.attachment_id);
        out.push(a);
      }
    }
    return out;
  }, [messages]);

  return (
    <header style={{ height: '60px' }} className="px-6 flex items-center justify-between gap-4">
      <h1 title={title} className="min-w-0 text-[15px] font-bold text-text-primary truncate">{title}</h1>
      <div className="flex items-center gap-3 shrink-0">
        {files.length > 0 && (
          <button
            type="button"
            onClick={() => setFilesOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[13px] font-semibold text-text-secondary hover:bg-brand-subtle hover:text-brand transition-colors"
            aria-label="첨부 파일 보기"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
            </svg>
            파일 {files.length}
          </button>
        )}
        <ServerStatusLight />
      </div>
      <FilesDrawer open={filesOpen} files={files} onClose={() => setFilesOpen(false)} />
    </header>
  );
}