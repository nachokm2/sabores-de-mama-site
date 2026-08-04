import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'

import { pool } from './models/index.js'
import { pedidosRateLimiter } from './middleware/rateLimiter.js'

import authRouter from './routes/auth.js'
import pedidosRouter from './routes/pedidos.js'
import platosRouter from './routes/platos.js'
import cuposRouter from './routes/cupos.js'
import comunasRouter from './routes/comunas.js'
import uploadsRouter from './routes/uploads.js'
import correosRouter from './routes/correos.js'
import productosHornearRouter from './routes/productosHornear.js'
import configRouter from './routes/config.js'
import encuestasRouter from './routes/encuestas.js'

dotenv.config()

const app = express()

// Detrás del proxy de Railway: necesario para que req.ip sea la IP real
// (lo usa el rate limiter).
app.set('trust proxy', 1)

// ── Cabeceras de seguridad (helmet) ──
// Esta app es una API JSON + proxy de imágenes (no sirve HTML), así que:
//  - contentSecurityPolicy:false → la CSP relevante se aplica en el frontend.
//  - crossOriginResourcePolicy:'cross-origin' → permite que el sitio (otro
//    origen) embeba las imágenes que devuelve /api/uploads/file (si no, el
//    navegador las bloquearía).
app.disable('x-powered-by')
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
)

// ── Log de acceso HTTP ──
// Sin esto no había NINGÚN registro de peticiones: era imposible detectar o
// investigar fuerza bruta, escaneos o enumeración de recursos.
//
// `ruta` descarta deliberadamente el query string: ahí viajan los tokens HMAC de
// /pedidos/:id/resumen y de las encuestas, y no deben quedar escritos en los logs.
// Se omite /api/health para no inundar el log con los chequeos de Railway.
morgan.token('ruta', (req) => req.originalUrl.split('?')[0])
morgan.token('cliente', (req) => req.ip || '-')
app.use(
  morgan(':cliente :method :ruta :status :res[content-length] :response-time ms', {
    skip: (req) => req.path === '/api/health',
  })
)

// ── CORS ──
// Orígenes permitidos = CORS_ORIGIN/CLIENT_URL (coma-separado) + los dominios
// propios del sitio, en lista EXPLÍCITA.
//
// Antes se aceptaba cualquier subdominio `*.up.railway.app`: como Railway asigna
// esos hostnames a cualquier usuario de la plataforma, un tercero podía desplegar
// una página y leer la API desde el navegador de la víctima. La allowlist ahora
// nombra el host de Railway del sitio en vez de usar un comodín.
const corsOriginEnv = process.env.CORS_ORIGIN || process.env.CLIENT_URL || ''
const envOrigins = corsOriginEnv.split(',').map((o) => o.trim()).filter(Boolean)
const allowAll = envOrigins.includes('*')
const DEFAULT_ORIGINS = [
  'https://saboresdemama.com',
  'https://www.saboresdemama.com',
  // Host de Railway del servicio del sitio (es el valor real de CORS_ORIGIN en
  // producción; se deja fijo para que la API siga funcionando aunque la variable
  // se borre por accidente).
  'https://sabores-de-mama-site-production.up.railway.app',
]
const allowedOrigins = [...new Set([...envOrigins.filter((o) => o !== '*'), ...DEFAULT_ORIGINS])]

function corsPermitido(origin) {
  if (!origin) return true // curl / health checks / same-origin
  return allowAll || allowedOrigins.includes(origin)
}

if (process.env.NODE_ENV === 'production' && allowAll) {
  console.warn('[cors] ADVERTENCIA: se permiten TODOS los orígenes (*) en producción.')
}
app.use(
  cors({
    // Denegar con callback(null, false) (sin cabecera CORS) en vez de lanzar
    // error, para no responder 500 a orígenes no permitidos.
    origin: (origin, callback) => callback(null, corsPermitido(origin)),
    credentials: true,
  })
)

app.use(express.json({ limit: '1mb' }))

// ── Health check (para Railway) ──
app.get('/api/health', async (req, res) => {
  let db = false
  try {
    await pool.query('SELECT 1')
    db = true
  } catch {
    db = false
  }
  res.json({
    status: 'ok',
    db,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  })
})

// ── Rutas ──
app.use('/api/auth', authRouter)
// El rate limiter (10 req/min por IP) aplica a TODAS las rutas de pedidos.
app.use('/api/pedidos', pedidosRateLimiter, pedidosRouter)
app.use('/api/platos', platosRouter)
app.use('/api/cupos', cuposRouter)
app.use('/api/comunas', comunasRouter)
app.use('/api/uploads', uploadsRouter)
app.use('/api/correos', correosRouter)
app.use('/api/productos-hornear', productosHornearRouter)
app.use('/api/config', configRouter)
app.use('/api/encuestas', encuestasRouter)

// ── 404 ──
app.use((req, res) => {
  res.status(404).json({ error: 'Recurso no encontrado.' })
})

// ── Manejador de errores central ──
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[error]', err)
  const status = err.status || 500
  res.status(status).json({
    error: status === 500 ? 'Error interno del servidor.' : err.message,
  })
})

export default app
