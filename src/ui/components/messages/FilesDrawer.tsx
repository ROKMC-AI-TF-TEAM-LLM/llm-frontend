import { useState, useEffect, useCallback } from 'react';
import type { FileAttachment } from '../../../types';
import { downloadAttachment, fileExtOf, formatFileSize } from '../../../utils/downloadAttachment';

interface FilesDrawerProps {
  open: boolean;
  files: FileAttachment[];
  onClose: () => void;
}

// 세션의 모든 첨부 파일을 오른쪽 드로어에 모아 보여준다.
// 항상 마운트하되 open에 따라 CSS로 슬라이드(닫힘 애니메이션용 지연 언마운트 불필요).
export default function FilesDrawer({ open, files, onClose }: FilesDrawerProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const close = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

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
      {/* 배경 딤 — 닫힘 상태에선 클릭 통과 */}
      <div
        onClick={close}
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />
      {/* 패널 */}
      <aside
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-md bg-surface shadow-[-24px_0_60px_rgba(40,30,35,0.14)] transition-transform duration-300 ease-[cubic-bezier(.6,.02,.2,1)] ${open ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex flex-col h-full">
          {/* 상단 바 */}
          <div className="flex items-center justify-between h-14 px-5 shrink-0 border-b border-surface-border">
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-bold text-text-primary">파일</span>
              <span className="text-[13px] font-medium text-text-muted">{files.length}</span>
            </div>
            <button type="button" onClick={close} className="text-text-muted hover:text-text-primary transition-colors" aria-label="닫기">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 목록 */}
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
                        <svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <path d="M14 2v6h6" />
                        </svg>
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
                          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.25" />
                            <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
                          </svg>
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
