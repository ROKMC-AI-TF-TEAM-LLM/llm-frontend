import { useState } from 'react';
import type { FileAttachment } from '../../../types';
import { getValidAccessToken } from '../../../api/lib/axios';
import { logError } from '../../../utils/logError';

interface FileDownloadProps {
  attachments?: FileAttachment[];
}

// url이 상대경로면 백엔드 origin을 붙인다. url이 없으면 attachment_id로 경로를 만든다.
const resolveUrl = (att: FileAttachment): string => {
  const base = import.meta.env.VITE_SERVER_API_URL ?? '';
  const path = att.url ?? `/api/v1/files/${att.attachment_id}`;
  if (/^https?:\/\//i.test(path)) return path;
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
};

const extOf = (name: string): string | null => {
  const i = name.lastIndexOf('.');
  return i > 0 ? name.slice(i + 1).toUpperCase() : null;
};

const formatSize = (size?: number): string | null => {
  if (!size || size <= 0) return null;
  if (size < 1024) return `${size}B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}KB`;
  return `${(size / 1024 / 1024).toFixed(1)}MB`;
};

// 답변에 첨부된 파일(HWP 내보내기 등)의 다운로드 버튼.
// 다운로드 엔드포인트는 인증이 필요하므로 <a href> 직접 링크가 아니라 fetch→blob으로 받는다.
export default function FileDownload({ attachments }: FileDownloadProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  if (!attachments || attachments.length === 0) return null;

  const download = async (att: FileAttachment) => {
    if (busyId) return;
    setBusyId(att.attachment_id);
    setErr(null);
    try {
      const token = await getValidAccessToken();
      const res = await fetch(resolveUrl(att), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        setErr('파일을 찾을 수 없습니다.'); // 404 FILE_NOT_FOUND 등
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement('a'), { href: url, download: att.name });
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      logError('FileDownload', e);
      setErr('다운로드 중 오류가 발생했습니다.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="ml-1 mb-3 mt-1 space-y-2">
      {attachments.map((att) => {
        const ext = extOf(att.name);
        const sizeText = formatSize(att.size);
        const busy = busyId === att.attachment_id;
        return (
          <button
            key={att.attachment_id}
            type="button"
            disabled={busy}
            onClick={() => download(att)}
            className="group w-full flex items-center gap-3 p-3 rounded-xl border border-brand-soft bg-brand-subtle text-left transition-colors hover:bg-brand-soft disabled:opacity-60 disabled:cursor-default"
          >
            <div className="shrink-0 w-9 h-9 rounded-lg bg-brand flex items-center justify-center">
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-text-primary truncate">{att.name}</p>
              <p className="text-[11.5px] text-brand-hover font-medium mt-0.5">
                {[ext, sizeText].filter(Boolean).join(' · ')}
                {(ext || sizeText) ? ' · ' : ''}
                {busy ? '내려받는 중...' : '다운로드'}
              </p>
            </div>
            {busy ? (
              <svg className="shrink-0 w-5 h-5 text-brand animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.25" />
                <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            ) : (
              <svg className="shrink-0 w-5 h-5 text-brand transition-transform group-hover:translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
              </svg>
            )}
          </button>
        );
      })}
      {err && <p className="text-[12px] text-status-error ml-1">{err}</p>}
    </div>
  );
}
