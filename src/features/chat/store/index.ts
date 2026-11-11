// 채팅 화면의 상태와 동작. 스트림 실행은 ./stream, 실행 중 상태는 ./runtime, 저장은 ../storage, 응답 해석은 ../utils에 있다.
import { create } from 'zustand'
import { type Message } from '../types'
import { getMessages, deleteMessage as deleteMessageApi } from '../api'
import { deleteSession } from '@/features/sessions/api'
import { logError } from '@/shared/utils/logError'
import { uuid } from '@/shared/utils/uuid'
import {
  invalidateSessionLists,
  streamRegistry,
  streamControllers,
  releaseController,
} from './runtime'
import { type DomainSelection, type ChatStore } from './types'
import { isAbortError, mapServerMessages } from '../utils'
import {
  messageCache,
  saveCache,
  saveCacheOnUnload,
  loadCache,
  clearCache,
  saveInflight,
  clearInflight,
  getInflight,
} from '../storage'
import { createStreamRunners } from './stream'

export const useChatStore = create<ChatStore>((set, get) => {
  let connectAbortController = new AbortController()

  const { executeStream, executeRegenerate } = createStreamRunners(set, get)

  // 방금 추가한 답변 자리를 실행 중 스트림으로 등록하고 끝까지 받는다 (sendMessage·retryLastMessage 공통)
  const runStream = async (
    sessionId: string,
    assistantId: string,
    question: string,
    isFirstMessage: boolean,
    controller: AbortController,
    domainCode?: string,
  ) => {
    streamRegistry.set(sessionId, get().messages)
    streamControllers.set(sessionId, controller)
    saveCache(sessionId, get().messages)
    try {
      await executeStream(
        sessionId,
        assistantId,
        question,
        isFirstMessage,
        controller.signal,
        domainCode,
      )
    } finally {
      releaseController(sessionId, controller)
    }
  }

  return {
    sessionId: '',
    messages: [],
    isStreaming: false,
    isConnecting: false,
    statusText: null,
    statusSteps: [],
    error: null,
    isDeleted: false,
    abortController: null,
    nextCursor: null,
    hasMore: false,
    isLoadingMore: false,

    clearError: () => set({ error: null }),
    resetDeleted: () => set({ isDeleted: false }),

    abortStream: () => {
      set({ statusText: null, statusSteps: [] })
      get().abortController?.abort()
      set((state) => ({
        abortController: null,
        isStreaming: false,
        messages: state.messages.map((m) =>
          m.type === 'text' &&
          m.role === 'assistant' &&
          m.status === 'streaming'
            ? { ...m, status: 'interrupted' as const }
            : m,
        ),
      }))
      const sid = get().sessionId
      if (sid) messageCache.set(sid, get().messages)
    },

    connect: async (sessionId: string) => {
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
    },

    disconnect: () => {
      set({
        sessionId: '',
        messages: [],
        isStreaming: false,
        isConnecting: false,
        statusText: null,
        statusSteps: [],
        abortController: null,
        isDeleted: false,
        nextCursor: null,
        hasMore: false,
        isLoadingMore: false,
      })
    },

    loadMoreMessages: async () => {
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
    },

    sendMessage: async (
      content: string,
      domain?: DomainSelection,
      forceNotFirst = false,
    ) => {
      if (get().isStreaming) return
      const controller = new AbortController()
      const assistantId = uuid()
      const { sessionId, messages: existingMessages } = get()
      const isFirstMessage = existingMessages.length === 0 && !forceNotFirst

      saveInflight(sessionId, content, domain)
      const now = new Date().toISOString()
      set((state) => ({
        isStreaming: true,
        statusText: null,
        statusSteps: [],
        error: null,
        abortController: controller,
        messages: [
          ...state.messages,
          {
            id: uuid(),
            role: 'user',
            type: 'text',
            content,
            createdAt: now,
            domainCode: domain?.code,
            domainLabel: domain?.label,
          },
          {
            id: assistantId,
            role: 'assistant',
            type: 'text',
            content: '',
            status: 'streaming' as const,
            createdAt: now,
          },
        ],
      }))
      await runStream(
        sessionId,
        assistantId,
        content,
        isFirstMessage,
        controller,
        domain?.code,
      )
    },

    retryLastMessage: async () => {
      if (get().isStreaming) return
      const { messages, sessionId } = get()
      const last = messages[messages.length - 1]
      if (!last || last.role !== 'user' || last.type !== 'text') return
      const isFirstMessage = messages.length === 1
      const domainCode = last.domainCode
      const domain =
        last.domainCode && last.domainLabel
          ? { code: last.domainCode, label: last.domainLabel }
          : undefined

      saveInflight(sessionId, last.content, domain)
      const controller = new AbortController()
      const assistantId = uuid()
      const now = new Date().toISOString()
      set((state) => ({
        isStreaming: true,
        statusText: null,
        statusSteps: [],
        error: null,
        abortController: controller,
        messages: [
          ...state.messages,
          {
            id: assistantId,
            role: 'assistant',
            type: 'text',
            content: '',
            status: 'streaming' as const,
            createdAt: now,
          },
        ],
      }))
      await runStream(
        sessionId,
        assistantId,
        last.content,
        isFirstMessage,
        controller,
        domainCode,
      )
    },

    sendImageMessage: (filename: string, caption?: string) => {
      set((state) => ({
        messages: [
          ...state.messages,
          {
            id: uuid(),
            role: 'user' as const,
            type: 'image' as const,
            filename,
            caption,
          },
        ],
      }))
    },

    regenerateMessage: async (assistantId: string) => {
      if (get().isStreaming) return
      const { messages, sessionId } = get()
      const idx = messages.findIndex((m) => m.id === assistantId)
      if (idx === -1) return
      const target = messages[idx]
      if (target.role !== 'assistant' || target.type !== 'text') return

      let prevUserId: string | null = null
      let question: string | null = null
      let prevDomain: DomainSelection | undefined
      for (let i = idx - 1; i >= 0; i--) {
        const m = messages[i]
        if (m.role === 'user' && m.type === 'text') {
          prevUserId = m.id
          question = m.content
          if (m.domainCode && m.domainLabel)
            prevDomain = { code: m.domainCode, label: m.domainLabel }
          break
        }
      }
      if (question == null || prevUserId == null) {
        logError(
          'regenerateMessage.noQuestion',
          '클릭한 답변 위에서 사용자 질문을 못 찾음(대화 구조 이상)',
          { assistantId, idx },
        )
        set({ error: '재생성할 원본 질문을 찾을 수 없습니다.' })
        return
      }

      const qNorm = question.trim()

      const prevUserIdx = messages.findIndex((m) => m.id === prevUserId)
      let occurrence = 0
      for (let i = 0; i < prevUserIdx; i++) {
        const m = messages[i]
        if (
          m.role === 'user' &&
          m.type === 'text' &&
          m.content.trim() === qNorm
        )
          occurrence++
      }

      let serverId: string | undefined
      let serverQuestionId: string | undefined
      const serverEmptyAnswerIds: string[] = []
      try {
        const res = await getMessages(sessionId)
        const server = res.data.data.items
        let seen = 0
        for (let i = 0; i < server.length; i++) {
          if (
            server[i].role === 'human' &&
            (server[i].content ?? '').trim() === qNorm
          ) {
            if (seen === occurrence) {
              serverQuestionId = server[i].message_id
              const next = server[i + 1]
              if (next && next.role !== 'human') {
                if ((next.content ?? '').trim().length > 0)
                  serverId = next.message_id
                else if (next.message_id)
                  serverEmptyAnswerIds.push(next.message_id)
              }
              break
            }
            seen++
          }
        }
      } catch (e) {
        logError('regenerate.getMessages', e)
      }

      if (get().sessionId !== sessionId || get().isStreaming) return

      if (!serverId) {
        const toDelete = [
          ...serverEmptyAnswerIds,
          ...(serverQuestionId ? [serverQuestionId] : []),
        ]
        if (toDelete.length > 0) {
          await Promise.allSettled(
            toDelete.map((id) => deleteMessageApi(sessionId, id)),
          )
        }
        const removeIds = new Set<string>([prevUserId, assistantId])
        const cur = get().messages
        const prevIdx = cur.findIndex((m) => m.id === prevUserId)
        if (prevIdx !== -1) {
          for (let i = prevIdx; i < cur.length; i++) {
            const m = cur[i]
            const sameQuestion =
              m.role === 'user' &&
              m.type === 'text' &&
              m.content.trim() === qNorm
            const emptyAnswer =
              m.role === 'assistant' &&
              m.type === 'text' &&
              m.content.trim() === ''
            if (sameQuestion || emptyAnswer) removeIds.add(m.id)
          }
        }
        const remaining = get().messages.filter((m) => !removeIds.has(m.id))
        set({ messages: remaining })
        messageCache.set(sessionId, remaining)
        if (get().sessionId !== sessionId || get().isStreaming) return
        await get().sendMessage(question, prevDomain, true)
        return
      }

      const controller = new AbortController()
      set((state) => ({
        isStreaming: true,
        statusText: null,
        statusSteps: [],
        abortController: controller,
        error: null,
        messages: state.messages.map((m) =>
          m.id === assistantId && m.type === 'text'
            ? {
                ...m,
                content: '',
                sources: undefined,
                notice: undefined,
                status: 'streaming' as const,
              }
            : m,
        ),
      }))
      streamRegistry.set(sessionId, get().messages)
      streamControllers.set(sessionId, controller)

      try {
        // 원래 질문에 지정했던 분야로 다시 답하게 한다.
        await executeRegenerate(
          sessionId,
          assistantId,
          serverId,
          controller.signal,
          prevDomain?.code,
        )
      } finally {
        releaseController(sessionId, controller)
      }
    },
  }
})

saveCacheOnUnload(useChatStore.getState)
