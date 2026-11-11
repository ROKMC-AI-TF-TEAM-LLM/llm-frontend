import { useRef } from 'react'
import { useMutationState } from '@tanstack/react-query'
import { showToast } from '@/shared/store/toastStore'
import { confirm } from '@/shared/store/confirmStore'
import { readApiError } from '@/shared/utils/error'
import {
  useProjectDocuments,
  useUploadProjectDocument,
  useDeleteProjectDocument,
  useRetryProjectDocument,
  projectDocumentDeleteKey,
} from './documents'

/** 프로젝트 파일 목록과 올리기·삭제·재시도 동작 (프로젝트 화면의 파일 영역) */
export function useProjectFiles(id: string | undefined) {
  const { data: docsData } = useProjectDocuments(id)
  const documents = docsData?.data?.data?.documents ?? []
  const {
    mutate: uploadDoc,
    isPending: isUploading,
    variables: uploadingFile,
  } = useUploadProjectDocument(id ?? '')
  const { mutate: deleteDoc } = useDeleteProjectDocument(id ?? '')
  const { mutate: retryDoc } = useRetryProjectDocument(id ?? '')
  const fileInputRef = useRef<HTMLInputElement>(null)
  // 진행 중인 삭제를 뮤테이션 캐시에서 읽는다. 컴포넌트 state와 달리 페이지가 다시 마운트돼도 유지되고,
  // 여러 파일을 동시에 지워도 각 행이 자기 상태를 표시한다.
  const deletingIds = useMutationState({
    filters: {
      mutationKey: projectDocumentDeleteKey(id ?? ''),
      status: 'pending',
    },
    select: (m) => m.state.variables as string,
  })
  const isDeletingRow = (documentId: string) => deletingIds.includes(documentId)
  // 되돌릴 수 없으므로 프로젝트·대화 삭제와 같이 확인을 받는다.
  const handleDeleteDoc = async (documentId: string) => {
    if (isDeletingRow(documentId)) return
    const name =
      documents.find((d) => d.document_id === documentId)?.name ?? '이 파일'
    const ok = await confirm({
      title: `'${name}'을(를) 프로젝트에서 삭제하시겠습니까?`,
      message: '이후 대화에서 이 파일을 참조하지 않으며 되돌릴 수 없습니다.',
      danger: true,
    })
    if (ok) deleteDoc(documentId)
  }

  const MAX_UPLOAD = 50 * 1024 * 1024
  const ALLOWED_EXT = ['md', 'txt', 'pdf']
  const tryUpload = (file: File): boolean => {
    if (!id) return false
    if (isUploading) {
      showToast('이전 파일을 업로드하는 중입니다. 완료 후 다시 시도해주세요.')
      return false
    }
    // accept 속성은 파일 선택 창의 '모든 파일'로 우회되므로 직접 확인한다.
    const ext = file.name.includes('.')
      ? file.name.split('.').pop()!.toLowerCase()
      : ''
    if (!ALLOWED_EXT.includes(ext)) {
      showToast(`'${file.name}' 지원하지 않는 형식입니다. (.md, .txt, .pdf)`)
      return false
    }
    if (file.size > MAX_UPLOAD) {
      showToast(`'${file.name}' 50MB를 초과하여 업로드할 수 없습니다.`)
      return false
    }
    if (file.size === 0) {
      showToast(`'${file.name}' 빈 파일은 업로드할 수 없습니다.`)
      return false
    }
    uploadDoc(file)
    return true
  }
  const handlePickFile = () => {
    if (isUploading) {
      showToast('이전 파일을 업로드하는 중입니다. 완료 후 다시 시도해주세요.')
      return
    }
    fileInputRef.current?.click()
  }
  const handleUploadFiles = (files: FileList | null) => {
    const file = files?.[0]
    if (file) tryUpload(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }
  const handleRetryDoc = (documentId: string) => {
    retryDoc(documentId, {
      onError: (e) => {
        const { detail } = readApiError(e)
        showToast(detail ?? '재시도에 실패했습니다. 잠시 후 다시 시도해주세요.')
      },
    })
  }

  return {
    documents,
    isUploading,
    uploadingFile,
    deletingIds,
    isDeletingRow,
    fileInputRef,
    tryUpload,
    handlePickFile,
    handleUploadFiles,
    handleDeleteDoc,
    handleRetryDoc,
  }
}
