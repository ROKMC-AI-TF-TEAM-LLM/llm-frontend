import { useState, type KeyboardEvent } from 'react'
import type { DocGenJob, DocGenOutputFormat } from '../../types/docgen'
import { useCreateDocGenJob, useDocGenJobs, useDocGenTemplates } from '../../hooks/useDocGen'
import { useDomainCapabilities } from '../../hooks/useCapabilities'
import { showToast } from '../../api/store/toastStore'
import { isJobActive } from '../../utils/docgen'

/** 입력창 값과 보내기. 분야는 capabilities, 양식은 서버 양식 목록에서 고른다 */
export const useComposer = () => {
  const [prompt, setPrompt] = useState('')
  const [templateId, setTemplateId] = useState<string | null>(null)
  /** '' = 전체 분야 */
  const [domain, setDomain] = useState('')
  const [format, setFormat] = useState<DocGenOutputFormat | null>(null)
  const { templates } = useDocGenTemplates()
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

/**
 * 화면을 연 뒤 새로 생긴 작업인지. 처음 받아 온 목록을 기준으로 삼고,
 * 그 뒤에 나타난 줄에만 등장 움직임을 준다.
 */
export const useFreshIds = (ids: string[], ready: boolean) => {
  const [baseline, setBaseline] = useState<Set<string> | null>(null)
  if (ready && baseline === null) setBaseline(new Set(ids))
  return (id: string) => baseline !== null && !baseline.has(id)
}

/**
 * 문서 제작 화면(DocGenWorkspace) 상태: 입력창, 오른쪽 미리보기(열림·띄운 작업), 진행 중/끝난 작업 목록.
 * 보내면 응답을 기다리지 않고 미리보기부터 열어 스켈레톤을 보여 준다.
 */
export const useDocGenWorkspace = () => {
  const { jobs, isLoading } = useDocGenJobs()
  const composer = useComposer()
  const isFresh = useFreshIds(jobs.map((j) => j.job_id), !isLoading)

  const [previewOpen, setPreviewOpen] = useState(false)
  /** 미리보기에 띄운 작업. 보내면 새 작업, 목록에서 고르면 그 작업 */
  const [viewId, setViewId] = useState<string | null>(null)
  /** 생성 요청 응답을 기다리는 중 */
  const [pending, setPending] = useState(false)

  const viewed = jobs.find((j) => j.job_id === viewId) ?? null
  /** 목록에서 강조할 작업 (미리보기가 닫혀 있으면 없음) */
  const previewingId = previewOpen ? viewId : null

  const activeJobs = jobs.filter(isJobActive)
  const finishedJobs = jobs.filter((j) => !isJobActive(j))

  const send = async () => {
    if (!composer.canSubmit || pending) return
    setPending(true)
    setViewId(null)
    setPreviewOpen(true)
    const job = await composer.submit()
    setPending(false)
    if (job) setViewId(job.job_id)
    else setPreviewOpen(false) // 보내지 못하면(알림은 useComposer가 띄움) 미리보기를 다시 닫는다
  }

  const view = (id: string) => {
    setViewId(id)
    setPreviewOpen(true)
  }

  return {
    composer, isFresh, pending, send,
    activeJobs, finishedJobs,
    preview: { open: previewOpen, job: viewed, previewingId, view, close: () => setPreviewOpen(false) },
  }
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
