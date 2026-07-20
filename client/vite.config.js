import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/register': 'http://localhost:3000',
      '/login': 'http://localhost:3000',
      '/tasks': 'http://localhost:3000',
      '/subtasks': 'http://localhost:3000',
      '/stats': 'http://localhost:3000',
    },
  },
  build: {
    outDir: '../public_dist',
    emptyOutDir: true,
  },
})
