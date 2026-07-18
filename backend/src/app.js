import express from 'express'
import cors from 'cors'
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

dotenv.config()

const app = express()

// Detrás del proxy de Railway: necesario para que req.ip sea la IP real
// (lo usa el rate limiter).
app.set('trust proxy', 1)

// ── CORS ──
// Orígenes permitidos = CORS_ORIGIN/CLIENT_URL (coma-separado) + los dominios del
// sitio + cualquier subdominio *.up.railway.app. Así funciona en el dominio propio
// sin depender de variables. '*' abre todo (se desaconseja en producción).
const corsOriginEnv = process.env.CORS_ORIGIN || process.env.CLIENT_URL || ''
const envOrigins = corsOriginEnv.split(',').map((o) => o.trim()).filter(Boolean)
const allowAll = envOrigins.includes('*')
const DEFAULT_ORIGINS = ['https://saboresdemama.com', 'https://www.saboresdemama.com']
const allowedOrigins = [...new Set([...envOrigins.filter((o) => o !== '*'), ...DEFAULT_ORIGINS])]

function corsPermitido(origin) {
  if (!origin) return true // curl / health checks / same-origin
  if (allowAll || allowedOrigins.includes(origin)) return true
  try {
    return /\.up\.railway\.app$/i.test(new URL(origin).host)
  } catch {
    return false
  }
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
