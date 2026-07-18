import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import compression from 'vite-plugin-compression2'
import path from 'path'

// Redirige www.<dominio> → <dominio> (301) en el servidor de `vite preview`
// (producción en Railway), para tener una sola URL canónica.
function wwwRedirect() {
  return {
    name: 'www-redirect',
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        const host = req.headers.host || ''
        if (host.startsWith('www.')) {
          res.writeHead(301, { Location: `https://${host.slice(4)}${req.url}` })
          res.end()
          return
        }
        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [
    wwwRedirect(),
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
  // El punto inicial permite el dominio y todos sus subdominios (ej. www).
  // Se puede sobrescribir con PREVIEW_ALLOWED_HOSTS (separado por comas) en las
  // variables del servicio.
  preview: {
    host: true,
    allowedHosts: (
      process.env.PREVIEW_ALLOWED_HOSTS || '.saboresdemama.com,.up.railway.app'
    ).split(','),
  },
})
