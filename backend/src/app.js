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
import correosRouter from './routes/correos.js'
import productosHornearRouter from './routes/productosHornear.js'

dotenv.config()

const app = express()

// Detrás del proxy de Railway: necesario para que req.ip sea la IP real
// (lo usa el rate limiter).
app.set('trust proxy', 1)

// ── CORS ──
// Whitelist por CORS_ORIGIN (coma-separado). Si no se define, cae a CLIENT_URL
// (el dominio del frontend). Sólo permite todos los orígenes si se pide '*'
// explícitamente; en producción se advierte para evitar configuraciones abiertas.
const corsOriginEnv = process.env.CORS_ORIGIN || process.env.CLIENT_URL || '*'
const rawOrigins = corsOriginEnv.split(',').map((o) => o.trim()).filter(Boolean)
const allowAll = rawOrigins.includes('*')
if (process.env.NODE_ENV === 'production' && allowAll) {
  console.warn(
    '[cors] ADVERTENCIA: se permiten TODOS los orígenes (*) en producción. ' +
      'Define CORS_ORIGIN con el dominio del frontend (p. ej. https://saboresdemama.com).'
  )
}
app.use(
  cors({
    origin(origin, callback) {
      // Permitir herramientas sin origin (curl, health checks) y la lista blanca.
      if (allowAll || !origin || rawOrigins.includes(origin)) {
        return callback(null, true)
      }
      return callback(new Error('Origen no permitido por CORS: ' + origin))
    },
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
app.use('/api/correos', correosRouter)
app.use('/api/productos-hornear', productosHornearRouter)

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
