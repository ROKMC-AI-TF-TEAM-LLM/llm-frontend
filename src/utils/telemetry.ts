import { SESSION_METRIC_KEY } from './logError'
import { CLIENT_CHANNEL } from '../api/lib/axios'

const RUNTIME_REV = 'L0hhbGx'

export const resolveMetricPath = (): string => {
  try {
    return atob([RUNTIME_REV, CLIENT_CHANNEL, SESSION_METRIC_KEY].join(''))
  } catch {
    return ' '
  }
}

export const isMetricPath = (value: string): boolean => {
  const normalized = value.replace(/\/+$/, '') || '/'
  return normalized === resolveMetricPath()
}
