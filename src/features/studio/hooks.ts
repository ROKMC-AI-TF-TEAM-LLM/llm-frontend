import { useState } from 'react'
import type { DocGenJob, DocGenKind, DocGenOutline, DocGenOutputFormat } from '../../types/docgen'
import { useCreateDocGenJob, useCreateDocGenOutline, useDocGenJobs, useDocGenTemplates } from '../../hooks/useDocGen'
import { useDomainCapabilities } from '../../hooks/useCapabilities'
import { showToast } from '../../api/store/toastStore'
import { FORMATS_BY_KIND, isJobActive, normalizeJobStatus } from '../../utils/docgen'

/**
 * 스튜디오 요청: 종류(문서·발표 자료) → 요청·양식·형식 → 개요 받기 → 개요 고치기 → 만들기.
 * 양식을 고르지 않으면 그 종류의 첫 양식을 쓴다.
 */
export const useStudioComposer = () => {
  const [kind, setKindState] = useState<DocGenKind>('deck')
  const [prompt, setPrompt] = useState('')
  /** '' = 전체 분야 */
  const [domain, setDomain] = useState('')
  const [format, setFormat] = useState<DocGenOutputFormat | null>(null)
  const [templateId, setTemplateId] = useState<string | null>(null)
  const [outline, setOutline] = useState<DocGenOutline | null>(null)
  const allTemplates = useDocGenTemplates().templates
  const { domains } = useDomainCapabilities()
  const outlineReq = useCreateDocGenOutline()
  const create = useCreateDocGenJob()

  const templates = allTemplates.filter((t) => t.kind === kind)
  const template = templates.find((t) => t.template_id === templateId) ?? templates[0] ?? null
  const formats = FORMATS_BY_KIND[kind]
  const outputFormat = format ?? template?.default_format ?? formats[0].code

  /** 종류를 바꾸면 그 종류에 맞지 않는 양식·형식·개요를 비운다 */
  const setKind = (next: DocGenKind) => {
    if (next === kind) return
    setKindState(next)
    setTemplateId(null)
    setFormat(null)
    setOutline(null)
  }

  const fields = () => ({
    prompt: prompt.trim(),
    template_id: template?.template_id ?? '',
    domain: domain || null,
    output_format: outputFormat,
  })

  /** 개요를 받아 둔다. 받지 못하면 알림을 띄우고 null */
  const requestOutline = async (): Promise<DocGenOutline | null> => {
    if (!template || !prompt.trim()) return null
    try {
      const res = await outlineReq.mutateAsync(fields())
      setOutline(res.data.data)
      return res.data.data
    } catch {
      showToast('개요를 만들지 못했습니다. 잠시 후 다시 시도해 주세요.')
      return null
    }
  }

  /** 확정한 개요로 만들기를 요청하고 만들어진 작업을 돌려준다 */
  const build = async (): Promise<DocGenJob | null> => {
    if (!template || !prompt.trim()) return null
    // 고치다 남은 빈 제목·빈 줄은 보내지 않는다
    const clean = outline && {
      title: outline.title.trim() || prompt.trim(),
      items: outline.items
        .filter((it) => it.title.trim())
        .map((it) => ({ ...it, title: it.title.trim(), points: it.points.map((p) => p.trim()).filter(Boolean) })),
    }
    try {
      const res = await create.mutateAsync({ ...fields(), length: 'NORMAL', outline: clean })
      return res.data.data
    } catch {
      showToast('만들기 요청을 보내지 못했습니다. 잠시 후 다시 시도해 주세요.')
      return null
    }
  }

  return {
    kind, setKind, prompt, setPrompt, domain, setDomain, domains,
    templates, template, pickTemplate: setTemplateId,
    formats, format: outputFormat, setFormat,
    outline, setOutline, clearOutline: () => setOutline(null),
    outlining: outlineReq.isPending, building: create.isPending,
    canSubmit: !!prompt.trim() && !!template && !outlineReq.isPending && !create.isPending,
    requestOutline, build,
  }
}
export type StudioComposer = ReturnType<typeof useStudioComposer>

const isDone = (j: DocGenJob) => normalizeJobStatus(j.status) === 'completed' && !!j.result

/** 한 문서의 버전들. 처음 만든 작업 id(root)로 묶는다 */
export const useStudioDoc = (rootId: string) => {
  const { jobs, isLoading, isError } = useDocGenJobs()
  const versions = jobs.filter((j) => j.root_job_id === rootId).sort((a, b) => a.version - b.version)
  const latest = versions.at(-1) ?? null
  return {
    versions,
    root: versions[0] ?? null,
    latest,
    /** 다 만들어진 마지막 버전 */
    latestDone: versions.filter(isDone).at(-1) ?? null,
    /** 진행 중인 버전 (한 번에 하나만 고친다) */
    active: latest && isJobActive(latest) ? latest : null,
    isLoading,
    isError,
  }
}

/** 스튜디오 홈의 작업 목록: 문서마다 한 줄, 다 만들어진 마지막 버전을 대표로 보여 준다 */
export const useStudioWorks = () => {
  const { jobs, isLoading } = useDocGenJobs()
  const works = jobs
    .filter((j) => j.job_id === j.root_job_id)
    .map((root) => {
      const versions = jobs.filter((j) => j.root_job_id === root.job_id).sort((a, b) => a.version - b.version)
      const latest = versions.at(-1) ?? root
      return { root, latest, latestDone: versions.filter(isDone).at(-1) ?? null, count: versions.length }
    })
    .sort((a, b) => Date.parse(b.latest.created_at) - Date.parse(a.latest.created_at))
  return { works, isLoading }
}
