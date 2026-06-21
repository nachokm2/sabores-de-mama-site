import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { query } from '../models/index.js'
import { authJWT } from '../middleware/authJWT.js'

const router = Router()

const COLS = 'id, nombre, descripcion, precio, imagen, formato, porciones, activo'

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
 * GET /api/productos-hornear  (público)
 * Productos para hornear ACTIVOS (add-on opcional del flujo de pedido).
 * Con Bearer token válido + ?todos=true devuelve TODOS (para el panel admin).
 */
router.get('/', async (req, res, next) => {
  try {
    const verTodos = req.query.todos === 'true' && hasValidToken(req)
    const sql = verTodos
      ? `SELECT ${COLS} FROM productos_hornear ORDER BY nombre`
      : `SELECT ${COLS} FROM productos_hornear WHERE activo = true ORDER BY nombre`
    const { rows } = await query(sql)
    return res.json({ productos: rows, count: rows.length })
  } catch (err) {
    next(err)
  }
})

/**
 * POST /api/productos-hornear  (protegido) — crear o editar (upsert por id).
 * Body: { id?, nombre, descripcion, precio, imagen, formato, porciones, activo }
 */
router.post('/', authJWT, async (req, res, next) => {
  try {
    const { id, nombre, descripcion, precio, imagen, formato, porciones, activo } = req.body || {}
    if (!nombre || !String(nombre).trim()) return res.status(400).json({ error: 'El nombre es obligatorio.' })
    const vals = [
      String(nombre).trim(),
      descripcion || null,
      Number(precio) || 0,
      imagen || null,
      formato || null,
      porciones || null,
      activo !== false,
    ]

    if (id) {
      const { rows } = await query(
        `UPDATE productos_hornear
            SET nombre = $1, descripcion = $2, precio = $3, imagen = $4,
                formato = $5, porciones = $6, activo = $7
          WHERE id = $8 RETURNING ${COLS}`,
        [...vals, id]
      )
      if (!rows[0]) return res.status(404).json({ error: 'Producto no encontrado.' })
      return res.json({ producto: rows[0] })
    }

    const { rows } = await query(
      `INSERT INTO productos_hornear (nombre, descripcion, precio, imagen, formato, porciones, activo)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING ${COLS}`,
      vals
    )
    return res.status(201).json({ producto: rows[0] })
  } catch (err) {
    next(err)
  }
})

/**
 * DELETE /api/productos-hornear/:id  (protegido)
 */
router.delete('/:id', authJWT, async (req, res, next) => {
  try {
    const { rowCount } = await query('DELETE FROM productos_hornear WHERE id = $1', [req.params.id])
    if (!rowCount) return res.status(404).json({ error: 'Producto no encontrado.' })
    return res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

export default router
