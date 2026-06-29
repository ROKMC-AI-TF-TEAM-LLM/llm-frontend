import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import './ui/styles/global.css'
import 'streamdown/styles.css'
import App from './App.tsx'
import { queryClient } from './api/queryClient'
import { tryReloadOnce } from './utils/chunkReload'

// 코드 스플리팅 청크 로드 실패(새 배포/HMR로 stale)는 새로고침으로 복구되므로 자동 새로고침.
window.addEventListener('vite:preloadError', (e) => {
  e.preventDefault()
  tryReloadOnce()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)