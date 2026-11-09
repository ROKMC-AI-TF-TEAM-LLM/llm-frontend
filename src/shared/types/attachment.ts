/** 서버가 내려주는 첨부 파일 (채팅 답변·프로젝트·문서에서 다운로드) */
export interface FileAttachment {
  attachment_id: string;
  name: string;
  size?: number;
  url?: string;
  tool?: 'HWP_EXPORT' | 'HWP_DRAFT' | string;
}
