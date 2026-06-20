import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { query, withTransaction } from '../models/index.js'
import { authJWT } from '../middleware/authJWT.js'

const router = Router()

// Auth opcional: devuelve true si llega un Bearer token válido (sin bloquear).
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

// SELECT de platos con sus ingredientes agregados como JSON.
function selectPlatosSQL(whereSql = '') {
  return `
    SELECT p.id, p.nombre, p.descripcion, p.categoria, p.activo, p.created_at,
           COALESCE(
             json_agg(
               json_build_object(
                 'id', i.id, 'nombre', i.nombre,
                 'cantidad', i.cantidad, 'unidad', i.unidad
               ) ORDER BY i.id
             ) FILTER (WHERE i.id IS NOT NULL),
             '[]'
           ) AS ingredientes
      FROM platos p
      LEFT JOIN ingredientes i ON i.plato_id = p.id
      ${whereSql}
      GROUP BY p.id
      ORDER BY p.categoria NULLS LAST, p.nombre`
}

async function getPlatoConIngredientes(id) {
  const { rows } = await query(selectPlatosSQL('WHERE p.id = $1'), [id])
  return rows[0] || null
}

/**
 * GET /api/platos  (público)
 * Lista los platos ACTIVOS con sus ingredientes.
 * Con un Bearer token válido + ?incluir_inactivos=true, devuelve también los
 * inactivos (para el panel admin).
 */
router.get('/', async (req, res, next) => {
  try {
    const incluirInactivos = req.query.incluir_inactivos === 'true' && hasValidToken(req)
    const whereSql = incluirInactivos ? '' : 'WHERE p.activo = true'
    const { rows } = await query(selectPlatosSQL(whereSql))
    return res.json({ platos: rows, count: rows.length })
  } catch (err) {
    next(err)
  }
})

/**
 * GET /api/platos/ingredientes?platos=id1,id2,id3  (público)
 * Devuelve los ingredientes de los platos indicados, CONSOLIDADOS: si dos platos
 * usan el mismo ingrediente (mismo nombre + unidad), suma las cantidades.
 * Respuesta: { ingredientes: [{ id, nombre, cantidad_total, unidad, platos: [ids] }] }
 */
router.get('/ingredientes', async (req, res, next) => {
  try {
    const ids = String(req.query.platos ?? '')
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => Number.isInteger(n))

    // Parámetro ausente o sin ids válidos → 400.
    if (req.query.platos === undefined || !ids.length) {
      return res.status(400).json({ error: 'Parámetro "platos" inválido o vacío. Usa ?platos=1,2,3' })
    }

    const { rows } = await query(
      `SELECT id, plato_id, nombre, cantidad, unidad
         FROM ingredientes
        WHERE plato_id = ANY($1)
        ORDER BY nombre`,
      [ids]
    )

    // Consolidar por nombre + unidad (sumando la parte numérica de la cantidad).
    const map = new Map()
    for (const r of rows) {
      const key = `${r.nombre.trim().toLowerCase()}|${(r.unidad || '').trim().toLowerCase()}`
      const num = parseFloat(String(r.cantidad ?? '').replace(',', '.'))
      if (!map.has(key)) {
        map.set(key, { id: r.id, nombre: r.nombre, unidad: r.unidad, cantidad_total: 0, platos: new Set() })
      }
      const e = map.get(key)
      if (!Number.isNaN(num)) e.cantidad_total += num
      e.platos.add(r.plato_id)
    }

    const ingredientes = Array.from(map.values()).map((e) => ({
      id: e.id,
      nombre: e.nombre,
      cantidad_total: Math.round(e.cantidad_total * 100) / 100,
      unidad: e.unidad,
      platos: [...e.platos],
    }))

    return res.json({ ingredientes })
  } catch (err) {
    next(err)
  }
})

/**
 * POST /api/platos  (protegido)
 * Body: { nombre, descripcion, categoria, activo, ingredientes: [{nombre,cantidad,unidad}] }
 */
router.post('/', authJWT, async (req, res, next) => {
  try {
    const { nombre, descripcion, categoria, activo, ingredientes } = req.body || {}
    if (!nombre) return res.status(400).json({ error: 'El nombre del plato es obligatorio.' })

    const plato = await withTransaction(async (client) => {
      const ins = await client.query(
        `INSERT INTO platos (nombre, descripcion, categoria, activo)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [nombre, descripcion || null, categoria || null, activo !== false]
      )
      const platoId = ins.rows[0].id

      if (Array.isArray(ingredientes)) {
        for (const ing of ingredientes) {
          if (!ing?.nombre) continue
          await client.query(
            `INSERT INTO ingredientes (plato_id, nombre, cantidad, unidad)
             VALUES ($1, $2, $3, $4)`,
            [platoId, ing.nombre, ing.cantidad ?? null, ing.unidad ?? null]
          )
        }
      }
      return platoId
    })

    const creado = await getPlatoConIngredientes(plato)
    return res.status(201).json({ plato: creado })
  } catch (err) {
    next(err)
  }
})

/**
 * PUT /api/platos/:id  (protegido)
 * Actualiza el plato. Si se envía `ingredientes`, reemplaza la lista completa.
 */
router.put('/:id', authJWT, async (req, res, next) => {
  try {
    const { id } = req.params
    const { nombre, descripcion, categoria, activo, ingredientes } = req.body || {}

    const ok = await withTransaction(async (client) => {
      const upd = await client.query(
        `UPDATE platos
            SET nombre      = COALESCE($1, nombre),
                descripcion = COALESCE($2, descripcion),
                categoria   = COALESCE($3, categoria),
                activo      = COALESCE($4, activo)
          WHERE id = $5
        RETURNING id`,
        [nombre ?? null, descripcion ?? null, categoria ?? null, activo ?? null, id]
      )
      if (upd.rowCount === 0) return false

      // Reemplazo total de ingredientes si vienen en el body.
      if (Array.isArray(ingredientes)) {
        await client.query('DELETE FROM ingredientes WHERE plato_id = $1', [id])
        for (const ing of ingredientes) {
          if (!ing?.nombre) continue
          await client.query(
            `INSERT INTO ingredientes (plato_id, nombre, cantidad, unidad)
             VALUES ($1, $2, $3, $4)`,
            [id, ing.nombre, ing.cantidad ?? null, ing.unidad ?? null]
          )
        }
      }
      return true
    })

    if (!ok) return res.status(404).json({ error: 'Plato no encontrado.' })

    const actualizado = await getPlatoConIngredientes(id)
    return res.json({ plato: actualizado })
  } catch (err) {
    next(err)
  }
})

/**
 * DELETE /api/platos/:id  (protegido) — soft delete (activo = false).
 */
router.delete('/:id', authJWT, async (req, res, next) => {
  try {
    const { rows } = await query(
      'UPDATE platos SET activo = false WHERE id = $1 RETURNING id',
      [req.params.id]
    )
    if (!rows[0]) return res.status(404).json({ error: 'Plato no encontrado.' })
    return res.json({ ok: true, id: rows[0].id })
  } catch (err) {
    next(err)
  }
})

export default router
