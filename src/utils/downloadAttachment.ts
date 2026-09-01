import type { FileAttachment } from '../types';
import { getValidAccessToken } from '../api/lib/axios';
import { logError } from './logError';

export const resolveAttachmentUrl = (att: FileAttachment): string => {
  const base = import.meta.env.VITE_SERVER_API_URL ?? '';
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
