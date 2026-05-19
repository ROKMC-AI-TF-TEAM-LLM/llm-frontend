import { backendApi } from '../lib/axios'
import type {
    messagesRequest, messagesResponse,
    sessionsRequest, sessionsResponse,
    //streamRequest, streamResponse
    } from '../../types/chat'

export const messages = (data: messagesRequest) =>
  backendApi.post<messagesResponse>('/chat/messages', data)

export const sessions = (data: sessionsRequest) =>
  backendApi.get<sessionsResponse>('/chat/sessions', data)

// export const Stream = (onMessage: (data: string) => void) => {
//   const ws = new WebSocket('ws://localhost:8000/chat/stream')
  
//   ws.onmessage = (event) => {
//     onMessage(event.data)
//   }
  
//   return ws
// }