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

function parseCosto(v) {
  const n = Number(v)
  return Number.isInteger(n) && n >= 0 ? n : null
}

/**
 * GET /api/comunas  (público)
 * Devuelve sólo comunas ACTIVAS (para el flujo de pedido).
 * Con Bearer token válido + ?todos=true devuelve TODAS (para el panel admin).
 */
router.get('/', async (req, res, next) => {
  try {
    const verTodos = req.query.todos === 'true' && hasValidToken(req)
    const sql = verTodos
      ? `SELECT id, nombre, costo_despacho, activo FROM comunas ORDER BY nombre ASC`
      : `SELECT id, nombre, costo_despacho, activo FROM comunas WHERE activo = true ORDER BY nombre ASC`
    const { rows } = await query(sql)
    return res.json({ comunas: rows, count: rows.length })
  } catch (err) {
    next(err)
  }
})

/**
 * POST /api/comunas  (protegido) — crea o actualiza por nombre (upsert).
 * Body: { nombre, costo_despacho, activo }
 */
router.post('/', authJWT, async (req, res, next) => {
  try {
    const { nombre, costo_despacho, activo } = req.body || {}
    const nom = String(nombre || '').trim()
    if (!nom) return res.status(400).json({ error: 'El nombre de la comuna es obligatorio.' })
    const costo = parseCosto(costo_despacho)
    if (costo === null) return res.status(400).json({ error: 'costo_despacho debe ser un entero >= 0.' })

    const { rows } = await query(
      `INSERT INTO comunas (nombre, costo_despacho, activo)
       VALUES ($1, $2, $3)
       ON CONFLICT (nombre) DO UPDATE
         SET costo_despacho = EXCLUDED.costo_despacho, activo = EXCLUDED.activo
       RETURNING id, nombre, costo_despacho, activo`,
      [nom, costo, activo !== false]
    )
    return res.status(201).json({ comuna: rows[0] })
  } catch (err) {
    next(err)
  }
})

/**
 * PUT /api/comunas/:id  (protegido) — edita nombre, costo y/o estado.
 */
router.put('/:id', authJWT, async (req, res, next) => {
  try {
    const { nombre, costo_despacho, activo } = req.body || {}
    const sets = []
    const params = []
    if (nombre !== undefined) {
      const nom = String(nombre).trim()
      if (!nom) return res.status(400).json({ error: 'El nombre no puede quedar vacío.' })
      params.push(nom)
      sets.push(`nombre = $${params.length}`)
    }
    if (costo_despacho !== undefined) {
      const costo = parseCosto(costo_despacho)
      if (costo === null) return res.status(400).json({ error: 'costo_despacho debe ser un entero >= 0.' })
      params.push(costo)
      sets.push(`costo_despacho = $${params.length}`)
    }
    if (activo !== undefined) {
      params.push(activo !== false)
      sets.push(`activo = $${params.length}`)
    }
    if (!sets.length) return res.status(400).json({ error: 'No hay campos para actualizar.' })

    params.push(req.params.id)
    const { rows } = await query(
      `UPDATE comunas SET ${sets.join(', ')} WHERE id = $${params.length}
       RETURNING id, nombre, costo_despacho, activo`,
      params
    )
    if (!rows[0]) return res.status(404).json({ error: 'Comuna no encontrada.' })
    return res.json({ comuna: rows[0] })
  } catch (err) {
    next(err)
  }
})

/**
 * DELETE /api/comunas/:id  (protegido)
 */
router.delete('/:id', authJWT, async (req, res, next) => {
  try {
    const { rowCount } = await query('DELETE FROM comunas WHERE id = $1', [req.params.id])
    if (!rowCount) return res.status(404).json({ error: 'Comuna no encontrada.' })
    return res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

export default router
