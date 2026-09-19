import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/extract': 'http://localhost:8000',
      '/obligations': 'http://localhost:8000',
      '/timeline': 'http://localhost:8000',
      '/flags': 'http://localhost:8000',
      '/compare': 'http://localhost:8000',
      '/qa': 'http://localhost:8000',
      '/summary': 'http://localhost:8000',
      '/alerts': 'http://localhost:8000',
      '/upload': 'http://localhost:8000',
      '/contracts': 'http://localhost:8000',
      '/auth': 'http://localhost:8000',
      '/debug': 'http://localhost:8000',
      '/health': 'http://localhost:8000',
      '/config': 'http://localhost:8000',
    },
  },
})
