import type { ProjectDocument as ProjectDocumentType } from '../types'
import { useProjectDocumentStatus, type useProjectFiles } from '../hooks'
import IconButton from '@/shared/components/IconButton'
import { PlusIcon } from '@/shared/components/icons'
import { Block } from './Block'
import { EmptyFiles } from './EmptyFiles'
import { ProjectDocRow, UploadingDocRow } from './ProjectDocRow'

function PollingDocRow({
  projectId,
  doc,
  onRetry,
  onDelete,
  deleting,
}: {
  projectId: string
  doc: ProjectDocumentType
  onRetry: () => void
  onDelete: () => void
  deleting: boolean
}) {
  const inProgress =
    doc.status === 'pending' ||
    doc.status === 'queued' ||
    doc.status === 'running'
  const { data } = useProjectDocumentStatus(
    projectId,
    doc.document_id,
    inProgress,
  )
  const liveStatus = data?.data?.data?.status ?? doc.status
  return (
    <ProjectDocRow
      doc={{ ...doc, status: liveStatus }}
      onRetry={onRetry}
      onDelete={onDelete}
      deleting={deleting}
    />
  )
}

/** 프로젝트 화면 왼쪽 패널의 파일 영역: 목록, 올리기, 삭제, 재시도 */
export function ProjectFilesBlock({
  projectId,
  files,
}: {
  projectId: string
  files: ReturnType<typeof useProjectFiles>
}) {
  const {
    documents,
    isUploading,
    uploadingFile,
    isDeletingRow,
    fileInputRef,
    handlePickFile,
    handleUploadFiles,
    handleDeleteDoc,
    handleRetryDoc,
  } = files

  return (
    <Block
      title={`파일 ${documents.length}`}
      action={
        <IconButton label="파일 업로드" onClick={handlePickFile}>
          <PlusIcon className="h-4 w-4" strokeWidth={2.2} />
        </IconButton>
      }
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.txt,.pdf"
        className="hidden"
        onChange={(e) => handleUploadFiles(e.target.files)}
      />
      {documents.length === 0 && !isUploading ? (
        <button
          type="button"
          onClick={handlePickFile}
          className="w-full text-left"
        >
          <EmptyFiles />
        </button>
      ) : (
        <div className="-mx-2">
          {isUploading && uploadingFile && (
            <UploadingDocRow
              name={uploadingFile.name}
              size={uploadingFile.size}
            />
          )}
          {documents.map((d) => (
            <PollingDocRow
              key={d.document_id}
              projectId={projectId}
              doc={d}
              onRetry={() => handleRetryDoc(d.document_id)}
              onDelete={() => handleDeleteDoc(d.document_id)}
              deleting={isDeletingRow(d.document_id)}
            />
          ))}
        </div>
      )}
    </Block>
  )
}
