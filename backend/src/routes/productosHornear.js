import { Router } from 'express'
import { query } from '../models/index.js'
import { authJWT } from '../middleware/authJWT.js'

const router = Router()

/**
 * GET /api/productos-hornear  (público)
 * Productos para hornear ACTIVOS (add-on opcional del flujo de pedido).
 */
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, nombre, descripcion, precio, activo
         FROM productos_hornear
        WHERE activo = true
        ORDER BY nombre`
    )
    return res.json({ productos: rows, count: rows.length })
  } catch (err) {
    next(err)
  }
})

/**
 * POST /api/productos-hornear  (protegido) — crear/editar (upsert simple por id).
 */
router.post('/', authJWT, async (req, res, next) => {
  try {
    const { id, nombre, descripcion, precio, activo } = req.body || {}
    if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio.' })

    if (id) {
      const { rows } = await query(
        `UPDATE productos_hornear
            SET nombre = $1, descripcion = $2, precio = $3, activo = $4
          WHERE id = $5 RETURNING *`,
        [nombre, descripcion || null, Number(precio) || 0, activo !== false, id]
      )
      if (!rows[0]) return res.status(404).json({ error: 'Producto no encontrado.' })
      return res.json({ producto: rows[0] })
    }

    const { rows } = await query(
      `INSERT INTO productos_hornear (nombre, descripcion, precio, activo)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [nombre, descripcion || null, Number(precio) || 0, activo !== false]
    )
    return res.status(201).json({ producto: rows[0] })
  } catch (err) {
    next(err)
  }
})

export default router
