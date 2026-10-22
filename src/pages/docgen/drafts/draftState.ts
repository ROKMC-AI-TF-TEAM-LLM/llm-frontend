// TEMP(시안 비교용): 시안이 정해지면 drafts 폴더째 삭제
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { resetDocGenMock } from '../../../api/services/docgenMock'

export const DRAFTS = [
  { v: 'v1', name: '기본형' },
  { v: 'v2', name: '대화형' },
  { v: 'v3', name: '미리보기 중심' },
  { v: 'v4', name: '진행 강조' },
  { v: 'v5', name: '반응형 미리보기' },
  { v: 'v6', name: '전송 모션' },
  { v: 'v7', name: '전송 모션 다듬기' },
]

/**
 * 시안을 열 때마다 목 작업을 비워 처음 상태에서 시작한다.
 * 작업 목록을 부르는 훅보다 먼저 불러야 한다.
 */
export const useFreshDraft = () => {
  const queryClient = useQueryClient()
  useState(() => {
    resetDocGenMock()
    queryClient.removeQueries({ queryKey: ['docgen', 'jobs'] })
    return true
  })
}
