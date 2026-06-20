import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { query } from '../models/index.js'
import { authJWT } from '../middleware/authJWT.js'

const router = Router()

function hasValidToken(req) {
  const [scheme, token] = (req.headers.authorization || '').split(' ')
  if (scheme !== 'Bearer' || !token) return false
  try {
    jwt.verify(token, process.env.JWT_SECRET)
    return true
  } catch {
    return false
  }
}

/**
 * GET /api/cupos  (público)
 * REGLA: sólo devuelve fechas ACTIVAS, A FUTURO (> hoy) y con cupos disponibles
 * (capacidad_maxima > pedidos_confirmados).
 *
 * Para el panel admin: con Bearer token válido + ?todos=true devuelve TODOS los
 * cupos (incluidos pasados, inactivos o llenos) para gestionarlos.
 */
router.get('/', async (req, res, next) => {
  try {
    const verTodos = req.query.todos === 'true' && hasValidToken(req)

    const sql = verTodos
      ? `SELECT id, fecha, capacidad_maxima, pedidos_confirmados, activo,
                (capacidad_maxima - pedidos_confirmados) AS disponibles
           FROM cupos
          ORDER BY fecha ASC`
      : `SELECT id, fecha, capacidad_maxima, pedidos_confirmados, activo,
                (capacidad_maxima - pedidos_confirmados) AS disponibles
           FROM cupos
          WHERE activo = true
            AND fecha > CURRENT_DATE
            AND pedidos_confirmados < capacidad_maxima
          ORDER BY fecha ASC`

    const { rows } = await query(sql)
    return res.json({ cupos: rows, count: rows.length })
  } catch (err) {
    next(err)
  }
})

/**
 * POST /api/cupos  (protegido)
 * Crea o edita el cupo de una fecha (upsert por fecha única).
 * Body: { fecha, capacidad_maxima, activo }
 * No reinicia pedidos_confirmados al editar.
 */
router.post('/', authJWT, async (req, res, next) => {
  try {
    const { fecha, capacidad_maxima, activo } = req.body || {}
    if (!fecha) return res.status(400).json({ error: 'La fecha es obligatoria.' })

    const capacidad = Number(capacidad_maxima)
    if (!Number.isInteger(capacidad) || capacidad < 0) {
      return res.status(400).json({ error: 'capacidad_maxima debe ser un entero >= 0.' })
    }

    const { rows } = await query(
      `INSERT INTO cupos (fecha, capacidad_maxima, activo)
       VALUES ($1, $2, $3)
       ON CONFLICT (fecha) DO UPDATE
         SET capacidad_maxima = EXCLUDED.capacidad_maxima,
             activo           = EXCLUDED.activo
       RETURNING id, fecha, capacidad_maxima, pedidos_confirmados, activo,
                 (capacidad_maxima - pedidos_confirmados) AS disponibles`,
      [fecha, capacidad, activo !== false]
    )

    return res.status(201).json({ cupo: rows[0] })
  } catch (err) {
    next(err)
  }
})

export default router
