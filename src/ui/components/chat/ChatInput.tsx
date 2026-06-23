import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import type { ApiError } from '../../../utils/error';
import { useChatStore, saveInflight, clearInflight, clearCache } from '../../../api/store/chatStore';
import { useCreateSession } from '../../../hooks/useSession';
import Toast from '../Toast';

const inputDrafts = new Map<string, string>();
const NEW_CHAT_KEY = '__new__';

const toSessionTitle = (text: string): string => {
  const firstLine =
    text.split('\n').map((l) => l.trim()).find((l) => l.length > 0) ?? text.trim();
  const cleaned = firstLine
    .replace(/[#*`>_~]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const MAX = 30;
  return cleaned.length > MAX ? cleaned.slice(0, MAX).trim() + '…' : cleaned || '새 대화';
};

interface ChatInputProps {
  placeholder?: string;
  notice?: string;
  isConnecting?: boolean;
}

export default function ChatInput({
  placeholder = "메시지를 입력하세요...",
  notice,
  isConnecting = false,
}: ChatInputProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const draftKey = id ?? NEW_CHAT_KEY;
  const sendMessage = useChatStore((s) => s.sendMessage);
  const sendImageMessage = useChatStore((s) => s.sendImageMessage);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const abortStream = useChatStore((s) => s.abortStream);
  const { mutateAsync: createSession } = useCreateSession();
  const [value, setValue] = useState(() => inputDrafts.get(draftKey) ?? '');
  const [pendingFile, setPendingFile] = useState<string | null>(null);
  const [inputError, setInputError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resizeTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.overflowY = 'hidden';
    el.style.height = 'auto';
    if (el.value) {
      el.style.height = `${el.scrollHeight}px`;
      if (el.scrollHeight > 192) el.style.overflowY = 'auto';
    }
  };

  useEffect(() => {
    setValue(inputDrafts.get(draftKey) ?? '');
    requestAnimationFrame(resizeTextarea);
  }, [draftKey]);

  const updateValue = (v: string) => {
    setValue(v);
    if (v) inputDrafts.set(draftKey, v);
    else inputDrafts.delete(draftKey);
  };

  const clearDraft = () => {
    setValue('');
    inputDrafts.delete(draftKey);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file.name);
    e.target.value = '';
  };

  const isNewChat = location.pathname === '/chat';

  const resetTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.overflowY = 'hidden';
  };

  const handleSubmit = async () => {
    if (!value.trim() && !pendingFile) return;
    if (isStreaming && !isNewChat) return;
    if (isConnecting && !isNewChat) return;
    const text = value.trim();

    if (pendingFile) {
      sendImageMessage(pendingFile, text || undefined);
      setPendingFile(null);
      clearDraft();
      resetTextarea();
    } else if (isNewChat) {
      clearDraft();
      resetTextarea();
      if (isStreaming) abortStream();
      const prevSessionId = useChatStore.getState().sessionId;
      if (prevSessionId) {
        clearInflight(prevSessionId);
        clearCache(prevSessionId);
      }
      try {
        const res = await createSession({ title: toSessionTitle(text) });
        const sessionId = res.data.data.session_id;
        saveInflight(sessionId, text);
        navigate(`/chat/${sessionId}`, { state: { initialMessage: text } });
      } catch (e: unknown) {
        updateValue(text);
        const apiErr = e as ApiError;
        const code = apiErr?.response?.data?.error?.code;
        if (code === 'UNAUTHORIZED') {
          setInputError('인증이 만료되었습니다. 다시 로그인해주세요.');
        } else if (!apiErr?.response) {
          setInputError('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
        } else {
          setInputError('채팅 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
        }
      }
    } else {
      sendMessage(text);
      clearDraft();
      resetTextarea();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
      {inputError && <Toast message={inputError} onClose={() => setInputError('')} />}
      <div
        className="bg-surface border border-surface-border rounded-4xl shadow-sm focus-within:border-text-muted transition-colors overflow-hidden cursor-text"
        onClick={() => textareaRef.current?.focus()}
      >
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

        <div className="flex items-end px-6 py-5">
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
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(e) => {
              const el = e.target;
              updateValue(el.value);
              el.style.overflowY = 'hidden';
              el.style.height = 'auto';
              el.style.height = `${el.scrollHeight}px`;
              if (el.scrollHeight > 192) el.style.overflowY = 'auto';
            }}
            onKeyDown={handleKeyDown}
            placeholder={pendingFile ? "메시지를 입력하세요..." : placeholder}
            className="flex-1 mx-3 bg-transparent outline-none text-sm text-text-primary placeholder-text-muted resize-none overflow-y-hidden max-h-48 leading-normal py-1"
          />
          {isStreaming && !isNewChat ? (
            <button
              onClick={abortStream}
              className="w-7 h-7 rounded-full bg-brand hover:bg-brand-hover flex items-center justify-center transition-colors shrink-0 active:scale-95"
              aria-label="중단"
            >
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <rect x="5" y="5" width="14" height="14" rx="2" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!value.trim() && !pendingFile}
              className="w-7 h-7 rounded-full bg-brand hover:bg-brand-hover flex items-center justify-center transition-colors shrink-0 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="전송"
            >
              <svg className="w-5 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>
      {notice && (
        <p className="text-xs text-text-muted text-center mt-3">{notice}</p>
      )}
    </div>
  );
}
