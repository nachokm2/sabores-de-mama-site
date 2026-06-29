import { Router } from 'express'
import { query } from '../models/index.js'
import { requireAdmin } from '../middleware/authJWT.js'

const router = Router()

// Servicios válidos (whitelist).
const SERVICIOS = ['meal_prep', 'cocinera']

function parsePrecio(v) {
  const n = Number(v)
  return Number.isInteger(n) && n >= 0 ? n : null
}

/**
 * GET /api/config  (público)
 * Devuelve la configuración (precio base) de TODOS los servicios:
 * { config: { meal_prep: { precio_base }, cocinera: { precio_base } } }
 */
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await query('SELECT servicio, precio_base FROM servicios_config')
    const config = {}
    for (const r of rows) config[r.servicio] = { precio_base: r.precio_base }
    return res.json({ config })
  } catch (err) {
    next(err)
  }
})

/**
 * GET /api/config/:servicio  (público) — precio base de un servicio.
 */
router.get('/:servicio', async (req, res, next) => {
  try {
    const { servicio } = req.params
    if (!SERVICIOS.includes(servicio)) return res.status(404).json({ error: 'Servicio no válido.' })
    const { rows } = await query(
      'SELECT servicio, precio_base FROM servicios_config WHERE servicio = $1',
      [servicio]
    )
    if (!rows[0]) return res.status(404).json({ error: 'Configuración no encontrada.' })
    return res.json({ config: rows[0] })
  } catch (err) {
    next(err)
  }
})

/**
 * PUT /api/config/:servicio  (admin) — actualiza el precio base de un servicio.
 * Body: { precio_base }. Cada servicio es independiente del otro.
 */
router.put('/:servicio', requireAdmin, async (req, res, next) => {
  try {
    const { servicio } = req.params
    if (!SERVICIOS.includes(servicio)) return res.status(404).json({ error: 'Servicio no válido.' })
    const precio = parsePrecio(req.body?.precio_base)
    if (precio === null) return res.status(400).json({ error: 'precio_base debe ser un entero >= 0.' })
    const { rows } = await query(
      `INSERT INTO servicios_config (servicio, precio_base, updated_at)
       VALUES ($1, $2, now())
       ON CONFLICT (servicio) DO UPDATE SET precio_base = EXCLUDED.precio_base, updated_at = now()
       RETURNING servicio, precio_base`,
      [servicio, precio]
    )
    return res.json({ config: rows[0] })
  } catch (err) {
    next(err)
  }
})

export default router
