import { useMutation } from '@tanstack/react-query'
import { translate } from './api'
import type { TranslateRequest } from './types'

export const useTranslate = () =>
  useMutation({
    mutationFn: (data: TranslateRequest) => translate(data),
  })
