import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    // 영역을 넘는 import는 '@/...' (tsconfig.app.json의 paths와 같게)
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
})