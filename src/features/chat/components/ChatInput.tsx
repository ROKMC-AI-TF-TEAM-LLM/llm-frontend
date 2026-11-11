import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { isNetworkError, readApiError } from '@/shared/utils/error';
import { useChatStore } from '../store';
import { saveInflight } from '../storage';
import { type DomainSelection } from '../store/types';
import { logError } from '@/shared/utils/logError';
import { useCreateSession } from '@/features/sessions/hooks';
import { showToast } from '@/shared/store/toastStore';
import DomainPicker from './DomainPicker';
import { ArrowUpIcon, CloseIcon, FileIcon, StopFilledIcon } from '@/shared/components/icons';

const MAX_LEN = 1000;
const MAX_LIMIT_TOAST = 5;

const inputDrafts = new Map<string, string>();
const NEW_CHAT_KEY = '__new__';

const DOMAIN_DRAFT_KEY = 'rokm_domain_drafts';
const domainDrafts = {
  read(): Record<string, DomainSelection> {
    try {
      const raw = sessionStorage.getItem(DOMAIN_DRAFT_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  },
  write(map: Record<string, DomainSelection>) {
    try {
      sessionStorage.setItem(DOMAIN_DRAFT_KEY, JSON.stringify(map));
    } catch {
      // 저장소를 못 쓰면 분야 임시 저장만 건너뛴다
    }
  },
  get(key: string): DomainSelection | null {
    return this.read()[key] ?? null;
  },
  set(key: string, value: DomainSelection) {
    const map = this.read();
    map[key] = value;
    this.write(map);
  },
  delete(key: string) {
    const map = this.read();
    delete map[key];
    this.write(map);
  },
};

const toSessionTitle = (text: string): string => {
  const firstLine =
    text.split('\n').map((l) => l.trim()).find((l) => l.length > 0) ?? text.trim();
  const cleaned = firstLine
    .replace(/[#*`>_~]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const MAX = 200;
  return cleaned.length > MAX ? cleaned.slice(0, MAX).trim() + '…' : cleaned || '새 대화';
};

interface ChatInputProps {
  placeholder?: string;
  notice?: string;
  isConnecting?: boolean;
  projectId?: string;
  hideDomain?: boolean;
}

export default function ChatInput({
  placeholder = "메시지를 입력하세요...",
  notice,
  isConnecting = false,
  projectId,
  hideDomain = false,
}: ChatInputProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { id, chatId } = useParams();
  // 프로젝트 라우트(/projects/:id/:chatId)에서 id는 프로젝트 ID이므로 세션 키로 쓰면
  // 같은 프로젝트의 모든 대화가 초안을 공유한다. 프로젝트 첫 화면은 별도 키를 쓴다.
  const draftKey = projectId ? `project:${projectId}` : (chatId ?? id ?? NEW_CHAT_KEY);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const sendImageMessage = useChatStore((s) => s.sendImageMessage);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const abortStream = useChatStore((s) => s.abortStream);
  const { mutateAsync: createSession } = useCreateSession();
  const [value, setValue] = useState(() => inputDrafts.get(draftKey) ?? '');
  const [pendingFile, setPendingFile] = useState<string | null>(null);
  const [domain, setDomainState] = useState<DomainSelection | null>(() => domainDrafts.get(draftKey) ?? null);

  const setDomain = (d: DomainSelection | null) => {
    setDomainState(d);
    if (d) domainDrafts.set(draftKey, d);
    else domainDrafts.delete(draftKey);
  };
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const limitToastRef = useRef(0);

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

  // 다른 대화로 옮기면 그 대화의 임시 입력·분야를 불러온다.
  // effect에서 setState하면 한 번 더 그려지므로, 렌더 중에 바로 맞춘다 (react.dev: You Might Not Need an Effect)
  const [loadedKey, setLoadedKey] = useState(draftKey);
  if (loadedKey !== draftKey) {
    setLoadedKey(draftKey);
    setValue(inputDrafts.get(draftKey) ?? '');
    setDomainState(domainDrafts.get(draftKey) ?? null);
  }
  // 입력창 높이는 DOM이 바뀐 뒤에 맞춘다
  useEffect(() => {
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

  const isNewChat = location.pathname === '/chat' || !!projectId;

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
      // 이전 대화의 스트림은 건드리지 않는다. 진행 중이던 답변은 백그라운드에서 끝까지 받아지고,
      // 다시 열면 이어서 보인다(예전에는 여기서 중단하고 캐시까지 지워 답변이 사라졌다).
      try {
        const res = await createSession({ title: toSessionTitle(text), ...(projectId ? { project_id: projectId } : {}) });
        const sessionId = res.data.data.session_id;
        saveInflight(sessionId, text, domain ?? undefined);
        if (domain) domainDrafts.set(sessionId, domain);
        domainDrafts.delete(draftKey);
        const path = projectId ? `/projects/${projectId}/${sessionId}` : `/chat/${sessionId}`;
        navigate(path, { state: { initialMessage: text } });
      } catch (e: unknown) {
        logError('ChatInput.createSession', e);
        updateValue(text);
        const { code } = readApiError(e);
        if (code === 'UNAUTHORIZED') {
          showToast('인증이 만료되었습니다. 다시 로그인해주세요.');
        } else if (isNetworkError(e)) {
          showToast('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
        } else {
          showToast('채팅 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
        }
      }
    } else {
      sendMessage(text, domain ?? undefined);
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
    <div className="w-full max-w-210 mx-auto">
      <div
        style={{ border: '1px solid #f0e3e6', boxShadow: '0 12px 30px rgba(160,0,40,0.05)' }}
        className="bg-surface rounded-[30px] focus-within:border-[#e4002b] focus-within:shadow-[0_0_0_3px_rgba(228,0,43,0.07)] transition-all duration-200 overflow-hidden cursor-text"
        onClick={() => textareaRef.current?.focus()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt,.hwp"
          className="hidden"
          onChange={handleFileChange}
        />

        <textarea
          ref={textareaRef}
          rows={1}
          maxLength={MAX_LEN}
          value={value}
          onChange={(e) => {
            const el = e.target;
            const next = el.value.slice(0, MAX_LEN);
            if (el.value.length >= MAX_LEN) {
              if (limitToastRef.current < MAX_LIMIT_TOAST) {
                limitToastRef.current += 1;
                showToast(`${MAX_LEN}자를 넘어가면 더 이상 입력할 수 없습니다.`);
              }
            } else {
              limitToastRef.current = 0;
            }
            updateValue(next);
            el.style.overflowY = 'hidden';
            el.style.height = 'auto';
            el.style.height = `${el.scrollHeight}px`;
            if (el.scrollHeight > 192) el.style.overflowY = 'auto';
          }}
          onKeyDown={handleKeyDown}
          placeholder={pendingFile ? "메시지를 입력하세요..." : placeholder}
          className="w-full px-5 pt-6.5 pb-1 bg-transparent outline-none text-[15px] text-text-primary placeholder-text-muted resize-none overflow-y-hidden max-h-48 leading-normal"
        />

        {pendingFile && (
          <div className="flex items-center gap-2 px-3 pt-2">
            <div className="flex items-center gap-2 bg-brand text-white rounded-xl px-3 py-2 max-w-full">
              <div className="bg-brand-soft rounded-lg p-1.5 shrink-0">
                <FileIcon className="w-4 h-4 text-brand" />
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
                <CloseIcon className="w-5 h-5" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        )}

        <div
          className="flex items-center justify-between px-3 pb-3 pt-1 cursor-text"
          onClick={() => textareaRef.current?.focus()}
        >
          <div className="flex items-center gap-1.5">
            <button
              className="h-10 flex items-center rounded-full text-text-muted hover:text-brand hover:bg-brand-subtle transition-colors shrink-0"
              aria-label="첨부"
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
            >
            </button>

            {!hideDomain && <DomainPicker value={domain} onChange={setDomain} />}
          </div>

          {isStreaming && !isNewChat ? (
            <button
              onClick={(e) => { e.stopPropagation(); abortStream(); }}
              style={{ background: 'linear-gradient(135deg,#e4002b,#ff2d55)', boxShadow: '0 5px 13px rgba(228,0,43,0.28)' }}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-transform shrink-0 active:scale-95 hover:brightness-105 animate-fade-in"
              aria-label="중단"
            >
              <StopFilledIcon className="w-[18px] h-[18px] text-white" />
            </button>
          ) : (value.trim() || pendingFile) ? (
            <button
              onClick={(e) => { e.stopPropagation(); handleSubmit(); }}
              style={{ background: 'linear-gradient(135deg,#e4002b,#ff2d55)', boxShadow: '0 5px 13px rgba(228,0,43,0.28)' }}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-transform shrink-0 active:scale-95 hover:brightness-105 animate-fade-in"
              aria-label="전송"
            >
              <ArrowUpIcon className="w-5 h-5 text-white" strokeWidth={2.4} />
            </button>
          ) : null}
        </div>
      </div>
      {notice && (
        <p className="text-xs text-text-muted text-center mt-3">{notice}</p>
      )}
    </div>
  );
}
