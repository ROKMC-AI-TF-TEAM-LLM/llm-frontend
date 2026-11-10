import { useState, type KeyboardEvent } from 'react'
import type { DocGenJob, DocGenOutputFormat } from '../../types/docgen'
import { useCreateDocGenJob, useDocGenTemplates } from '../../hooks/useDocGen'
import { useDomainCapabilities } from '../../hooks/useCapabilities'
import { showToast } from '../../store/toastStore'

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
