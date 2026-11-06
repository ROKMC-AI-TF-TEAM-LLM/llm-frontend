import type { FileAttachment } from '../types';
import { getValidAccessToken } from '../api/lib/axios';
import { logError } from './logError';
import { API_BASE_URL } from '../constants/api';

export const resolveAttachmentUrl = (att: FileAttachment): string => {
  const base = API_BASE_URL;
  const path = att.url ?? `/api/v1/files/${att.attachment_id}`;
  if (/^https?:\/\//i.test(path)) return path;
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
};

export const downloadFileWithAuth = async (url: string, filename: string): Promise<string | null> => {
  try {
    const token = await getValidAccessToken();
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return '파일을 찾을 수 없습니다.';
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

export const downloadAttachment = (att: FileAttachment): Promise<string | null> =>
  downloadFileWithAuth(resolveAttachmentUrl(att), att.name);

// 문서 식별은 document_id로 한다. 이름 기반 엔드포인트는 동명이문서가 있을 때
// 가장 최근 등록분을 돌려주므로, 인용된 문서와 다른 파일이 내려올 수 있다.
export const downloadDocument = (documentId: string, filename: string): Promise<string | null> => {
  const base = import.meta.env.VITE_SERVER_API_URL ?? '';
  return downloadFileWithAuth(`${base}/api/v1/documents/${documentId}/download`, filename);
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
