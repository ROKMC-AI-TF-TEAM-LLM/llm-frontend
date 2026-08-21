export type TranslateLang = 'ko' | 'en'

export interface TranslateRequest {
  text: string
  source: TranslateLang
  target: TranslateLang
  style?: string
}

export interface TranslateTermApplied {
  source: string
  target: string
  term_id: string
  spans: number[][]
  confidence: string
}

export interface TranslateMeta {
  chunks?: number
  retries?: number
  elapsed_ms?: number
  backend?: string
  prompt_version?: string
  glossary_version?: number
  [key: string]: unknown
}

export interface TranslateData {
  translation: string
  terms_applied: TranslateTermApplied[]
  warnings: Record<string, unknown>[]
  meta: TranslateMeta
}

export type TranslateErrorCode =
  | 'UNAUTHORIZED'
  | 'TEXT_TOO_LONG'
  | 'VALIDATION_ERROR'
  | 'TRANSLATE_SERVER_ERROR'

export interface TranslateResponse {
  success: boolean
  status_code: number
  data: TranslateData
  error: { code: TranslateErrorCode; detail: string } | null
}
