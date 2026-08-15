import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import compression from 'vite-plugin-compression2'
import path from 'path'
import fs from 'node:fs'

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
  // Hashes de los scripts inline por página, generados en el build por
  // scripts/csp-hashes.mjs. Sin ellos habría que volver a 'unsafe-inline', que
  // es exactamente lo que anula la protección de la CSP frente a un XSS.
  let hashesPorRuta = {}
  try {
    hashesPorRuta = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'dist/csp-hashes.json'), 'utf8'))
  } catch {
    console.warn(
      '[csp] No se encontró dist/csp-hashes.json. Se sirve la CSP sin hashes: ' +
        'los scripts inline quedarán BLOQUEADOS. Corre `npm run build` completo.'
    )
  }

  const csp = (hashes) =>
    [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      // Sin 'unsafe-inline': cada script inline entra por su hash. Los navegadores
      // ignoran 'unsafe-inline' en cuanto hay un hash presente, así que dejarlo
      // sería, además de inseguro, engañoso.
      `script-src 'self' ${hashes.join(' ')} https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://connect.facebook.net`.replace(
        /\s+/g,
        ' '
      ),
      // style-src conserva 'unsafe-inline' a propósito: GSAP y framer-motion
      // animan escribiendo `style` en los elementos, y sin esto el sitio se ve
      // roto. El riesgo de una inyección de CSS es muy inferior al de una de JS.
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      // media-src: videos servidos por el backend / bucket (otro origen).
      "media-src 'self' data: https:",
      "connect-src 'self' https://*.up.railway.app https://api.emailjs.com https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://t3.storageapi.dev https://www.facebook.com https://connect.facebook.net",
      "frame-src https://www.googletagmanager.com https://www.facebook.com",
      "frame-ancestors 'none'",
    ].join('; ')

  // Las rutas que no son páginas pre-renderizadas (flujo de pedido, portal,
  // admin) las sirve el fallback SPA con dist/index.html, así que heredan sus
  // hashes.
  const hashesDe = (url) => {
    const ruta = (url || '/').split('?')[0].replace(/\/+$/, '') || '/'
    return hashesPorRuta[ruta] || hashesPorRuta['/'] || []
  }

  return {
    name: 'security-headers',
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        res.setHeader('X-Frame-Options', 'DENY')
        res.setHeader('X-Content-Type-Options', 'nosniff')
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
        res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
        // HSTS: obliga al navegador a usar HTTPS en visitas posteriores (evita
        // el downgrade a HTTP y el SSL stripping). SIN `preload` a propósito: el
        // preload queda cacheado en los navegadores hasta un año y es muy difícil
        // de revertir. Se puede añadir más adelante si el dominio ya es 100% HTTPS.
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
        // CSP en modo BLOQUEANTE, con los hashes de los scripts inline de ESTA
        // página (no la unión de todas: mantiene la cabecera corta).
        res.setHeader('Content-Security-Policy', csp(hashesDe(req.url)))
        next()
      })
    },
  }
}

// Config como función para distinguir el build de cliente del de servidor (SSR)
// que hace vite-react-ssg: en el build SSR react/react-dom/etc. son externos y no
// pueden ir en `manualChunks`, así que ese chunking solo se aplica al cliente.
// Descubre los artículos del blog (.md) para pre-renderizarlos automáticamente:
// agregar un nuevo .md basta para que su página se genere en el build.
const blogSlugs = fs
  .readdirSync(path.resolve(__dirname, 'src/content/blog'))
  .filter((f) => f.endsWith('.md'))
  .map((f) => f.replace(/\.md$/, ''))

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
      '/blog',
      ...blogSlugs.map((s) => `/blog/${s}`),
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
              'ui-vendor': ['lenis'],
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
