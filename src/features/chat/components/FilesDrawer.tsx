import { useState, useCallback } from 'react';
import { useEscapeKey } from '@/shared/hooks/useEscapeKey';
import type { FileAttachment } from '@/shared/types/attachment';
import { downloadAttachment, fileExtOf } from '@/shared/utils/downloadAttachment';
import { formatFileSize } from '@/shared/utils/fileSize';
import { CloseIcon, DownloadIcon, FileIcon, SpinnerIcon } from '@/shared/components/icons';

interface FilesDrawerProps {
  open: boolean;
  files: FileAttachment[];
  onClose: () => void;
}

export default function FilesDrawer({ open, files, onClose }: FilesDrawerProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const close = useCallback(() => onClose(), [onClose]);

  useEscapeKey(close, open);

  const download = async (att: FileAttachment) => {
    if (busyId) return;
    setBusyId(att.attachment_id);
    setErr(null);
    const msg = await downloadAttachment(att);
    if (msg) setErr(msg);
    setBusyId(null);
  };

  return (
    <>
      <div
        onClick={close}
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />
      <aside
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-md bg-surface shadow-[-24px_0_60px_rgba(40,30,35,0.14)] transition-transform duration-300 ease-[cubic-bezier(.6,.02,.2,1)] ${open ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-14 px-5 shrink-0 border-b border-surface-border">
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-bold text-text-primary">파일</span>
              <span className="text-[13px] font-medium text-text-muted">{files.length}</span>
            </div>
            <button type="button" onClick={close} className="text-text-muted hover:text-text-primary transition-colors" aria-label="닫기">
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scroll px-5 py-4">
            {files.length === 0 ? (
              <p className="mt-10 text-sm text-center text-text-muted">이 대화에는 첨부된 파일이 없습니다.</p>
            ) : (
              <div className="space-y-2.5">
                {files.map((att) => {
                  const ext = fileExtOf(att.name);
                  const sizeText = formatFileSize(att.size);
                  const busy = busyId === att.attachment_id;
                  const meta = [ext, sizeText].filter(Boolean).join(' · ');
                  return (
                    <div key={att.attachment_id} className="flex items-center gap-3 p-3 rounded-xl border border-surface-border bg-surface-subtle">
                      <div className="shrink-0 w-10 h-10 rounded-lg bg-brand flex items-center justify-center">
                        <FileIcon width={19} height={19} stroke="white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13.5px] font-semibold text-text-primary truncate">{att.name}</p>
                        {meta && <p className="text-[12px] text-text-muted mt-0.5">{meta}</p>}
                      </div>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => download(att)}
                        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-soft bg-brand-subtle text-brand text-[12.5px] font-semibold hover:bg-brand-soft transition-colors disabled:opacity-60"
                      >
                        {busy ? (
                          <SpinnerIcon className="w-4 h-4 animate-spin" />
                        ) : (
                          <DownloadIcon className="w-4 h-4" />
                        )}
                        다운로드
                      </button>
                    </div>
                  );
                })}
                {err && <p className="text-[12px] text-status-error">{err}</p>}
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
