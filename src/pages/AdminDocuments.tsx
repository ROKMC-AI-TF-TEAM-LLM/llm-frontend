import { useState, useRef, useMemo } from 'react';
import { useAdminDocuments, useUploadDocument, useDeleteDocument } from '../hooks/useAdminDocument';
import { downloadDocumentByName } from '../utils/downloadAttachment';
import { DOMAINS, getDomainLabel, getDomainStyle } from '../utils/document';
import DomainIcon from '../ui/components/chat/DomainIcon';
import Toast from '../ui/components/Toast';
import { getApiError, DEFAULT_STATUS_ERRORS } from '../utils/error';
import type { AdminDocumentItem, AdminDocStatus } from '../types/adminDocument';

// 상태 필터 탭
type StatusFilter = 'all' | 'processing' | 'completed' | 'failed';
const STATUS_TABS: { label: string; value: StatusFilter }[] = [
  { label: '전체', value: 'all' },
  { label: '처리 중', value: 'processing' },
  { label: '완료', value: 'completed' },
  { label: '실패', value: 'failed' },
];

// 서버 status(PROCESSING/COMPLETED/FAILED) → 화면 배지
const statusBadge = (status: AdminDocStatus) => {
  switch (status) {
    case 'COMPLETED':
      return { label: '완료', cls: 'bg-status-ok/12 text-status-ok' };
    case 'FAILED':
      return { label: '실패', cls: 'bg-status-error/12 text-status-error' };
    case 'PROCESSING':
    default:
      return { label: '처리 중', cls: 'bg-amber-100 text-amber-700' };
  }
};

const matchesFilter = (status: AdminDocStatus, f: StatusFilter): boolean => {
  if (f === 'all') return true;
  if (f === 'processing') return status === 'PROCESSING';
  if (f === 'completed') return status === 'COMPLETED';
  return status === 'FAILED';
};

const formatSize = (size?: number): string => {
  if (!size || size <= 0) return '-';
  if (size < 1024) return `${size}B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}KB`;
  return `${(size / 1024 / 1024).toFixed(1)}MB`;
};

const ACCEPT = '.pdf,.docx,.hwp,.md,.txt';

export default function AdminDocuments() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [uploadDomain, setUploadDomain] = useState(DOMAINS[0]);
  const [domainMenuOpen, setDomainMenuOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type?: 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, isError, error } = useAdminDocuments();
  const uploadMut = useUploadDocument();
  const deleteMut = useDeleteDocument();

  const documentsData = data?.data?.data?.documents;

  // 클라이언트 필터(상태 탭 + 이름 검색)
  const filtered = useMemo(() => {
    const documents: AdminDocumentItem[] = documentsData ?? [];
    const q = search.trim().toLowerCase();
    return documents.filter(
      (d) => matchesFilter(d.status, statusFilter) && (!q || d.name.toLowerCase().includes(q)),
    );
  }, [documentsData, statusFilter, search]);

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    uploadMut.mutate(
      { file, fields: { name: file.name, domain: uploadDomain.code } },
      {
        onSuccess: () => setToast({ msg: `'${file.name}' 업로드가 시작되었습니다.` }),
        onError: () => setToast({ msg: '업로드에 실패했습니다. 잠시 후 다시 시도해주세요.', type: 'error' }),
      },
    );
  };

  const handleDelete = (doc: AdminDocumentItem) => {
    if (!window.confirm(`'${doc.name}' 문서를 삭제하시겠습니까?`)) return;
    deleteMut.mutate(doc.document_id, {
      onError: () => setToast({ msg: '삭제에 실패했습니다.', type: 'error' }),
    });
  };

  // 원본 다운로드 — 인증 헤더가 필요해 fetch→blob 방식으로 받는다.
  const [downloadingName, setDownloadingName] = useState<string | null>(null);
  const handleDownload = async (doc: AdminDocumentItem) => {
    if (downloadingName) return;
    setDownloadingName(doc.name);
    const msg = await downloadDocumentByName(doc.name);
    if (msg) setToast({ msg, type: 'error' });
    setDownloadingName(null);
  };

  return (
    <div>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <p className="text-sm text-text-muted mb-6">MARS가 답변 근거로 사용할 문서를 업로드하세요</p>

      {/* 업로드 영역 (드래그앤드롭) */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex items-center justify-between gap-4 rounded-2xl border-2 border-dashed px-6 py-5 mb-6 cursor-pointer transition-colors ${
          dragOver ? 'border-brand bg-brand-subtle' : 'border-brand-soft bg-brand-subtle/40 hover:bg-brand-subtle'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
        />
        <div className="flex items-center gap-4 min-w-0">
          <div className="shrink-0 w-11 h-11 rounded-xl bg-brand-soft flex items-center justify-center">
            <svg className="w-5 h-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v12M7 8l5-5 5 5M5 21h14" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-[15px] font-bold text-text-primary">파일을 여기로 끌어다 놓거나 클릭해 업로드</p>
            <p className="text-[12.5px] text-text-muted mt-0.5">PDF, DOCX, HWP · 최대 50MB</p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
          {/* 업로드 도메인 선택 */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setDomainMenuOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 pl-2.5 pr-2.5 py-2 rounded-full bg-white border border-brand-soft text-[13px] font-semibold text-brand hover:bg-brand-subtle transition-colors"
            >
              <span className="w-2 h-2 rounded-full" style={{ background: getDomainStyle(uploadDomain.code).bar }} />
              {uploadDomain.label}
              <svg className={`w-3.5 h-3.5 transition-transform ${domainMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
            </button>
            {domainMenuOpen && (
              <div className="absolute right-0 top-full mt-2 min-w-[160px] rounded-2xl border border-surface-border bg-white shadow-[0_10px_30px_rgba(40,30,35,0.12)] p-1.5 z-20">
                {DOMAINS.map((d) => (
                  <button
                    key={d.code}
                    type="button"
                    onClick={() => { setUploadDomain(d); setDomainMenuOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] text-left transition-colors ${
                      uploadDomain.code === d.code ? 'bg-brand-subtle text-brand font-semibold' : 'text-text-secondary hover:bg-surface-subtle'
                    }`}
                  >
                    <DomainIcon code={d.code} size={15} />
                    {d.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMut.isPending}
            className="px-5 py-2.5 rounded-full bg-gradient-to-r from-brand to-brand-light text-white text-[14px] font-bold shadow-[0_8px_20px_rgba(220,20,60,0.28)] hover:brightness-105 active:scale-[0.98] transition disabled:opacity-60"
          >
            {uploadMut.isPending ? '업로드 중...' : '파일 선택'}
          </button>
        </div>
      </div>

      {/* 상태 필터 + 검색 */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-1.5">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-colors ${
                statusFilter === tab.value
                  ? 'bg-brand text-white'
                  : 'text-text-secondary hover:bg-brand-subtle hover:text-brand'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative w-full max-w-[280px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="파일명 검색..."
            className="w-full pl-9 pr-8 py-2 text-sm rounded-xl border border-surface-border bg-surface text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-soft transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full text-text-muted hover:text-text-primary hover:bg-surface-subtle transition-colors"
              aria-label="검색어 지우기"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          )}
        </div>
      </div>

      {/* 목록 테이블 */}
      <div className="rounded-2xl border border-surface-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-subtle text-[12.5px] text-text-muted">
              <th className="text-left font-semibold px-5 py-3">파일명</th>
              <th className="text-left font-semibold px-4 py-3 w-[130px]">도메인</th>
              <th className="text-left font-semibold px-4 py-3 w-[90px]">업로더</th>
              <th className="text-left font-semibold px-4 py-3 w-[100px]">상태</th>
              <th className="text-left font-semibold px-4 py-3 w-[110px]">업로드일</th>
              <th className="text-right font-semibold px-5 py-3 w-[90px]">처리</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-text-muted">불러오는 중...</td></tr>
            ) : isError ? (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-text-muted">
                문서를 불러오지 못했습니다.
                <span className="block mt-1 text-[12px] text-text-muted/80">
                  {(() => {
                    const status = (error as { response?: { status?: number } })?.response?.status;
                    const msg = getApiError(error, {}, DEFAULT_STATUS_ERRORS, '서버에 연결할 수 없습니다.');
                    return status ? `[${status}] ${msg}` : msg;
                  })()}
                </span>
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-text-muted">{search || statusFilter !== 'all' ? '조건에 맞는 문서가 없습니다.' : '업로드된 문서가 없습니다.'}</td></tr>
            ) : (
              filtered.map((doc) => {
                const badge = statusBadge(doc.status);
                const style = getDomainStyle(doc.domain);
                return (
                  <tr key={doc.document_id} className="border-t border-surface-border hover:bg-surface-subtle/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="shrink-0 w-1 h-8 rounded-full" style={{ background: style.bar }} />
                        <div className="min-w-0">
                          <p className="font-semibold text-text-primary truncate max-w-[360px]">{doc.name}</p>
                          <p className="text-[11.5px] text-text-muted">{doc.content_type || '문서'} · {formatSize(doc.size)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold" style={{ color: style.badgeText }}>
                        <DomainIcon code={doc.domain} size={14} />
                        {getDomainLabel(doc.domain)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-text-secondary">해병대</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-block text-[11.5px] font-semibold px-2.5 py-1 rounded-full ${badge.cls}`}>{badge.label}</span>
                    </td>
                    <td className="px-4 py-3.5 text-text-muted whitespace-nowrap">
                      {doc.created_at ? new Date(doc.created_at).toLocaleDateString('ko-KR') : '-'}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleDownload(doc)}
                          disabled={downloadingName !== null}
                          title="원본 다운로드"
                          className="px-3 py-1.5 rounded-lg border border-surface-border text-[12.5px] font-semibold text-text-secondary hover:bg-brand-subtle hover:text-brand hover:border-brand-soft transition-colors disabled:opacity-50"
                        >
                          {downloadingName === doc.name ? '...' : '다운로드'}
                        </button>
                        <button
                          onClick={() => handleDelete(doc)}
                          disabled={deleteMut.isPending}
                          className="px-3 py-1.5 rounded-lg border border-surface-border text-[12.5px] font-semibold text-text-secondary hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors disabled:opacity-50"
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
