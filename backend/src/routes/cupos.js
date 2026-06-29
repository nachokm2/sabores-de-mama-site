import { Router } from 'express'
import { query } from '../models/index.js'
import { requireAdmin, isAdminToken } from '../middleware/authJWT.js'

const router = Router()

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
    const verTodos = req.query.todos === 'true' && isAdminToken(req)

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
router.post('/', requireAdmin, async (req, res, next) => {
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

/**
 * POST /api/cupos/bulk  (protegido)
 * Crea/edita varias fechas de una vez (upsert por fecha).
 * Body: { fechas: ['2026-07-01', ...], capacidad_maxima, activo }
 */
router.post('/bulk', requireAdmin, async (req, res, next) => {
  try {
    const { fechas, capacidad_maxima, activo } = req.body || {}
    if (!Array.isArray(fechas) || fechas.length === 0) {
      return res.status(400).json({ error: 'Debes enviar al menos una fecha.' })
    }
    const capacidad = Number(capacidad_maxima)
    if (!Number.isInteger(capacidad) || capacidad < 0) {
      return res.status(400).json({ error: 'capacidad_maxima debe ser un entero >= 0.' })
    }

    const creados = []
    for (const fecha of fechas) {
      const { rows } = await query(
        `INSERT INTO cupos (fecha, capacidad_maxima, activo)
         VALUES ($1, $2, $3)
         ON CONFLICT (fecha) DO UPDATE
           SET capacidad_maxima = EXCLUDED.capacidad_maxima, activo = EXCLUDED.activo
         RETURNING id, fecha, capacidad_maxima, pedidos_confirmados, activo,
                   (capacidad_maxima - pedidos_confirmados) AS disponibles`,
        [fecha, capacidad, activo !== false]
      )
      creados.push(rows[0])
    }
    return res.status(201).json({ cupos: creados, count: creados.length })
  } catch (err) {
    next(err)
  }
})

/**
 * DELETE /api/cupos/:id  (protegido) — elimina una fecha por completo.
 */
router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const { rowCount } = await query('DELETE FROM cupos WHERE id = $1', [req.params.id])
    if (!rowCount) return res.status(404).json({ error: 'Cupo no encontrado.' })
    return res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

export default router
