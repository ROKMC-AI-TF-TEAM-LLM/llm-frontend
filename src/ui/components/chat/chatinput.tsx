import { useNavigate, useLocation } from 'react-router-dom';
import { useRef, useState } from 'react';
import { useChatStore } from '../../../api/store/chatStore';
import { useCreateSession } from '../../../hooks/useSession';

interface ChatInputProps {
  placeholder?: string;
  notice?: string;
}

export default function ChatInput({
  placeholder = "메시지를 입력하세요...",
  notice,
}: ChatInputProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const sendMessage = useChatStore((s) => s.sendMessage);
  const sendImageMessage = useChatStore((s) => s.sendImageMessage);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const { mutateAsync: createSession } = useCreateSession();
  const [value, setValue] = useState('');
  const [pendingFile, setPendingFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file.name);
    e.target.value = '';
  };

  const handleSubmit = async () => {
    if (!value.trim() && !pendingFile) return;
    if (isStreaming) return;
    const text = value.trim();

    if (pendingFile) {
      sendImageMessage(pendingFile, text || undefined);
      setPendingFile(null);
      setValue('');
    } else if (location.pathname === '/chat') {
      setValue('');
      try {
        const res = await createSession({ title: text });
        const sessionId = res.data.data.session_id;
        navigate(`/chat/${sessionId}`, { state: { initialMessage: text } });
      } catch {
        setValue(text);
      }
    } else {
      sendMessage(text);
      setValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const dotIndex = pendingFile ? pendingFile.lastIndexOf('.') : -1;
  const pendingExt = dotIndex !== -1 ? pendingFile!.slice(dotIndex + 1).toUpperCase() : null;
  const pendingBasename = dotIndex !== -1 ? pendingFile!.slice(0, dotIndex) : pendingFile;

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="brand-light border border-surface-border rounded-4xl shadow-sm focus-within:border-text-muted transition-colors overflow-hidden">
        {pendingFile && (
          <div className="flex items-center gap-2 px-4 pt-3 pb-1">
            <div className="flex items-center gap-2 bg-brand text-white rounded-xl px-3 py-2 max-w-full">
              <div className="bg-brand-soft rounded-lg p-1.5 shrink-0">
                <svg
                  className="w-4 h-4 text-brand"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 2v6h6" />
                </svg>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-medium truncate max-w-45">{pendingBasename}</span>
                {pendingExt && <span className="text-xs text-white/70 uppercase tracking-wide">{pendingExt}</span>}
              </div>
              <button
                onClick={() => setPendingFile(null)}
                className="ml-1 text-white/60 hover:text-white shrink-0"
                aria-label="첨부 취소"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center px-6 py-5">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt,.hwp"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            className="text-text-muted hover:text-text-secondary transition-colors shrink-0"
            aria-label="첨부"
            onClick={() => fileInputRef.current?.click()}
          >
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={pendingFile ? "메시지를 입력하세요..." : placeholder}
            className="flex-1 mx-3 bg-transparent outline-none text-sm text-text-primary placeholder-text-muted"
          />
          <button
            onClick={handleSubmit}
            disabled={isStreaming}
            className="w-7 h-7 rounded-full bg-brand hover:bg-brand-hover flex items-center justify-center transition-colors shrink-0 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="전송"
          >
            <svg className="w-5 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
          </button>
        </div>
      </div>
      {notice && (
        <p className="text-xs text-text-muted text-center mt-3">{notice}</p>
      )}
    </div>
  );
}
