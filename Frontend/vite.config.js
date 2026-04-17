import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), 
  ],
  server: {
    // Proxy API requests in development to avoid CORS issues
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  },
  // Ensure environment variables are properly loaded
  define: {
    __API_URL__: JSON.stringify(process.env.VITE_API_URL || 'http://localhost:5000'),
    __SOCKET_URL__: JSON.stringify(process.env.VITE_SOCKET_URL || 'http://localhost:5000'),
  }
})