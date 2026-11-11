import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import '@/shared/styles/global.css'
import '@/shared/styles/intro.css'
import 'streamdown/styles.css'
import App from '@/app/App'
import { queryClient } from '@/lib/queryClient'
import { tryReloadOnce } from '@/shared/utils/chunkReload'

window.addEventListener('vite:preloadError', (e) => {
  e.preventDefault()
  tryReloadOnce()
})

// mock 모드(`npm run dev:mock`)에서는 첫 요청 전에 가짜 백엔드를 설치한다. 일반 빌드에서는 이 import가 빠진다.
const prepare =
  import.meta.env.MODE === 'mock'
    ? import('@/mock/index').then(({ installMock }) => installMock())
    : Promise.resolve()

prepare.then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </StrictMode>,
  )
})
