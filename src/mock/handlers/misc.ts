import type { TranslateRequest } from '../../types/translate'
import { DOMAINS } from '../../utils/document'
import { get, ok, post, type MockRoute } from '../server'

export const miscRoutes: MockRoute[] = [
  get('/health', () => ok({ db: true, llm_server: true }), { auth: false }),

  // 분야 목록은 프론트 정의와 같게 맞춘다
  get('/capabilities', () => ok({ domains: DOMAINS, tools: [] })),

  post('/translate', async ({ request }) => {
    const { text, target } = await request.json() as TranslateRequest
    const prefix = target === 'en' ? '[Mock translation]' : '[예시 번역]'
    return ok({
      translation: `${prefix}\n\n${text}`,
      terms_applied: [],
      warnings: [],
      meta: { backend: 'mock', elapsed_ms: 0 },
    })
  }),
]
