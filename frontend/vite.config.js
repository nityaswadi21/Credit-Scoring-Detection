import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/predict':   'http://localhost:8001',
      '/recommend': 'http://localhost:8001',
      '/portfolio': 'http://localhost:8001',
    }
  }
})
