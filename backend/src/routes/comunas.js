import { Router } from 'express'
import { query } from '../models/index.js'
import { requireAdmin, isAdminToken } from '../middleware/authJWT.js'

const router = Router()

function parseCosto(v) {
  const n = Number(v)
  return Number.isInteger(n) && n >= 0 ? n : null
}

// Columnas según el servicio (whitelist; nunca se interpola valor del usuario).
// Cada servicio tiene su propio costo y disponibilidad, independientes.
function cols(servicio) {
  return servicio === 'cocinera'
    ? { costo: 'costo_cocinera', activo: 'activo_cocinera' }
    : { costo: 'costo_meal_prep', activo: 'activo_meal_prep' }
}

const sel = (costo, activo) =>
  `id, nombre, COALESCE(${costo}, 0) AS costo_despacho, COALESCE(${activo}, false) AS activo`

/**
 * GET /api/comunas?servicio=meal_prep|cocinera  (público)
 * Devuelve las comunas CONFIGURADAS para ese servicio, con su costo/estado
 * propios. Público: sólo activas. Admin (?todos=true): todas las configuradas.
 */
router.get('/', async (req, res, next) => {
  try {
    const { costo, activo } = cols(req.query.servicio)
    const verTodos = req.query.todos === 'true' && isAdminToken(req)
    const where = verTodos
      ? `${costo} IS NOT NULL`
      : `${costo} IS NOT NULL AND COALESCE(${activo}, false) = true`
    const { rows } = await query(`SELECT ${sel(costo, activo)} FROM comunas WHERE ${where} ORDER BY nombre ASC`)
    return res.json({ comunas: rows, count: rows.length })
  } catch (err) {
    next(err)
  }
})

/**
 * POST /api/comunas  (admin) — crea/actualiza una comuna PARA UN SERVICIO.
 * Body: { nombre, servicio, costo_despacho, activo }
 */
router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const { nombre, servicio, costo_despacho, activo } = req.body || {}
    const nom = String(nombre || '').trim()
    if (!nom) return res.status(400).json({ error: 'El nombre de la comuna es obligatorio.' })
    const costoN = parseCosto(costo_despacho)
    if (costoN === null) return res.status(400).json({ error: 'costo_despacho debe ser un entero >= 0.' })
    const { costo, activo: activoCol } = cols(servicio)

    const { rows } = await query(
      `INSERT INTO comunas (nombre, ${costo}, ${activoCol})
       VALUES ($1, $2, $3)
       ON CONFLICT (nombre) DO UPDATE SET ${costo} = EXCLUDED.${costo}, ${activoCol} = EXCLUDED.${activoCol}
       RETURNING ${sel(costo, activoCol)}`,
      [nom, costoN, activo !== false]
    )
    return res.status(201).json({ comuna: rows[0] })
  } catch (err) {
    next(err)
  }
})

/**
 * PUT /api/comunas/:id  (admin) — edita nombre/costo/estado PARA UN SERVICIO.
 * Body: { servicio, nombre?, costo_despacho?, activo? }
 */
router.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    const { servicio, nombre, costo_despacho, activo } = req.body || {}
    const { costo, activo: activoCol } = cols(servicio)
    const sets = []
    const params = []
    if (nombre !== undefined) {
      const nom = String(nombre).trim()
      if (!nom) return res.status(400).json({ error: 'El nombre no puede quedar vacío.' })
      params.push(nom)
      sets.push(`nombre = $${params.length}`)
    }
    if (costo_despacho !== undefined) {
      const c = parseCosto(costo_despacho)
      if (c === null) return res.status(400).json({ error: 'costo_despacho debe ser un entero >= 0.' })
      params.push(c)
      sets.push(`${costo} = $${params.length}`)
    }
    if (activo !== undefined) {
      params.push(activo !== false)
      sets.push(`${activoCol} = $${params.length}`)
    }
    if (!sets.length) return res.status(400).json({ error: 'No hay campos para actualizar.' })

    params.push(req.params.id)
    const { rows } = await query(
      `UPDATE comunas SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING ${sel(costo, activoCol)}`,
      params
    )
    if (!rows[0]) return res.status(404).json({ error: 'Comuna no encontrada.' })
    return res.json({ comuna: rows[0] })
  } catch (err) {
    next(err)
  }
})

/**
 * DELETE /api/comunas/:id?servicio=...  (admin)
 * Quita la comuna DE ESE SERVICIO (deja la del otro intacta). Si no queda
 * configurada en ningún servicio, elimina la fila por completo.
 */
router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const { costo, activo } = cols(req.query.servicio)
    const { rows } = await query(
      `UPDATE comunas SET ${costo} = NULL, ${activo} = NULL WHERE id = $1
       RETURNING costo_meal_prep, costo_cocinera`,
      [req.params.id]
    )
    if (!rows[0]) return res.status(404).json({ error: 'Comuna no encontrada.' })
    if (rows[0].costo_meal_prep === null && rows[0].costo_cocinera === null) {
      await query('DELETE FROM comunas WHERE id = $1', [req.params.id])
    }
    return res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

export default router
