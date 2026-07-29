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

// Cabeceras de seguridad para el servidor de `vite preview` (producción Railway).
// Las cabeceras "seguras" (anti-clickjacking, nosniff, referrer, permissions) van
// aplicadas. La CSP va en modo REPORT-ONLY: no bloquea nada, solo reporta
// violaciones en la consola del navegador. Tras verificar que no hay falsos
// positivos, se cambia la cabecera a 'Content-Security-Policy' para hacerla efectiva.
function securityHeaders() {
  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    // media-src: videos servidos por el backend / bucket (otro origen).
    "media-src 'self' data: https:",
    "connect-src 'self' https://*.up.railway.app https://api.emailjs.com https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://t3.storageapi.dev",
    "frame-src https://www.googletagmanager.com",
    "frame-ancestors 'none'",
  ].join('; ')
  return {
    name: 'security-headers',
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        res.setHeader('X-Frame-Options', 'DENY')
        res.setHeader('X-Content-Type-Options', 'nosniff')
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
        res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
        // CSP en modo BLOQUEANTE (verificado sin violaciones en Report-Only).
        res.setHeader('Content-Security-Policy', csp)
        next()
      })
    },
  }
}

// Config como función para distinguir el build de cliente del de servidor (SSR)
// que hace vite-react-ssg: en el build SSR react/react-dom/etc. son externos y no
// pueden ir en `manualChunks`, así que ese chunking solo se aplica al cliente.
export default defineConfig(({ isSsrBuild }) => ({
  plugins: [
    wwwRedirect(),
    securityHeaders(),
    react(),
    compression({ algorithm: 'gzip', exclude: [/\.(png|jpg|jpeg|gif|svg|webp|avif)$/] }),
    compression({ algorithm: 'brotliCompress', exclude: [/\.(png|jpg|jpeg|gif|svg|webp|avif)$/] }),
  ],
  // Pre-render (SSG) con vite-react-ssg: solo generamos HTML estático de las
  // páginas públicas de marketing (las que deben indexar Google y los buscadores
  // de IA). El resto (flujos de pedido, portal de clientes, admin, rutas con
  // parámetros) se sirven como SPA (fallback a index.html) y se renderizan en el
  // navegador. Así los rastreadores reciben el contenido ya escrito en el HTML.
  ssgOptions: {
    script: 'async',
    // flat: `/nosotros` → `dist/nosotros.html`. `vite preview` (sirv) resuelve
    // `/nosotros` (sin barra final, que es nuestra URL canónica) a `nosotros.html`.
    dirStyle: 'flat',
    includedRoutes: () => [
      '/',
      '/nosotros',
      '/menu',
      '/meal-prep-en-casa',
      '/cocinera',
      '/healthy',
      '/galeria',
      '/contacto',
      '/almuerzos-a-domicilio-santiago',
      '/comida-para-empresas',
      '/preguntas-frecuentes',
      '/comida-a-domicilio/las-condes',
      '/comida-a-domicilio/providencia',
      '/comida-a-domicilio/nunoa',
      '/comida-a-domicilio/vitacura',
    ],
  },
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
      output: isSsrBuild
        ? {}
        : {
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
}))
