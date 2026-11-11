import { useState } from 'react'
import type { DocumentItem } from '../types'
import { getDomainStyle, getDomainLabel } from '@/features/domains/utils'
import { formatAppliedAt } from '../utils'
import { downloadDocument } from '@/shared/utils/downloadAttachment'
import {
  CloseIcon,
  DocumentIcon,
  DownloadIcon,
  SpinnerIcon,
} from '@/shared/components/icons'
import IconButton from '@/shared/components/IconButton'
import Button from '@/shared/components/Button'

interface RagDetailProps {
  doc: DocumentItem
  onClose: () => void
}

const RagDetail = ({ doc, onClose }: RagDetailProps) => {
  const style = getDomainStyle(doc.domain)
  const [downloading, setDownloading] = useState(false)
  const [downloadErr, setDownloadErr] = useState<string | null>(null)

  const handleDownload = async () => {
    if (downloading) return
    setDownloading(true)
    setDownloadErr(null)
    const msg = await downloadDocument(doc.document_id, doc.name)
    if (msg) setDownloadErr(msg)
    setDownloading(false)
  }

  const rows = [
    { label: '문서 종류', value: doc.type },
    { label: '소유 부서', value: doc.owning_department },
    { label: '공개 범위', value: doc.visibility },
    { label: '적용일', value: formatAppliedAt(doc.applied_at) },
  ].filter((r) => !!r.value)

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-end h-14 px-5 shrink-0">
        <IconButton onClick={onClose} label="닫기">
          <CloseIcon className="w-5 h-5" />
        </IconButton>
      </div>

      <div className="flex-1 overflow-y-auto custom-scroll px-8 pb-10">
        {doc.domain && (
          <span
            className="inline-block text-12 font-semibold px-3 py-1 rounded-full"
            style={{ background: style.badgeBg, color: style.badgeText }}
          >
            {getDomainLabel(doc.domain)}
          </span>
        )}

        <div className="flex items-center gap-3.5 mt-4">
          <div
            className="shrink-0 flex items-center justify-center"
            style={{
              width: 48,
              height: 48,
              borderRadius: 13,
              background: style.badgeBg,
              color: style.bar,
            }}
          >
            <DocumentIcon width="22" height="22" />
          </div>
          <h1 className="text-lg font-bold text-text-primary break-all leading-snug">
            {doc.name}
          </h1>
        </div>

        {rows.length > 0 && (
          <dl className="mt-7 rounded-2xl bg-surface-subtle overflow-hidden divide-y divide-surface-border">
            {rows.map((r) => (
              <div
                key={r.label}
                className="flex items-center justify-between gap-4 px-5 py-4"
              >
                <dt className="text-13 text-text-muted shrink-0">{r.label}</dt>
                <dd className="text-14 font-semibold text-text-primary text-right break-all">
                  {r.value}
                </dd>
              </div>
            ))}
          </dl>
        )}

        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleDownload}
          disabled={downloading}
          className="mt-6"
        >
          {downloading ? (
            <SpinnerIcon className="w-4 h-4 animate-spin" trackOpacity={0.3} />
          ) : (
            <DownloadIcon className="w-4 h-4" strokeWidth={2.2} />
          )}
          {downloading ? '내려받는 중...' : '원본 다운로드'}
        </Button>
        {downloadErr && (
          <p className="mt-2 text-13 text-status-error text-center">
            {downloadErr}
          </p>
        )}
      </div>
    </div>
  )
}

export default RagDetail
