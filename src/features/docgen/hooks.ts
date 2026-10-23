import { useState, type KeyboardEvent } from 'react'
import type { DocGenJob, DocGenOutputFormat } from '../../types/docgen'
import { useCreateDocGenJob, useDocGenJobs, useDocGenTemplates } from '../../hooks/useDocGen'
import { useDomainCapabilities } from '../../hooks/useCapabilities'
import { showToast } from '../../api/store/toastStore'

/** 입력창 값과 보내기. 분야는 capabilities, 양식은 서버 양식 목록에서 고른다 */
export const useComposer = () => {
  const [prompt, setPrompt] = useState('')
  const [templateId, setTemplateId] = useState<string | null>(null)
  /** '' = 전체 분야 */
  const [domain, setDomain] = useState('')
  const [format, setFormat] = useState<DocGenOutputFormat | null>(null)
  // 문서 생성 시안은 문서 양식만 쓴다. 발표 자료는 스튜디오(features/studio)에서 만든다
  const templates = useDocGenTemplates().templates.filter((t) => t.kind === 'doc')
  const { domains } = useDomainCapabilities()
  const create = useCreateDocGenJob()
  const template = templates.find((t) => t.template_id === templateId)

  const pickTemplate = (id: string) => {
    setTemplateId(id)
    if (!format) setFormat(templates.find((t) => t.template_id === id)?.default_format ?? null)
  }

  /** 요청을 보내고 만들어진 작업을 돌려준다. 보내지 못하면 알림을 띄우고 null */
  const submit = async (): Promise<DocGenJob | null> => {
    if (!template || !prompt.trim()) return null
    try {
      const res = await create.mutateAsync({
        prompt: prompt.trim(),
        template_id: template.template_id,
        domain: domain || null,
        output_format: format ?? template.default_format,
        length: 'NORMAL',
      })
      return res.data.data
    } catch {
      showToast('문서 생성 요청을 보내지 못했습니다. 잠시 후 다시 시도해 주세요.')
      return null
    }
  }

  return {
    prompt, setPrompt, templateId, pickTemplate, template, templates,
    domain, setDomain, domains, format, setFormat,
    canSubmit: !!prompt.trim() && !!template && !create.isPending,
    submit,
  }
}
export type Composer = ReturnType<typeof useComposer>

/** 목록에서 고른 작업. 목록이 갱신되면 같은 id의 최신 상태를 돌려준다 */
export const useJobSelection = (jobs: DocGenJob[]) => {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = jobs.find((j) => j.job_id === selectedId) ?? null
  return { selected, select: setSelectedId, close: () => setSelectedId(null) }
}

/**
 * 화면을 연 뒤 새로 생긴 작업인지. 처음 받아 온 목록을 기준으로 삼고,
 * 그 뒤에 나타난 줄에만 등장 움직임을 준다.
 */
export const useFreshIds = (ids: string[], ready: boolean) => {
  const [baseline, setBaseline] = useState<Set<string> | null>(null)
  if (ready && baseline === null) setBaseline(new Set(ids))
  return (id: string) => baseline !== null && !baseline.has(id)
}

/** 문서 생성 화면 한 벌: 작업 목록 + 입력창 + 고른 작업 + 새 줄 표시 */
export const useDocGenPage = () => {
  const { jobs, isLoading } = useDocGenJobs()
  const c = useComposer()
  const { selected, select, close } = useJobSelection(jobs)
  const isFresh = useFreshIds(jobs.map((j) => j.job_id), !isLoading)

  /** 보내고, 만들어진 작업을 미리보기로 고른 뒤 입력창을 비운다 */
  const send = async () => {
    const job = await c.submit()
    if (job) {
      select(job.job_id)
      c.setPrompt('')
    }
    return job
  }

  return { jobs, isLoading, c, selected, select, close, isFresh, send }
}

/** 진행 상황 목록에서 누를 수 있는 줄 */
export const selectable = (onSelect: () => void) => ({
  role: 'button' as const,
  tabIndex: 0,
  onClick: onSelect,
  onKeyDown: (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect()
    }
  },
})
