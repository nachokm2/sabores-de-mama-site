import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import compression from 'vite-plugin-compression2'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    compression({ algorithm: 'gzip', exclude: [/\.(png|jpg|jpeg|gif|svg|webp|avif)$/] }),
    compression({ algorithm: 'brotliCompress', exclude: [/\.(png|jpg|jpeg|gif|svg|webp|avif)$/] }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@sections': path.resolve(__dirname, './src/components/sections'),
      '@ui': path.resolve(__dirname, './src/components/ui'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@data': path.resolve(__dirname, './src/data'),
      '@assets': path.resolve(__dirname, './src/assets'),
    },
  },
  build: {
    target: 'es2020',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'animation-vendor': ['gsap', 'framer-motion'],
          'ui-vendor': ['swiper', 'lenis'],
        },
      },
    },
    cssCodeSplit: true,
    chunkSizeWarningLimit: 600,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'gsap', 'framer-motion'],
  },
  server: {
    port: 5173,
    open: true,
  },
  // `vite preview` (usado en producción en Railway) bloquea hosts desconocidos.
  // Permitimos los dominios de Railway; para un dominio propio agrega su valor a
  // PREVIEW_ALLOWED_HOSTS (separado por comas) en las variables del servicio.
  preview: {
    host: true,
    allowedHosts: (process.env.PREVIEW_ALLOWED_HOSTS || '.up.railway.app').split(','),
  },
})
