// 답변 스트림 실행: 새 질문(executeStream)과 다시 생성(executeRegenerate).
// 스토어의 set/get을 받아 메시지를 갱신한다. 보고 있지 않은 대화의 스트림은 runtime의 streamRegistry에 쌓는다.
import type { StoreApi } from 'zustand'
import type { Source, Notice } from '../types'
import type { FileAttachment } from '@/shared/types/attachment'
import { streamMessage, regenerateMessageStream } from '../api'
import { deleteSession } from '@/features/sessions/api'
import { logError } from '@/shared/utils/logError'
import { isAbortError } from '../utils'
import { messageCache, clearCache, clearInflight } from '../storage'
import { invalidateSessionLists, streamRegistry } from './runtime'
import type { ChatStore } from './types'

export const createStreamRunners = (
  set: StoreApi<ChatStore>['setState'],
  get: StoreApi<ChatStore>['getState'],
) => {
  const createWriter = (sessionId: string, assistantId: string) => {
    let buffer = ''
    let flushTimer: ReturnType<typeof setTimeout> | null = null
    const applyChunk = (chunk: string) => {
      if (get().sessionId !== sessionId) {
        const reg = streamRegistry.get(sessionId)
        if (reg) {
          streamRegistry.set(
            sessionId,
            reg.map((m) =>
              m.id === assistantId && m.type === 'text'
                ? { ...m, content: m.content + chunk }
                : m,
            ),
          )
        }
        return
      }
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === assistantId && m.type === 'text'
            ? { ...m, content: m.content + chunk }
            : m,
        ),
      }))
      streamRegistry.set(sessionId, get().messages)
    }
    const flush = () => {
      flushTimer = null
      if (!buffer) return
      const sel = typeof window !== 'undefined' ? window.getSelection() : null
      if (sel && !sel.isCollapsed && sel.toString().length > 0) {
        flushTimer = setTimeout(flush, 250)
        return
      }
      const chunk = buffer
      buffer = ''
      applyChunk(chunk)
    }
    return {
      push: (chunk: string) => {
        buffer += chunk
        // 답변이 길어질수록 매 flush마다 전체 마크다운을 다시 파싱하는 비용이 커져
        // 프레임 드롭(끊김)이 생긴다. 60ms는 리렌더가 너무 잦아 그 비용이 누적되므로
        // 간격을 넓혀 리렌더 횟수 자체를 줄인다. 청크가 대개 문장 단위(수백 ms 간격)로
        // 오므로 130ms 정도로는 체감 지연이 거의 없다.
        if (!flushTimer) flushTimer = setTimeout(flush, 130)
      },
      flushNow: () => {
        if (flushTimer) {
          clearTimeout(flushTimer)
          flushTimer = null
        }
        if (buffer) {
          const c = buffer
          buffer = ''
          applyChunk(c)
        }
      },
      setSources: (sources: Source[]) => {
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === assistantId && m.type === 'text' ? { ...m, sources } : m,
          ),
        }))
      },
      setAttachments: (attachments: FileAttachment[]) => {
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === assistantId && m.type === 'text'
              ? { ...m, attachments }
              : m,
          ),
        }))
      },
      setNotice: (notice: Notice) => {
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === assistantId && m.type === 'text' ? { ...m, notice } : m,
          ),
        }))
      },
      setStatus: (message: string) => {
        if (get().sessionId !== sessionId) return
        set((state) => {
          const last = state.statusSteps[state.statusSteps.length - 1]
          return {
            statusText: message,
            statusSteps:
              last?.message === message
                ? state.statusSteps
                : [...state.statusSteps, { message }],
          }
        })
      },
      setThought: (thought: string) => {
        if (get().sessionId !== sessionId) return
        set((state) => {
          const steps = state.statusSteps
          if (steps.length === 0)
            return { statusSteps: [{ message: '생각하는 중', thought }] }
          const next = steps.slice()
          next[next.length - 1] = { ...next[next.length - 1], thought }
          return { statusSteps: next }
        })
      },
    }
  }

  const executeStream = async (
    sessionId: string,
    assistantId: string,
    question: string,
    isFirstMessage: boolean,
    signal: AbortSignal,
    domain?: string,
  ): Promise<void> => {
    const writer = createWriter(sessionId, assistantId)

    try {
      await streamMessage(
        sessionId,
        { question, ...(domain ? { domain } : {}) },
        writer.push,
        signal,
        writer.setSources,
        writer.setStatus,
        writer.setAttachments,
        writer.setNotice,
        writer.setThought,
      )
      writer.flushNow()
    } catch (e) {
      logError('executeStream', e)
      writer.flushNow()
      // 레지스트리는 '읽은 뒤에' 지운다. 먼저 지우면 다른 대화를 보고 있을 때
      // 그 대화의 메시지를 이 세션의 것으로 착각한다.
      const viewing = get().sessionId === sessionId
      const liveMsgs = viewing
        ? get().messages
        : (streamRegistry.get(sessionId) ?? [])
      streamRegistry.delete(sessionId)
      clearInflight(sessionId)
      if (signal.aborted) return

      if (isFirstMessage) {
        clearCache(sessionId)
        messageCache.delete(sessionId)
        streamRegistry.delete(sessionId)
        deleteSession(sessionId)
          .then(invalidateSessionLists)
          .catch((e) => logError('deleteSession', e))
        if (viewing)
          set({
            error: '응답 중 오류가 발생했습니다.',
            isStreaming: false,
            abortController: null,
            isDeleted: true,
          })
        return
      }

      const interrupted = liveMsgs.map((m) =>
        m.id === assistantId && m.type === 'text'
          ? { ...m, status: 'interrupted' as const }
          : m,
      )
      if (interrupted.length > 0) messageCache.set(sessionId, interrupted)
      if (viewing) {
        set({
          error: '응답 중 오류가 발생했습니다.',
          isStreaming: false,
          abortController: null,
          messages: interrupted,
        })
      }
      return
    }

    const viewing = get().sessionId === sessionId
    const liveMsgs = viewing
      ? get().messages
      : (streamRegistry.get(sessionId) ?? [])
    streamRegistry.delete(sessionId)

    // 다른 대화를 보는 사이 끝났는데 메시지 사본이 없으면 결과를 판단할 수 없다.
    // 빈 응답으로 오판해 세션을 지우지 않도록, 목록만 갱신하고 끝낸다(다시 열면 서버에서 불러온다).
    if (!viewing && liveMsgs.length === 0) {
      logError(
        'executeStream.noSnapshot',
        '백그라운드 스트림 종료 시 메시지 사본 없음',
        { sessionId },
      )
      clearInflight(sessionId)
      messageCache.delete(sessionId)
      invalidateSessionLists()
      return
    }

    const finalMsg = liveMsgs.find((m) => m.id === assistantId)
    const hasContent =
      finalMsg?.type === 'text' && finalMsg.content.trim().length > 0
    if (!hasContent) {
      logError(
        'executeStream.emptyResponse',
        'AI 응답에 내용이 없음(빈 응답 — 백엔드 LLM 생성 실패/스킵)',
        { sessionId, isFirstMessage, viewing },
      )
      clearInflight(sessionId)

      if (isFirstMessage) {
        clearCache(sessionId)
        messageCache.delete(sessionId)
        streamRegistry.delete(sessionId)
        deleteSession(sessionId)
          .then(invalidateSessionLists)
          .catch((e) => logError('deleteSession', e))
        if (viewing)
          set({
            error: '응답을 받지 못했습니다. 잠시 후 다시 시도해주세요.',
            isStreaming: false,
            abortController: null,
            isDeleted: true,
          })
        return
      }

      const interrupted = liveMsgs.map((m) =>
        m.id === assistantId && m.type === 'text'
          ? { ...m, status: 'interrupted' as const }
          : m,
      )
      streamRegistry.delete(sessionId)
      messageCache.set(sessionId, interrupted)
      if (viewing) {
        set({
          error: '응답을 받지 못했습니다. 잠시 후 다시 시도해주세요.',
          isStreaming: false,
          abortController: null,
          messages: interrupted,
        })
      }
      return
    }
    clearInflight(sessionId)
    const doneMsgs = liveMsgs.map((m) =>
      m.id === assistantId ? { ...m, status: 'done' as const } : m,
    )
    streamRegistry.delete(sessionId)
    messageCache.set(sessionId, doneMsgs)
    invalidateSessionLists()
    if (get().sessionId === sessionId) {
      set({ isStreaming: false, abortController: null, messages: doneMsgs })
    }
  }

  const executeRegenerate = async (
    sessionId: string,
    assistantId: string,
    serverId: string,
    signal: AbortSignal,
    domain?: string,
  ): Promise<void> => {
    const writer = createWriter(sessionId, assistantId)

    const markInterrupted = (errorMsg?: string) => {
      streamRegistry.delete(sessionId)
      if (get().sessionId !== sessionId) return
      set((state) => ({
        ...(errorMsg ? { error: errorMsg } : {}),
        isStreaming: false,
        abortController: null,
        messages: state.messages.map((m) =>
          m.id === assistantId && m.type === 'text'
            ? { ...m, status: 'interrupted' as const }
            : m,
        ),
      }))
      messageCache.set(sessionId, get().messages)
    }

    try {
      await regenerateMessageStream(
        sessionId,
        serverId,
        writer.push,
        signal,
        writer.setSources,
        writer.setStatus,
        writer.setAttachments,
        writer.setNotice,
        writer.setThought,
        domain,
      )
      writer.flushNow()
    } catch (e) {
      logError('executeRegenerate', e)
      writer.flushNow()
      if (signal.aborted) {
        markInterrupted()
        return
      }
      markInterrupted(
        isAbortError(e)
          ? undefined
          : (e as Error)?.message || '재생성 중 오류가 발생했습니다.',
      )
      return
    }

    const liveMsgs =
      get().sessionId === sessionId
        ? get().messages
        : (streamRegistry.get(sessionId) ?? [])
    if (liveMsgs.length === 0) {
      // 다른 대화를 보는 사이 끝났는데 사본이 없다: 다음에 열 때 서버에서 불러오게 한다.
      streamRegistry.delete(sessionId)
      messageCache.delete(sessionId)
      invalidateSessionLists()
      return
    }
    const finalMsg = liveMsgs.find((m) => m.id === assistantId)
    const hasContent =
      finalMsg?.type === 'text' && finalMsg.content.trim().length > 0
    if (!hasContent) {
      logError(
        'executeRegenerate.emptyResponse',
        'AI 재생성 응답에 내용이 없음(빈 응답)',
        { sessionId },
      )
      markInterrupted('응답을 받지 못했습니다. 잠시 후 다시 시도해주세요.')
      return
    }

    if (get().sessionId !== sessionId) {
      const done = liveMsgs.map((m) =>
        m.id === assistantId ? { ...m, status: 'done' as const } : m,
      )
      // 레지스트리에 남겨 두면 다시 열 때 connect가 '스트리밍 중'으로 복원해 입력이 막힌다.
      streamRegistry.delete(sessionId)
      messageCache.set(sessionId, done)
      invalidateSessionLists()
      return
    }

    streamRegistry.delete(sessionId)

    if (get().sessionId !== sessionId) return
    set((state) => ({
      isStreaming: false,
      abortController: null,
      messages: state.messages.map((m) =>
        m.id === assistantId ? { ...m, status: 'done' as const } : m,
      ),
    }))
    messageCache.set(sessionId, get().messages)
    invalidateSessionLists()
  }

  return { executeStream, executeRegenerate }
}
