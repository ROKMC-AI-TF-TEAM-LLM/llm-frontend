import { backendApi } from '../lib/axios'
import type { TranslateRequest, TranslateResponse } from '../../types/translate'

export const translate = (data: TranslateRequest) =>
  backendApi.post<TranslateResponse>('/api/v1/translate', data)
