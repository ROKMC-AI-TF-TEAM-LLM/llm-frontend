import { routes, type VercelConfig } from '@vercel/config/v1'

// 백엔드 호스트는 Vercel 프로젝트 환경변수(BACKEND_HOST)로만 주입 — 레포·번들에 노출되지 않음
// 빌드 시점에 평가되므로 값을 바꾸면 재배포 필요
const backendHost = process.env.BACKEND_HOST
if (!backendHost) {
  throw new Error('BACKEND_HOST 환경변수가 설정되지 않았습니다 (예: api.example.com)')
}

export const config: VercelConfig = {
  rewrites: [
    routes.rewrite('/api/:path*', `https://${backendHost}/api/:path*`),
    routes.rewrite('/(.*)', '/index.html'),
  ],
}
