import type { FileAttachment } from '../types';
import { getValidAccessToken } from '../api/lib/axios';
import { logError } from './logError';

// url이 상대경로면 백엔드 origin을 붙인다. url이 없으면 attachment_id로 경로를 만든다.
export const resolveAttachmentUrl = (att: FileAttachment): string => {
  const base = import.meta.env.VITE_SERVER_API_URL ?? '';
  const path = att.url ?? `/api/v1/files/${att.attachment_id}`;
  if (/^https?:\/\//i.test(path)) return path;
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
};

// 인증(Authorization 헤더)이 필요한 파일 다운로드 공용 코어.
// <a href> 직접 링크로는 헤더를 못 실으므로 fetch→blob→가짜 링크 클릭으로 저장한다.
// 성공하면 null, 실패하면 사용자용 오류 메시지를 반환한다.
export const downloadFileWithAuth = async (url: string, filename: string): Promise<string | null> => {
  try {
    const token = await getValidAccessToken();
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return '파일을 찾을 수 없습니다.'; // 404 FILE_NOT_FOUND / DOCUMENT_NOT_FOUND 등
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: objectUrl, download: filename });
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
    return null;
  } catch (e) {
    logError('downloadFileWithAuth', e);
    return '다운로드 중 오류가 발생했습니다.';
  }
};

// 채팅 첨부(SSE files 이벤트) 다운로드.
export const downloadAttachment = (att: FileAttachment): Promise<string | null> =>
  downloadFileWithAuth(resolveAttachmentUrl(att), att.name);

// 원본 문서 다운로드: GET /api/v1/documents/{name}/download
// 문서명 그대로 경로에 싣되 한글·공백은 encodeURIComponent로 인코딩한다.
// (같은 이름이 여러 건이면 서버가 가장 최근 등록본을 반환)
export const downloadDocumentByName = (name: string): Promise<string | null> => {
  const base = import.meta.env.VITE_SERVER_API_URL ?? '';
  return downloadFileWithAuth(`${base}/api/v1/documents/${encodeURIComponent(name)}/download`, name);
};

export const fileExtOf = (name: string): string | null => {
  const i = name.lastIndexOf('.');
  return i > 0 ? name.slice(i + 1).toUpperCase() : null;
};

export const formatFileSize = (size?: number): string | null => {
  if (!size || size <= 0) return null;
  if (size < 1024) return `${size}B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}KB`;
  return `${(size / 1024 / 1024).toFixed(1)}MB`;
};
