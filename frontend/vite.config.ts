import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Same-origin requests in dev: avoids CORS and keeps VITE_API_URL optional.
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
