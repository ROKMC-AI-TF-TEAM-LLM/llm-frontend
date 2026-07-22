import { useState } from 'react';
import type { FileAttachment } from '../../../types';
import { downloadAttachment, fileExtOf, formatFileSize } from '../../../utils/downloadAttachment';

interface FileDownloadProps {
  attachments?: FileAttachment[];
}

// 답변에 첨부된 파일(HWP 내보내기 등)의 다운로드 버튼.
export default function FileDownload({ attachments }: FileDownloadProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  if (!attachments || attachments.length === 0) return null;

  const download = async (att: FileAttachment) => {
    if (busyId) return;
    setBusyId(att.attachment_id);
    setErr(null);
    const msg = await downloadAttachment(att);
    if (msg) setErr(msg);
    setBusyId(null);
  };

  return (
    <div className="ml-1 mb-3 mt-1 space-y-2">
      {attachments.map((att) => {
        const ext = fileExtOf(att.name);
        const sizeText = formatFileSize(att.size);
        const busy = busyId === att.attachment_id;
        const meta = [ext, sizeText].filter(Boolean).join(' · ');
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
                {meta ? `${meta} · ` : ''}{busy ? '내려받는 중...' : '다운로드'}
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
