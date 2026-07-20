import { Router } from 'express'
import { query } from '../models/index.js'
import { requireAdmin } from '../middleware/authJWT.js'
import { tokenValido } from '../utils/encuestaToken.js'

const router = Router()
const COMMENT_MAX = 500

/**
 * GET /api/encuestas  (admin) — listado de respuestas con filtros.
 * ?servicio=&desde=&hasta=&rating=&recomienda=si|no&q=
 */
router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const { servicio, desde, hasta, rating, recomienda, q } = req.query
    const where = []
    const params = []
    if (servicio) { params.push(servicio); where.push(`p.servicio = $${params.length}`) }
    if (desde) { params.push(desde); where.push(`e.responded_at >= $${params.length}`) }
    if (hasta) { params.push(`${hasta}T23:59:59.999`); where.push(`e.responded_at <= $${params.length}`) }
    if (rating) { params.push(parseInt(rating, 10) || 0); where.push(`e.satisfaction_rating = $${params.length}`) }
    if (recomienda === 'si') { params.push(true); where.push(`e.would_recommend = $${params.length}`) }
    if (recomienda === 'no') { params.push(false); where.push(`e.would_recommend = $${params.length}`) }
    if (q) {
      params.push(`%${q}%`)
      const n = params.length
      where.push(`(p.nombre ILIKE $${n} OR p.email ILIKE $${n} OR CAST(e.order_id AS TEXT) ILIKE $${n})`)
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
    const { rows } = await query(
      `SELECT e.id, e.order_id, e.customer_id, e.satisfaction_rating, e.would_recommend,
              e.improvement_comment, e.responded_at,
              p.nombre AS cliente, p.email, p.servicio
         FROM encuestas_satisfaccion e
         JOIN pedidos p ON p.id = e.order_id
         ${whereSql}
        ORDER BY e.responded_at DESC
        LIMIT 500`,
      params
    )
    return res.json({ encuestas: rows, count: rows.length })
  } catch (err) {
    next(err)
  }
})

/**
 * GET /api/encuestas/stats  (admin) — métricas agregadas.
 * Filtra por servicio + rango de fechas (no por rating/recomienda, para no
 * sesgar el promedio). Devuelve promedio, % que recomienda, distribución y
 * evolución mensual.
 */
router.get('/stats', requireAdmin, async (req, res, next) => {
  try {
    const { servicio, desde, hasta } = req.query
    const where = []
    const params = []
    const add = (col, op, val) => {
      params.push(val)
      where.push(`${col} ${op} $${params.length}`)
    }
    if (servicio) add('p.servicio', '=', servicio)
    if (desde) add('e.responded_at', '>=', desde)
    if (hasta) add('e.responded_at', '<=', `${hasta}T23:59:59.999`)
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''

    const base = `FROM encuestas_satisfaccion e JOIN pedidos p ON p.id = e.order_id ${whereSql}`

    const resumen = await query(
      `SELECT COUNT(*)::int AS total,
              COALESCE(AVG(e.satisfaction_rating), 0)::numeric(10,2) AS promedio,
              COALESCE(SUM(CASE WHEN e.would_recommend THEN 1 ELSE 0 END), 0)::int AS recomiendan
         ${base}`,
      params
    )
    const distribucion = await query(
      `SELECT e.satisfaction_rating AS rating, COUNT(*)::int AS total
         ${base}
        GROUP BY e.satisfaction_rating`,
      params
    )
    const evolucion = await query(
      `SELECT to_char(date_trunc('month', e.responded_at), 'YYYY-MM') AS periodo,
              COUNT(*)::int AS total,
              AVG(e.satisfaction_rating)::numeric(10,2) AS promedio
         ${base}
        GROUP BY 1
        ORDER BY 1`,
      params
    )

    const r = resumen.rows[0] || { total: 0, promedio: 0, recomiendan: 0 }
    const total = Number(r.total) || 0
    const dist = {}
    for (let i = 1; i <= 5; i++) dist[i] = 0
    for (const row of distribucion.rows) dist[row.rating] = Number(row.total)

    return res.json({
      total,
      promedio: Number(r.promedio) || 0,
      recomiendan: Number(r.recomiendan) || 0,
      pct_recomienda: total ? Math.round((Number(r.recomiendan) / total) * 100) : 0,
      distribucion: dist,
      evolucion: evolucion.rows.map((e) => ({
        periodo: e.periodo,
        total: Number(e.total),
        promedio: Number(e.promedio),
      })),
    })
  } catch (err) {
    next(err)
  }
})

/**
 * GET /api/encuestas/:orderId?token=...  (público) — estado de la encuesta para
 * la página del cliente (¿enlace válido? ¿ya respondida?).
 */
router.get('/:orderId', async (req, res, next) => {
  try {
    const orderId = parseInt(req.params.orderId, 10)
    if (!Number.isInteger(orderId) || orderId <= 0 || !tokenValido(orderId, req.query.token)) {
      return res.status(403).json({ error: 'El enlace de la encuesta no es válido.' })
    }
    const ped = await query('SELECT id, nombre FROM pedidos WHERE id = $1', [orderId])
    if (!ped.rows[0]) return res.status(404).json({ error: 'Pedido no encontrado.' })
    const ya = await query('SELECT 1 FROM encuestas_satisfaccion WHERE order_id = $1', [orderId])
    return res.json({
      valido: true,
      yaRespondida: ya.rowCount > 0,
      nombre: (ped.rows[0].nombre || '').split(' ')[0] || '',
    })
  } catch (err) {
    next(err)
  }
})

/**
 * POST /api/encuestas/:orderId  (público) — guarda la respuesta.
 * Body: { token, satisfaction_rating, would_recommend, improvement_comment? }
 */
router.post('/:orderId', async (req, res, next) => {
  try {
    const orderId = parseInt(req.params.orderId, 10)
    const b = req.body || {}
    if (!Number.isInteger(orderId) || orderId <= 0 || !tokenValido(orderId, b.token)) {
      return res.status(403).json({ error: 'El enlace de la encuesta no es válido.' })
    }
    const rating = parseInt(b.satisfaction_rating, 10)
    if (!(rating >= 1 && rating <= 5)) {
      return res.status(400).json({ error: 'La calificación debe ser de 1 a 5 estrellas.' })
    }
    if (typeof b.would_recommend !== 'boolean') {
      return res.status(400).json({ error: 'Indica si recomendarías el servicio.' })
    }
    const comment =
      typeof b.improvement_comment === 'string' && b.improvement_comment.trim()
        ? b.improvement_comment.trim().slice(0, COMMENT_MAX)
        : null

    const ped = await query('SELECT id, usuario_id FROM pedidos WHERE id = $1', [orderId])
    if (!ped.rows[0]) return res.status(404).json({ error: 'Pedido no encontrado.' })

    const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip || null
    const ua = req.headers['user-agent'] || null

    try {
      const { rows } = await query(
        `INSERT INTO encuestas_satisfaccion
           (order_id, customer_id, satisfaction_rating, would_recommend, improvement_comment, ip_address, user_agent)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         RETURNING id`,
        [orderId, ped.rows[0].usuario_id || null, rating, b.would_recommend, comment, ip, ua]
      )
      return res.status(201).json({ ok: true, id: rows[0].id })
    } catch (err) {
      // 23505 = unique_violation → ya existe respuesta para este pedido.
      if (err.code === '23505') {
        return res.status(409).json({ error: 'Esta encuesta ya fue respondida. ¡Gracias!' })
      }
      throw err
    }
  } catch (err) {
    next(err)
  }
})

export default router
