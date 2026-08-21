import { useMutation } from '@tanstack/react-query'
import { translate } from '../api/services/translate'
import type { TranslateRequest } from '../types/translate'

export const useTranslate = () =>
  useMutation({
    mutationFn: (data: TranslateRequest) => translate(data),
  })
