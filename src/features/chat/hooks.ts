import { useEffect, useEffectEvent, useLayoutEffect, useState } from 'react'
import { showToast } from '@/shared/store/toastStore'
import { ERROR_TEXT, isNetworkError, readApiError } from '@/shared/utils/error'
import { logError } from '@/shared/utils/logError'
import { useChatStore } from './store'

interface ChatSessionOptions {
  /** 서버 오류 코드별 문구 (대화가 없거나 접근할 수 없을 때) */
  knownErrors: Record<string, string>
  /** 연결 실패를 기록할 때 쓰는 이름과 부가 정보 */
  logLabel: string
  logContext?: Record<string, unknown>
  /**
   * knownErrors에 있는 오류가 났을 때. 넘기지 않으면 그 문구를 화면에 보인다(다시 시도 불가).
   * 넘기면 화면 쪽에서 처리한다(알림 후 이동 등).
   */
  onKnownError?: (message: string) => void
  /** 그 밖의 오류(5xx·네트워크 오류가 아닌 것). 보통 다른 화면으로 보낸다 */
  onUnknownError: () => void
  /** 첫 응답이 실패해 대화가 지워졌을 때. message는 사용자에게 보일 오류 문구 */
  onDeleted: (message: string | null) => void
  /** 연결에 성공했을 때 */
  onConnected?: () => void
}

/**
 * 채팅 세션에 연결하고, 연결 오류와 대화 삭제를 처리한다. (채팅 화면과 프로젝트 화면이 함께 쓴다)
 *
 * - sessionId가 바뀌면 다시 연결한다. undefined면 연결을 끊는다.
 * - 5xx·네트워크 오류는 connectError(canRetry: true)로 돌려주고 retry()로 다시 시도한다.
 * - 스트림 오류는 알림으로 띄운다.
 * 화면마다 다른 부분(오류 문구, 이동할 주소)은 options로 받는다.
 */
export function useChatSession(
  sessionId: string | undefined,
  options: ChatSessionOptions,
) {
  const connect = useChatStore((s) => s.connect)
  const disconnect = useChatStore((s) => s.disconnect)
  const isConnecting = useChatStore((s) => s.isConnecting)
  const error = useChatStore((s) => s.error)
  const clearError = useChatStore((s) => s.clearError)
  const isDeleted = useChatStore((s) => s.isDeleted)
  const resetDeleted = useChatStore((s) => s.resetDeleted)

  // 어느 대화의 오류인지 함께 저장해, 다른 대화로 옮기면 자동으로 무시되게 한다.
  const [failure, setFailure] = useState<{
    sessionId: string
    message: string
    canRetry: boolean
  } | null>(null)
  const [retryKey, setRetryKey] = useState(0)

  // 화면에서 넘긴 콜백은 바뀌어도 다시 연결하지 않도록 effect event로 그때의 최신 값을 읽는다.
  const handleConnected = useEffectEvent(() => {
    setFailure(null)
    options.onConnected?.()
  })
  const handleConnectError = useEffectEvent((id: string, e: unknown) => {
    logError(options.logLabel, e, options.logContext)
    const { code, detail, status = 0 } = readApiError(e)
    const known = code ? options.knownErrors[code] : undefined
    if (known) {
      if (options.onKnownError) options.onKnownError(known)
      else setFailure({ sessionId: id, message: known, canRetry: false })
    } else if (status >= 500) {
      setFailure({
        sessionId: id,
        message: detail
          ? `서버에 일시적인 오류가 발생했습니다. (${status}: ${detail})`
          : `서버에 일시적인 오류가 발생했습니다. (${status})`,
        canRetry: true,
      })
    } else if (isNetworkError(e)) {
      setFailure({
        sessionId: id,
        message: ERROR_TEXT.network,
        canRetry: true,
      })
    } else {
      options.onUnknownError()
    }
  })
  const handleDeleted = useEffectEvent((message: string | null) =>
    options.onDeleted(message),
  )

  // useLayoutEffect: 라우터 내비게이션은 트랜지션으로 커밋되므로 useEffect면
  // 이전 대화의 메시지가 한 프레임 그려질 수 있다. 페인트 전에 연결한다.
  useLayoutEffect(() => {
    if (sessionId === undefined) {
      disconnect()
      return
    }
    let cancelled = false
    connect(sessionId)
      .then(() => {
        if (!cancelled) handleConnected()
      })
      .catch((e) => {
        if (!cancelled) handleConnectError(sessionId, e)
      })
    return () => {
      cancelled = true
    }
  }, [sessionId, retryKey, connect, disconnect])

  // 스트림 오류와, 첫 응답 실패로 대화가 지워진 경우
  useEffect(() => {
    if (isDeleted) {
      const message = error
      resetDeleted()
      clearError()
      handleDeleted(message)
      return
    }
    if (error) {
      showToast(error)
      clearError()
    }
  }, [isDeleted, error, resetDeleted, clearError])

  // 같은 대화로 돌아와 다시 연결 중일 때는 이전 오류를 숨긴다(성공하면 지워진다).
  const connectError =
    failure && failure.sessionId === sessionId && !isConnecting
      ? { message: failure.message, canRetry: failure.canRetry }
      : null

  const retry = () => {
    setFailure(null)
    setRetryKey((k) => k + 1)
  }

  return { isConnecting, connectError, retry }
}
