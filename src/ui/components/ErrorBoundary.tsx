import { Component, type ErrorInfo, type ReactNode } from 'react'
import { isChunkLoadError, tryReloadOnce } from '../../utils/chunkReload'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // 청크 로드 실패(보통 새 배포/HMR로 stale)는 새로고침하면 복구되므로 자동 새로고침한다.
    if (isChunkLoadError(error)) {
      tryReloadOnce()
      return
    }
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary]', error, info.componentStack)
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      // 사용자에게는 기술적 에러 메시지(코드)를 노출하지 않는다.
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
          <p className="text-base font-semibold text-text-primary">페이지를 불러오지 못했습니다.</p>
          <p className="text-sm text-text-muted">잠시 후 다시 시도해주세요.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm rounded-full bg-brand text-white hover:bg-brand-hover transition-colors"
          >
            다시 시도
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
