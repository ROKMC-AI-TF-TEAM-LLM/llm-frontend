import type { LoginRequest, SignupRequest } from '../../types/auth'
import { db, ME_ID, newId, now } from '../db'
import { fail, ok, post, type MockRoute } from '../server'

const TOKEN_TTL_SEC = 60 * 60

const base64Url = (value: object) =>
  btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

// 실제와 같은 JWT 모양이어야 axios.ts의 만료 계산·자동 갱신이 그대로 동작한다.
const issueTokens = () => {
  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SEC
  const accessToken = `${base64Url({ alg: 'none' })}.${base64Url({ sub: ME_ID, exp })}.mock`
  return { access_token: accessToken, refresh_token: `mock-refresh-${newId()}`, token_type: 'bearer' }
}

export const authRoutes: MockRoute[] = [
  // 오류 화면 확인용: pending@… 승인 대기, rejected@… 승인 거절, 비밀번호 wrong → 인증 실패
  post('/auth/login', async ({ request }) => {
    const { email, password } = await request.json() as LoginRequest
    if (password === 'wrong') return fail(401, 'INVALID_CREDENTIALS', '이메일 또는 비밀번호가 올바르지 않습니다.')
    if (email.startsWith('pending@')) return fail(403, 'APPROVAL_PENDING', '관리자 승인 대기 중입니다.')
    if (email.startsWith('rejected@')) return fail(403, 'APPROVAL_REJECTED', '가입이 거절되었습니다.')
    return ok(issueTokens())
  }, { auth: false }),

  post('/auth/signup', async ({ request }) => {
    const { name, email } = await request.json() as SignupRequest
    if (db.users.some((user) => user.email === email)) return fail(409, 'EMAIL_ALREADY_EXISTS', '이미 사용 중인 이메일입니다.')
    db.users.push({ user_id: newId(), name, email, role: 'user', status: 'pending', created_at: now(), updated_at: now() })
    return ok(null, 201)
  }, { auth: false }),

  post('/auth/refresh', () => ok(issueTokens()), { auth: false }),
  post('/auth/logout', () => ok(null), { auth: false }),
]
