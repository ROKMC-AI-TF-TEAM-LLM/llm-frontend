import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import './ui/styles/global.css'
import 'streamdown/styles.css'
import App from './App.tsx'
import { queryClient } from './api/queryClient'
import { tryReloadOnce } from './utils/chunkReload'

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