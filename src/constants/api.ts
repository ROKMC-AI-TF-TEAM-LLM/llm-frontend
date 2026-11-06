// 비어 있으면 같은 도메인의 /api/v1/... 로 요청 (Vercel rewrites가 백엔드로 프록시)
export const API_BASE_URL = import.meta.env.VITE_SERVER_API_URL ?? ''
