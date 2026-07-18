import { Router } from 'express'
import { query, withTransaction } from '../models/index.js'
import { requireAdmin, isAdminToken } from '../middleware/authJWT.js'
import { cargarCatalogo } from '../models/seedCatalogo.js'

const router = Router()

// SELECT de platos con sus ingredientes (cantidades exactas p1..p5) como JSON.
function selectPlatosSQL(whereSql = '') {
  return `
    SELECT p.id, p.nombre, p.descripcion, p.categoria, p.imagen, p.activo,
           p.meal_prep, p.cocinera, p.created_at,
           COALESCE(
             json_agg(
               json_build_object(
                 'id', i.id, 'nombre', i.nombre, 'unidad', i.unidad,
                 'p1', i.p1, 'p2', i.p2, 'p3', i.p3, 'p4', i.p4, 'p5', i.p5
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

// Inserta la lista de ingredientes de un plato (nombre, unidad y p1..p5).
async function insertarIngredientes(client, platoId, ingredientes) {
  if (!Array.isArray(ingredientes)) return
  for (const ing of ingredientes) {
    if (!ing?.nombre) continue
    const p = Array.isArray(ing.p) ? ing.p : [ing.p1, ing.p2, ing.p3, ing.p4, ing.p5]
    await client.query(
      `INSERT INTO ingredientes (plato_id, nombre, unidad, p1, p2, p3, p4, p5)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [platoId, ing.nombre, ing.unidad ?? null, p[0] ?? null, p[1] ?? null, p[2] ?? null, p[3] ?? null, p[4] ?? null]
    )
  }
}

// Convierte una cantidad textual ("½", "1½", "260", "A gusto", "2 cdas") a número
// puro cuando es posible; si no, la deja como texto (unidad embebida, "A gusto"…).
function parseCantidad(v) {
  if (v == null) return { num: null, text: null }
  const s = String(v).trim()
  if (!s) return { num: null, text: null }
  const norm = s.replace('½', '.5').replace('¼', '.25').replace('¾', '.75').replace(',', '.')
  if (/^\d*\.?\d+$/.test(norm)) return { num: parseFloat(norm), text: null }
  return { num: null, text: s }
}

/**
 * GET /api/platos  (público)
 * Lista los platos ACTIVOS con sus ingredientes.
 * - ?servicio=meal_prep|cocinera → sólo los platos de ese servicio.
 * - Con Bearer válido + ?incluir_inactivos=true → incluye inactivos (panel admin).
 */
router.get('/', async (req, res, next) => {
  try {
    const incluirInactivos = req.query.incluir_inactivos === 'true' && isAdminToken(req)
    const { servicio } = req.query
    const cond = []
    if (!incluirInactivos) cond.push('p.activo = true')
    if (servicio === 'meal_prep') cond.push('p.meal_prep = true')
    if (servicio === 'cocinera') cond.push('p.cocinera = true')
    const whereSql = cond.length ? 'WHERE ' + cond.join(' AND ') : ''
    const { rows } = await query(selectPlatosSQL(whereSql))
    return res.json({ platos: rows, count: rows.length })
  } catch (err) {
    next(err)
  }
})

/**
 * GET /api/platos/ingredientes?platos=id1,id2&personas=N  (público)
 * Ingredientes de los platos indicados, para N personas (1..5), consolidados por
 * (nombre + unidad). Usa la columna exacta p{N} (fallback a p5 si falta). Los
 * valores numéricos se suman; los no numéricos ("A gusto") se muestran tal cual.
 * Respuesta: { ingredientes: [{ id, nombre, unidad, cantidad, platos: [ids] }] }
 *   `cantidad` es número (consolidado) o string (texto).
 */
router.get('/ingredientes', async (req, res, next) => {
  try {
    const ids = String(req.query.platos ?? '')
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => Number.isInteger(n))

    if (req.query.platos === undefined || !ids.length) {
      return res.status(400).json({ error: 'Parámetro "platos" inválido o vacío. Usa ?platos=1,2,3' })
    }

    const nPers = Math.min(Math.max(parseInt(req.query.personas, 10) || 5, 1), 5)
    const col = `p${nPers}`

    const { rows } = await query(
      `SELECT id, plato_id, nombre, unidad, ${col} AS cantidad, p5
         FROM ingredientes
        WHERE plato_id = ANY($1)
        ORDER BY nombre`,
      [ids]
    )

    // Consolidar por nombre + unidad.
    const map = new Map()
    for (const r of rows) {
      const bruto = r.cantidad ?? r.p5 // fallback a p5 si no hay valor para N personas
      const key = `${r.nombre.trim().toLowerCase()}|${(r.unidad || '').trim().toLowerCase()}`
      if (!map.has(key)) {
        map.set(key, { id: r.id, nombre: r.nombre, unidad: r.unidad, num: 0, hayNum: false, textos: new Set(), platos: new Set() })
      }
      const e = map.get(key)
      const { num, text } = parseCantidad(bruto)
      if (num != null) {
        e.num += num
        e.hayNum = true
      } else if (text) {
        e.textos.add(text)
      }
      e.platos.add(r.plato_id)
    }

    const ingredientes = Array.from(map.values()).map((e) => {
      let cantidad
      if (e.hayNum && e.textos.size === 0) cantidad = Math.round(e.num * 100) / 100
      else if (!e.hayNum && e.textos.size) cantidad = [...e.textos].join(', ')
      else if (e.hayNum && e.textos.size) cantidad = `${Math.round(e.num * 100) / 100} + ${[...e.textos].join(', ')}`
      else cantidad = ''
      return { id: e.id, nombre: e.nombre, unidad: e.unidad, cantidad, platos: [...e.platos] }
    })

    return res.json({ ingredientes })
  } catch (err) {
    next(err)
  }
})

/**
 * POST /api/platos/recargar-catalogo  (protegido)
 * REEMPLAZA por completo el catálogo con el de src/data/catalogoPlatos.js.
 * Acción destructiva → exige body { confirmacion: 'REEMPLAZAR' }. No toca pedidos
 * ni cupos.
 */
router.post('/recargar-catalogo', requireAdmin, async (req, res, next) => {
  try {
    const confirmacion = String(req.body?.confirmacion || '').trim().toUpperCase()
    if (confirmacion !== 'REEMPLAZAR') {
      return res.status(400).json({ error: 'Confirmación inválida. Escribe REEMPLAZAR para continuar.' })
    }
    const resumen = await cargarCatalogo()
    return res.json({ ok: true, resumen })
  } catch (err) {
    next(err)
  }
})

/**
 * POST /api/platos  (protegido)
 * Body: { nombre, descripcion, categoria, imagen, activo, meal_prep, cocinera,
 *         ingredientes: [{ nombre, unidad, p1..p5 }] }
 */
router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const b = req.body || {}
    if (!b.nombre) return res.status(400).json({ error: 'El nombre del plato es obligatorio.' })

    const platoId = await withTransaction(async (client) => {
      const ins = await client.query(
        `INSERT INTO platos (nombre, descripcion, categoria, imagen, activo, meal_prep, cocinera)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [
          b.nombre,
          b.descripcion || null,
          b.categoria || null,
          b.imagen || null,
          b.activo !== false,
          b.meal_prep !== false,
          b.cocinera !== false,
        ]
      )
      const id = ins.rows[0].id
      await insertarIngredientes(client, id, b.ingredientes)
      return id
    })

    const creado = await getPlatoConIngredientes(platoId)
    return res.status(201).json({ plato: creado })
  } catch (err) {
    next(err)
  }
})

/**
 * PUT /api/platos/:id  (protegido)
 * Actualiza el plato. Si se envía `ingredientes`, reemplaza la lista completa.
 */
router.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params
    const b = req.body || {}

    const ok = await withTransaction(async (client) => {
      const upd = await client.query(
        `UPDATE platos
            SET nombre      = COALESCE($1, nombre),
                descripcion = COALESCE($2, descripcion),
                categoria   = COALESCE($3, categoria),
                imagen      = COALESCE($4, imagen),
                activo      = COALESCE($5, activo),
                meal_prep   = COALESCE($6, meal_prep),
                cocinera    = COALESCE($7, cocinera)
          WHERE id = $8
        RETURNING id`,
        [
          b.nombre ?? null,
          b.descripcion ?? null,
          b.categoria ?? null,
          b.imagen ?? null,
          b.activo ?? null,
          b.meal_prep ?? null,
          b.cocinera ?? null,
          id,
        ]
      )
      if (upd.rowCount === 0) return false

      if (Array.isArray(b.ingredientes)) {
        await client.query('DELETE FROM ingredientes WHERE plato_id = $1', [id])
        await insertarIngredientes(client, id, b.ingredientes)
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
router.delete('/:id', requireAdmin, async (req, res, next) => {
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
