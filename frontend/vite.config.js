import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/predict':    'http://localhost:8002',
      '/recommend':  'http://localhost:8002',
      '/trajectory': 'http://localhost:8002',
      '/score':      'http://localhost:8002',
      '/optimize':   'http://localhost:8002',
      // Use trailing slash so /portfolio (the React page) is NOT proxied,
      // but /portfolio/holdings, /portfolio/status, etc. are.
      '/portfolio/': 'http://localhost:8002',
    }
  }
})
