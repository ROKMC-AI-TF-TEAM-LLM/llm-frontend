import type { FileAttachment } from '../../../types';

interface FileDownloadProps {
  files?: FileAttachment[];
}

// url이 상대경로(/files/...)면 백엔드 origin을 붙여 절대경로로 만든다.
const toAbsoluteUrl = (url: string): string => {
  if (/^https?:\/\//i.test(url)) return url;
  const base = import.meta.env.VITE_SERVER_API_URL ?? '';
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
};

// 파일명에서 확장자를 뽑아 뱃지로 표시(HWPX, PDF 등).
const extOf = (name: string): string | null => {
  const i = name.lastIndexOf('.');
  return i > 0 ? name.slice(i + 1).toUpperCase() : null;
};

// 답변에 첨부된 파일(HWP 내보내기 등)의 다운로드 버튼. SourceBadge와 같은 카드 톤.
export default function FileDownload({ files }: FileDownloadProps) {
  if (!files || files.length === 0) return null;

  return (
    <div className="ml-1 mb-3 mt-1 space-y-2">
      {files.map((f, i) => {
        const ext = extOf(f.name);
        return (
          <a
            key={i}
            href={toAbsoluteUrl(f.url)}
            download={f.name}
            className="group w-full flex items-center gap-3 p-3 rounded-xl border border-brand-soft bg-brand-subtle text-left transition-colors hover:bg-brand-soft"
          >
            <div className="shrink-0 w-9 h-9 rounded-lg bg-brand flex items-center justify-center">
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-text-primary truncate">{f.name}</p>
              <p className="text-[11.5px] text-brand-hover font-medium mt-0.5">
                {ext ? `${ext} · ` : ''}다운로드
              </p>
            </div>
            <svg className="shrink-0 w-5 h-5 text-brand transition-transform group-hover:translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
            </svg>
          </a>
        );
      })}
    </div>
  );
}
