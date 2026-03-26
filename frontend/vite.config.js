import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/predict':    'http://localhost:8001',
      '/recommend':  'http://localhost:8001',
      '/trajectory': 'http://localhost:8001',
      '/score':      'http://localhost:8001',
      '/optimize':   'http://localhost:8001',
      // Use trailing slash so /portfolio (the React page) is NOT proxied,
      // but /portfolio/holdings, /portfolio/status, etc. are.
      '/portfolio/': 'http://localhost:8001',
    }
  }
})
