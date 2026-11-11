// 지난 메시지 불러오기: 대화 열기(connect)와 이전 메시지 더 받기(loadMoreMessages).
// 서버에서 받은 메시지를 스토어에 싣고, 끊긴 답변을 복구한다(전송 중이던 질문 다시 보내기, 중단 표시, 빈 대화 정리).
// 스토어의 set/get을 받아 쓴다. 스트림 실행은 ./stream에 있다.
//
// 지난 메시지는 서버 데이터지만 React Query가 아니라 스토어에 싣는다. 스트리밍 중인 답변·다시 생성·복구가
// 같은 messages 배열을 고치기 때문이다. 캐시로 옮기려면 이 복구 흐름의 테스트가 먼저 필요하다(ARCHITECTURE.md).
import type { StoreApi } from 'zustand'
import { type Message } from '../types'
import { getMessages } from '../api'
import { deleteSession } from '@/features/sessions/api'
import { logError } from '@/shared/utils/logError'
import { uuid } from '@/shared/utils/uuid'
import { isAbortError, mapServerMessages } from '../utils'
import {
  messageCache,
  loadCache,
  clearCache,
  clearInflight,
  getInflight,
} from '../storage'
import {
  invalidateSessionLists,
  streamRegistry,
  streamControllers,
} from './runtime'
import type { ChatStore } from './types'

export const createHistoryLoaders = (
  set: StoreApi<ChatStore>['setState'],
  get: StoreApi<ChatStore>['getState'],
) => {
  // 대화를 바꾸면 이전 대화의 불러오기 요청을 끊는다
  let connectAbortController = new AbortController()

  const connect = async (sessionId: string) => {
    connectAbortController.abort()
    connectAbortController = new AbortController()
    const { signal } = connectAbortController

    set({
      nextCursor: null,
      hasMore: false,
      isLoadingMore: false,
      isDeleted: false,
    })

    const streaming = streamRegistry.get(sessionId)
    if (streaming) {
      set({
        sessionId,
        messages: streaming,
        isStreaming: true,
        isConnecting: false,
        abortController: streamControllers.get(sessionId) ?? null,
      })
      return
    }
    set({
      sessionId,
      messages: [],
      isStreaming: false,
      isConnecting: true,
      error: null,
      abortController: null,
    })

    let res
    try {
      res = await getMessages(sessionId, undefined, { signal })
    } catch (e) {
      if (isAbortError(e)) return
      set({ isConnecting: false })
      logError('connect.getMessages', e)
      const cached = loadCache(sessionId)
      const pending = getInflight(sessionId)
      if (cached.length > 0) {
        set({ messages: cached })
        const lastCached = cached[cached.length - 1]
        if (
          lastCached?.role === 'user' &&
          lastCached?.type === 'text' &&
          pending
        ) {
          clearInflight(sessionId)
          get().retryLastMessage()
        }
        return
      }
      if (pending) {
        set((state) => ({
          messages: [
            ...state.messages,
            {
              id: uuid(),
              role: 'user' as const,
              type: 'text' as const,
              content: pending.question,
              createdAt: new Date().toISOString(),
              domainCode: pending.domain?.code,
              domainLabel: pending.domain?.label,
            },
          ],
        }))
        get().retryLastMessage()
        return
      }
      throw e
    }

    if (get().sessionId !== sessionId || get().isStreaming) return
    const page = res.data.data
    const dbMessages = mapServerMessages(page.items)
    set({ nextCursor: page.next_cursor, hasMore: page.has_next })

    const memCached = messageCache.get(sessionId) ?? []
    const cached = memCached.length > 0 ? memCached : loadCache(sessionId)
    const cachedByContent = new Map<
      string,
      { domainCode?: string; domainLabel?: string }
    >()
    for (const c of cached) {
      if (c.role === 'user' && c.type === 'text' && c.domainLabel) {
        cachedByContent.set(c.content, {
          domainCode: c.domainCode,
          domainLabel: c.domainLabel,
        })
      }
    }
    const base =
      cachedByContent.size === 0
        ? dbMessages
        : dbMessages.map((m) => {
            if (m.role === 'user' && m.type === 'text' && !m.domainLabel) {
              const hit = cachedByContent.get(m.content)
              if (hit)
                return {
                  ...m,
                  domainCode: hit.domainCode,
                  domainLabel: hit.domainLabel,
                }
            }
            return m
          })

    const pending = getInflight(sessionId)

    set({ messages: base, isConnecting: false })
    messageCache.set(sessionId, base)

    const last = base[base.length - 1]

    if (last && last.role === 'user' && last.type === 'text') {
      if (pending) {
        get().retryLastMessage()
        return
      }
      try {
        const recheck = await getMessages(sessionId, undefined, { signal })
        if (get().sessionId !== sessionId) return
        const items = recheck.data.data.items
        const serverLast = items[items.length - 1]
        if (serverLast && serverLast.role !== 'human') {
          const remapped = mapServerMessages(items)
          set({ messages: remapped, error: null })
          messageCache.set(sessionId, remapped)
          return
        }
      } catch (e) {
        if (isAbortError(e)) return
        logError('connect.recheckLast', e)
      }

      if (get().sessionId !== sessionId) return
      const interrupted: Message = {
        id: uuid(),
        role: 'assistant',
        type: 'text',
        content: '',
        status: 'interrupted',
        createdAt: last.createdAt,
      }
      set((state) => ({ messages: [...state.messages, interrupted] }))
      messageCache.set(sessionId, get().messages)
      return
    }

    if (base.length === 0 && pending) {
      set((state) => ({
        messages: [
          ...state.messages,
          {
            id: uuid(),
            role: 'user' as const,
            type: 'text' as const,
            content: pending.question,
            createdAt: new Date().toISOString(),
            domainCode: pending.domain?.code,
            domainLabel: pending.domain?.label,
          },
        ],
      }))
      get().retryLastMessage()
      return
    }

    if (base.length === 0 && !pending && loadCache(sessionId).length === 0) {
      let stillEmpty: boolean
      try {
        const confirm = await getMessages(sessionId, undefined, { signal })
        stillEmpty = confirm.data.data.items.length === 0
      } catch (e) {
        logError('connect.confirmEmpty', e)
        stillEmpty = false
      }
      if (get().sessionId !== sessionId) return
      if (stillEmpty) {
        clearCache(sessionId)
        deleteSession(sessionId)
          .then(invalidateSessionLists)
          .catch((e) => logError('deleteSession', e))
        set({ isDeleted: true })
      }
      return
    }

    if (pending) clearInflight(sessionId)
  }

  const loadMoreMessages = async () => {
    const { sessionId, hasMore, isLoadingMore, nextCursor, messages } = get()
    if (!hasMore || isLoadingMore || !nextCursor || !sessionId) return

    set({ isLoadingMore: true })
    try {
      const res = await getMessages(sessionId, { cursor: nextCursor })
      if (get().sessionId !== sessionId) return

      const page = res.data.data
      const older = mapServerMessages(page.items)
      const existingIds = new Set(messages.map((m) => m.id))
      const prepend = older.filter((m) => !existingIds.has(m.id))
      const merged = [...prepend, ...get().messages]

      set({
        messages: merged,
        nextCursor: page.next_cursor,
        hasMore: page.has_next,
      })
      messageCache.set(sessionId, merged)
    } catch (e) {
      logError('loadMoreMessages', e)
    } finally {
      if (get().sessionId === sessionId) set({ isLoadingMore: false })
    }
  }

  return { connect, loadMoreMessages }
}
