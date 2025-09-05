import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': '"development"' // Force development mode for React
  },
  build: {
    minify: false, // Disable minification to see actual error messages
    sourcemap: true, // Enable source maps for debugging
  },
})
