import { create } from 'zustand'

export interface ToastItem {
  id: number
  message: string
  type?: 'error' | 'success'
}

let nextId = 1

interface ToastState {
  toasts: ToastItem[]
  show: (message: string, type?: ToastItem['type']) => void
  dismiss: (id: number) => void
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  show: (message, type = 'error') =>
    set((s) => ({ toasts: [...s.toasts, { id: nextId++, message, type }] })),
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

export const showToast = (message: string, type: ToastItem['type'] = 'error') =>
  useToastStore.getState().show(message, type)
