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

// Columnas configurables por servicio (whitelist para el UPDATE dinámico).
const COLS = ['precio_base', 'costo_ingredientes', 'costo_porcionado']
const SELECT_COLS = 'servicio, precio_base, costo_ingredientes, costo_porcionado'

/**
 * GET /api/config  (público)
 * Devuelve la configuración de TODOS los servicios:
 * { config: { meal_prep: { precio_base, costo_ingredientes, costo_porcionado }, cocinera: {...} } }
 */
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await query(`SELECT ${SELECT_COLS} FROM servicios_config`)
    const config = {}
    for (const r of rows) {
      config[r.servicio] = {
        precio_base: r.precio_base,
        costo_ingredientes: r.costo_ingredientes,
        costo_porcionado: r.costo_porcionado,
      }
    }
    return res.json({ config })
  } catch (err) {
    next(err)
  }
})

/**
 * GET /api/config/:servicio  (público) — configuración de un servicio
 * (precio base + costos de los adicionales).
 */
router.get('/:servicio', async (req, res, next) => {
  try {
    const { servicio } = req.params
    if (!SERVICIOS.includes(servicio)) return res.status(404).json({ error: 'Servicio no válido.' })
    const { rows } = await query(
      `SELECT ${SELECT_COLS} FROM servicios_config WHERE servicio = $1`,
      [servicio]
    )
    if (!rows[0]) return res.status(404).json({ error: 'Configuración no encontrada.' })
    return res.json({ config: rows[0] })
  } catch (err) {
    next(err)
  }
})

/**
 * PUT /api/config/:servicio  (admin) — actualiza la configuración de un servicio.
 * Body: cualquier subconjunto de { precio_base, costo_ingredientes, costo_porcionado }.
 * Cada campo debe ser un entero >= 0. Cada servicio es independiente del otro.
 */
router.put('/:servicio', requireAdmin, async (req, res, next) => {
  try {
    const { servicio } = req.params
    if (!SERVICIOS.includes(servicio)) return res.status(404).json({ error: 'Servicio no válido.' })

    const body = req.body || {}
    const sets = []
    const params = []
    for (const col of COLS) {
      if (body[col] === undefined) continue
      const valor = parsePrecio(body[col])
      if (valor === null) return res.status(400).json({ error: `${col} debe ser un entero >= 0.` })
      params.push(valor)
      sets.push(`${col} = $${params.length}`)
    }
    if (!sets.length) {
      return res.status(400).json({ error: 'No hay campos para actualizar (precio_base, costo_ingredientes, costo_porcionado).' })
    }

    params.push(servicio)
    const { rows } = await query(
      `UPDATE servicios_config SET ${sets.join(', ')}, updated_at = now()
        WHERE servicio = $${params.length}
      RETURNING ${SELECT_COLS}`,
      params
    )
    if (!rows[0]) return res.status(404).json({ error: 'Configuración no encontrada.' })
    return res.json({ config: rows[0] })
  } catch (err) {
    next(err)
  }
})

export default router
