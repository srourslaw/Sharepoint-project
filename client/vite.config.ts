import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react({
    // Enable Fast Refresh
    fastRefresh: true,
    // Better error overlay
    babel: {
      plugins: [
        ['@babel/plugin-transform-react-jsx-development', { runtime: 'automatic' }]
      ]
    }
  })],

  // Development server configuration
  server: {
    port: 8081, // Use 8081 since 8080 is occupied
    host: true, // Allow external connections
    open: false, // Don't auto-open browser
    strictPort: false, // Allow port auto-increment

    // Proxy API requests to backend
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      },
      '/auth': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      }
    },

    // Enable HMR
    hmr: {
      overlay: true,
      port: 24678, // HMR WebSocket port
    },

    // Watch options for better file watching
    watch: {
      usePolling: false,
      interval: 100,
    }
  },

  // Define environment variables
  define: {
    'process.env.NODE_ENV': '"development"',
    // Add build timestamp for cache busting
    '__BUILD_TIME__': JSON.stringify(new Date().toISOString()),
  },

  // Build configuration
  build: {
    minify: false, // Disable minification for debugging
    sourcemap: true, // Enable source maps
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          mui: ['@mui/material', '@mui/icons-material'],
          msal: ['@azure/msal-browser', '@azure/msal-react']
        }
      }
    }
  },

  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@mui/material',
      '@mui/icons-material',
      '@azure/msal-browser',
      '@azure/msal-react'
    ],
    // Force re-optimization on dependency changes
    force: false
  },

  // Enable CSS preprocessing
  css: {
    devSourcemap: true,
    modules: {
      localsConvention: 'camelCase'
    }
  }
})
