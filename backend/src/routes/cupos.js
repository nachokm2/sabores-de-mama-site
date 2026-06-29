import { Router } from 'express'
import { query } from '../models/index.js'
import { requireAdmin, isAdminToken } from '../middleware/authJWT.js'

const router = Router()

// Columnas según el servicio (whitelist; nunca se interpola valor del usuario).
// Cada servicio tiene su propia capacidad, confirmados y disponibilidad.
function cols(servicio) {
  return servicio === 'cocinera'
    ? { cap: 'capacidad_cocinera', conf: 'confirmados_cocinera', act: 'activo_cocinera' }
    : { cap: 'capacidad_meal_prep', conf: 'confirmados_meal_prep', act: 'activo_meal_prep' }
}

const sel = ({ cap, conf, act }) => `
  id, fecha,
  COALESCE(${cap}, 0)     AS capacidad_maxima,
  COALESCE(${conf}, 0)    AS pedidos_confirmados,
  COALESCE(${act}, false) AS activo,
  GREATEST(COALESCE(${cap}, 0) - COALESCE(${conf}, 0), 0) AS disponibles`

/**
 * GET /api/cupos?servicio=meal_prep|cocinera  (público)
 * Devuelve las fechas CONFIGURADAS para ese servicio, con su capacidad/estado
 * propios. Público: sólo activas, a futuro y con disponibilidad. Admin
 * (?todos=true): todas las configuradas para el servicio (incluidas pasadas).
 */
router.get('/', async (req, res, next) => {
  try {
    const c = cols(req.query.servicio)
    const verTodos = req.query.todos === 'true' && isAdminToken(req)
    const where = verTodos
      ? `${c.cap} IS NOT NULL`
      : `${c.cap} IS NOT NULL
         AND COALESCE(${c.act}, false) = true
         AND fecha > CURRENT_DATE
         AND COALESCE(${c.conf}, 0) < ${c.cap}`
    const { rows } = await query(`SELECT ${sel(c)} FROM cupos WHERE ${where} ORDER BY fecha ASC`)
    return res.json({ cupos: rows, count: rows.length })
  } catch (err) {
    next(err)
  }
})

function parseCapacidad(v) {
  const n = Number(v)
  return Number.isInteger(n) && n >= 0 ? n : null
}

// Upsert del cupo de una fecha PARA UN SERVICIO. No reinicia los confirmados.
async function upsertCupo(c, fecha, capacidad, activo) {
  const { rows } = await query(
    `INSERT INTO cupos (fecha, ${c.cap}, ${c.conf}, ${c.act})
     VALUES ($1, $2, 0, $3)
     ON CONFLICT (fecha) DO UPDATE
       SET ${c.cap}  = EXCLUDED.${c.cap},
           ${c.act}  = EXCLUDED.${c.act},
           ${c.conf} = COALESCE(cupos.${c.conf}, 0)
     RETURNING ${sel(c)}`,
    [fecha, capacidad, activo !== false]
  )
  return rows[0]
}

/**
 * POST /api/cupos  (admin) — crea/edita el cupo de una fecha PARA UN SERVICIO.
 * Body: { fecha, servicio, capacidad_maxima, activo }
 */
router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const { fecha, servicio, capacidad_maxima, activo } = req.body || {}
    if (!fecha) return res.status(400).json({ error: 'La fecha es obligatoria.' })
    const capacidad = parseCapacidad(capacidad_maxima)
    if (capacidad === null) return res.status(400).json({ error: 'capacidad_maxima debe ser un entero >= 0.' })
    const cupo = await upsertCupo(cols(servicio), fecha, capacidad, activo)
    return res.status(201).json({ cupo })
  } catch (err) {
    next(err)
  }
})

/**
 * POST /api/cupos/bulk  (admin) — varias fechas a la vez PARA UN SERVICIO.
 * Body: { fechas: [...], servicio, capacidad_maxima, activo }
 */
router.post('/bulk', requireAdmin, async (req, res, next) => {
  try {
    const { fechas, servicio, capacidad_maxima, activo } = req.body || {}
    if (!Array.isArray(fechas) || fechas.length === 0) {
      return res.status(400).json({ error: 'Debes enviar al menos una fecha.' })
    }
    const capacidad = parseCapacidad(capacidad_maxima)
    if (capacidad === null) return res.status(400).json({ error: 'capacidad_maxima debe ser un entero >= 0.' })

    const c = cols(servicio)
    const creados = []
    for (const fecha of fechas) {
      creados.push(await upsertCupo(c, fecha, capacidad, activo))
    }
    return res.status(201).json({ cupos: creados, count: creados.length })
  } catch (err) {
    next(err)
  }
})

/**
 * DELETE /api/cupos/:id?servicio=...  (admin)
 * Quita la fecha DE ESE SERVICIO (deja la del otro intacta). Si no queda
 * configurada en ningún servicio, elimina la fila por completo.
 */
router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const c = cols(req.query.servicio)
    const { rows } = await query(
      `UPDATE cupos SET ${c.cap} = NULL, ${c.conf} = NULL, ${c.act} = NULL
       WHERE id = $1 RETURNING capacidad_meal_prep, capacidad_cocinera`,
      [req.params.id]
    )
    if (!rows[0]) return res.status(404).json({ error: 'Cupo no encontrado.' })
    if (rows[0].capacidad_meal_prep === null && rows[0].capacidad_cocinera === null) {
      await query('DELETE FROM cupos WHERE id = $1', [req.params.id])
    }
    return res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

export default router
