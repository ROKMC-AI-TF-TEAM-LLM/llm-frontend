// TEMP(시안 비교용): 6단계에서 drafts 폴더째 삭제
import { useSearchParams } from 'react-router-dom'
import type { PageState } from '../../../utils/docgen'
import { SCENARIOS } from './fixtures'

export const PAGE_STATES: { value: PageState; label: string }[] = [
  { value: 'idle', label: '처음' },
  { value: 'queued', label: '대기' },
  { value: 'running', label: '생성 중' },
  { value: 'completed', label: '완료' },
  { value: 'failed', label: '실패' },
]

export const DRAFTS = [
  { v: 'v1', name: '기본형' },
  { v: 'v2', name: '대화형' },
  { v: 'v3', name: '미리보기 중심' },
  { v: 'v4', name: '진행 강조' },
  { v: 'v5', name: '반응형 미리보기' },
]

export const useDraftScenario = () => {
  const [params] = useSearchParams()
  const raw = params.get('state') as PageState | null
  const state: PageState = raw && raw in SCENARIOS ? raw : 'idle'
  return { state, scenario: SCENARIOS[state] }
}
