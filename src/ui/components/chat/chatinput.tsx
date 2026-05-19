import { useRef, useState } from 'react'

interface ChatInputProps {
  placeholder?: string
  notice?: string
  onSend?: (message: string) => void
}

export default function ChatInput({
  placeholder = "메시지를 입력하세요...",
  notice,
  onSend
}: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<File[]>([])

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        multiple
        onChange={(e) => {
          if (e.target.files) {
            setFiles(Array.from(e.target.files))
          }
        }}
      />

      {files.length > 0 && (
        <div className="flex gap-2 mb-2 flex-wrap px-4">
          {files.map((file, i) => (
            <div key={i} className="flex items-center gap-2 bg-brand rounded-xl px-3 py-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-white text-xs font-semibold">{file.name.split('.')[0].toUpperCase()}</span>
                <span className="text-white/70 text-xs">{file.name.split('.').pop()}</span>
              </div>
              <button
                className="text-white/70 hover:text-white ml-1"
                onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center w-full bg-surface border border-surface-border rounded-full shadow-sm px-4 py-3 focus-within:border-text-muted transition-colors">
        <button
          className="text-text-muted hover:text-text-secondary transition-colors shrink-0"
          aria-label="첨부"
          onClick={() => fileInputRef.current?.click()}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>
        <input
          type="text"
          placeholder={placeholder}
          className="flex-1 mx-3 bg-transparent outline-none text-sm text-text-primary placeholder-text-muted"
        />
        <button
          onClick={() => onSend?.('메시지')}
          className="w-9 h-9 rounded-full bg-brand hover:bg-brand-hover flex items-center justify-center transition-colors shrink-0 active:scale-95"
          aria-label="전송"
        >
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </button>
      </div>

      {notice && (
        <p className="text-xs text-text-muted text-center mt-3">{notice}</p>
      )}
    </div>
  )
}