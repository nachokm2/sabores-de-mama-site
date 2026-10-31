import { Router } from 'express'
import { query } from '../models/index.js'
import { requireAdmin, isAdminToken } from '../middleware/authJWT.js'

const router = Router()

const COLS = 'id, nombre, descripcion, precio, imagen, formato, porciones, activo, etiqueta'

// Los destacados (con etiqueta) primero, agrupados por etiqueta y de menor a
// mayor precio (se leen como lista de precios); el resto, por nombre.
const ORDEN = 'ORDER BY etiqueta IS NULL, etiqueta, CASE WHEN etiqueta IS NOT NULL THEN precio END, nombre'

/**
 * GET /api/productos-hornear  (público)
 * Productos para hornear ACTIVOS (add-on opcional del flujo de pedido).
 * Con Bearer token válido + ?todos=true devuelve TODOS (para el panel admin).
 */
router.get('/', async (req, res, next) => {
  try {
    const verTodos = req.query.todos === 'true' && isAdminToken(req)
    const sql = verTodos
      ? `SELECT ${COLS} FROM productos_hornear ${ORDEN}`
      : `SELECT ${COLS} FROM productos_hornear WHERE activo = true ${ORDEN}`
    const { rows } = await query(sql)
    return res.json({ productos: rows, count: rows.length })
  } catch (err) {
    next(err)
  }
})

/**
 * POST /api/productos-hornear  (protegido) — crear o editar (upsert por id).
 * Body: { id?, nombre, descripcion, precio, imagen, formato, porciones, activo, etiqueta }
 */
router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const { id, nombre, descripcion, precio, imagen, formato, porciones, activo, etiqueta } = req.body || {}
    if (!nombre || !String(nombre).trim()) return res.status(400).json({ error: 'El nombre es obligatorio.' })
    const vals = [
      String(nombre).trim(),
      descripcion || null,
      Number(precio) || 0,
      imagen || null,
      formato || null,
      porciones || null,
      activo !== false,
      String(etiqueta ?? '').trim().slice(0, 40) || null,
    ]

    if (id) {
      const { rows } = await query(
        `UPDATE productos_hornear
            SET nombre = $1, descripcion = $2, precio = $3, imagen = $4,
                formato = $5, porciones = $6, activo = $7, etiqueta = $8
          WHERE id = $9 RETURNING ${COLS}`,
        [...vals, id]
      )
      if (!rows[0]) return res.status(404).json({ error: 'Producto no encontrado.' })
      return res.json({ producto: rows[0] })
    }

    const { rows } = await query(
      `INSERT INTO productos_hornear (nombre, descripcion, precio, imagen, formato, porciones, activo, etiqueta)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING ${COLS}`,
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
router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const { rowCount } = await query('DELETE FROM productos_hornear WHERE id = $1', [req.params.id])
    if (!rowCount) return res.status(404).json({ error: 'Producto no encontrado.' })
    return res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

export default router
