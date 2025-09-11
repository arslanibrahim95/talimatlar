import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  },
  css: {
    postcss: './postcss.config.js',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api/auth': {
        target: 'http://localhost:8004',
        changeOrigin: true,
      },
      '/api/documents': {
        target: 'http://localhost:8002',
        changeOrigin: true,
      },
      '/api/analytics': {
        target: 'http://localhost:8003',
        changeOrigin: true,
      },
      '/api/instructions': {
        target: 'http://localhost:8005',
        changeOrigin: true,
      },
      '/api/ai': {
        target: 'http://localhost:8006',
        changeOrigin: true,
      },
      '/api/notifications': {
        target: 'http://localhost:8004',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // Production'da sourcemap kapalı
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
          charts: ['recharts', 'chart.js'],
          utils: ['date-fns', 'clsx', 'tailwind-merge'],
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 1000,
  },
})
