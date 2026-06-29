import { Router } from 'express'
import { query, withTransaction } from '../models/index.js'
import { authJWT, requireAdmin, optionalUserId } from '../middleware/authJWT.js'
import { sendEstadoEmail, ESTADOS_VALIDOS } from '../services/mailService.js'

const router = Router()

const SERVICIOS_VALIDOS = ['meal_prep', 'cocinera']

function asArray(v) {
  return Array.isArray(v) ? v : []
}

/**
 * POST /api/pedidos  (público)
 * Crea un pedido. REGLA CRÍTICA: verifica y reserva el cupo de la fecha de
 * entrega ANTES de guardar, mediante un UPDATE condicional atómico que actúa
 * como lock optimista:
 *
 *   UPDATE cupos SET pedidos_confirmados = pedidos_confirmados + 1
 *   WHERE fecha = $1 AND activo AND pedidos_confirmados < capacidad_maxima
 *
 * Si dos pedidos llegan a la vez por el último cupo, PostgreSQL serializa el
 * acceso a la fila (bloqueo a nivel de fila) y re-evalúa la condición tras el
 * commit del primero; el segundo no encuentra capacidad y es rechazado (409).
 */
router.post('/', async (req, res, next) => {
  try {
    const b = req.body || {}
    const errores = []
    if (!b.nombre) errores.push('nombre')
    if (!b.email) errores.push('email')
    if (!b.fecha_entrega) errores.push('fecha_entrega')
    if (!SERVICIOS_VALIDOS.includes(b.servicio)) errores.push('servicio (meal_prep|cocinera)')
    if (errores.length) {
      return res.status(400).json({ error: 'Faltan o son inválidos los campos: ' + errores.join(', ') })
    }

    const pedido = await withTransaction(async (client) => {
      // 1) Reservar cupo de forma atómica (lock optimista).
      const reserva = await client.query(
        `UPDATE cupos
            SET pedidos_confirmados = pedidos_confirmados + 1
          WHERE fecha = $1 AND activo = true AND pedidos_confirmados < capacidad_maxima
        RETURNING id, capacidad_maxima, pedidos_confirmados`,
        [b.fecha_entrega]
      )

      if (reserva.rowCount === 0) {
        // Diferenciar el motivo para un mensaje claro.
        const chk = await client.query(
          'SELECT capacidad_maxima, pedidos_confirmados, activo FROM cupos WHERE fecha = $1',
          [b.fecha_entrega]
        )
        const err = new Error()
        err.status = 409
        if (!chk.rows[0]) err.message = 'No hay cupos configurados para esa fecha.'
        else if (!chk.rows[0].activo) err.message = 'La fecha seleccionada no está disponible.'
        else err.message = 'No quedan cupos disponibles para esa fecha.'
        throw err
      }

      // 2) Insertar el pedido (estado inicial: solicitud_recibida). Si el
      //    cliente está logueado, se vincula a su cuenta (usuario_id).
      const insert = await client.query(
        `INSERT INTO pedidos
           (nombre, email, telefono, direccion, comuna, fecha_entrega,
            platos, restricciones, observaciones, tipo_entrega,
            costo_despacho, total, servicio, productos_hornear, lista_compras, usuario_id)
         VALUES
           ($1,$2,$3,$4,$5,$6,
            $7::jsonb,$8::jsonb,$9,$10,
            $11,$12,$13,$14::jsonb,$15::jsonb,$16)
         RETURNING *`,
        [
          b.nombre,
          String(b.email).trim(),
          b.telefono || null,
          b.direccion || null,
          b.comuna || null,
          b.fecha_entrega,
          JSON.stringify(asArray(b.platos)),
          JSON.stringify(asArray(b.restricciones)),
          b.observaciones || null,
          b.tipo_entrega || null,
          Number(b.costo_despacho) || 0,
          Number(b.total) || 0,
          b.servicio,
          JSON.stringify(asArray(b.productos_hornear)),
          JSON.stringify(asArray(b.lista_compras)),
          optionalUserId(req),
        ]
      )
      return insert.rows[0]
    })

    // 3) Disparar el correo de "solicitud_recibida" en SEGUNDO PLANO: el pedido
    //    ya está guardado, así que el correo nunca debe bloquear ni demorar la
    //    confirmación (si SMTP cuelga, el cliente quedaría esperando para siempre).
    sendEstadoEmail(pedido, 'solicitud_recibida').catch((e) =>
      console.error('[mail] no se pudo enviar "solicitud_recibida":', e?.message || e)
    )

    return res.status(201).json({ pedido })
  } catch (err) {
    if (err.status === 409) {
      return res.status(409).json({ error: err.message })
    }
    next(err)
  }
})

/**
 * POST /api/pedidos/consultar  (público)
 * El cliente consulta SU pedido con número + email (verificación simple). Devuelve
 * un subconjunto seguro: estado, fecha, platos, lista de compras, etc. (sin
 * dirección/teléfono completos de otras personas).
 */
router.post('/consultar', async (req, res, next) => {
  try {
    const { id, email } = req.body || {}
    const idNum = Number(id)
    if (!Number.isInteger(idNum) || idNum <= 0 || !email) {
      return res.status(400).json({ error: 'Ingresa el número de pedido y el email con el que pediste.' })
    }
    const { rows } = await query(
      `SELECT id, estado, fecha_entrega, total, servicio, tipo_entrega, comuna,
              costo_despacho, platos, lista_compras, productos_hornear, observaciones, created_at
         FROM pedidos
        WHERE id = $1 AND lower(email) = lower($2)`,
      [idNum, String(email).trim()]
    )
    if (!rows[0]) {
      return res.status(404).json({ error: 'No encontramos un pedido con ese número y email.' })
    }
    return res.json({ pedido: rows[0] })
  } catch (err) {
    next(err)
  }
})

/**
 * GET /api/pedidos  (protegido)
 * Lista pedidos. Filtros opcionales: ?estado=&fecha=&desde=&hasta=&limit=&offset=
 */
router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const { estado, fecha, desde, hasta } = req.query
    const limit = Math.min(Number(req.query.limit) || 100, 500)
    const offset = Number(req.query.offset) || 0

    const where = []
    const params = []
    if (estado) {
      params.push(estado)
      where.push(`estado = $${params.length}`)
    }
    if (fecha) {
      params.push(fecha)
      where.push(`fecha_entrega = $${params.length}`)
    }
    if (desde) {
      params.push(desde)
      where.push(`fecha_entrega >= $${params.length}`)
    }
    if (hasta) {
      params.push(hasta)
      where.push(`fecha_entrega <= $${params.length}`)
    }
    const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : ''
    params.push(limit, offset)

    const { rows } = await query(
      `SELECT * FROM pedidos ${whereSql}
       ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    )
    return res.json({ pedidos: rows, count: rows.length })
  } catch (err) {
    next(err)
  }
})

/**
 * GET /api/pedidos/mis  (cliente autenticado)
 * Reservas del cliente logueado (vinculadas a su usuario_id). Debe ir ANTES
 * de /:id para que no la capture la ruta con parámetro.
 */
router.get('/mis', authJWT, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, estado, fecha_entrega, total, servicio, tipo_entrega, comuna,
              costo_despacho, platos, lista_compras, productos_hornear, observaciones, created_at
         FROM pedidos
        WHERE usuario_id = $1
        ORDER BY fecha_entrega DESC, created_at DESC`,
      [req.admin.sub]
    )
    return res.json({ pedidos: rows, count: rows.length })
  } catch (err) {
    next(err)
  }
})

/**
 * GET /api/pedidos/:id/resumen  (público)
 * Datos mínimos para la página de pago (sin información sensible):
 * monto total, estado y fecha de entrega.
 */
router.get('/:id/resumen', async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT id, total, estado, fecha_entrega FROM pedidos WHERE id = $1',
      [req.params.id]
    )
    if (!rows[0]) return res.status(404).json({ error: 'Pedido no encontrado.' })
    return res.json({ pedido: rows[0] })
  } catch (err) {
    next(err)
  }
})

/**
 * GET /api/pedidos/:id  (protegido)
 */
router.get('/:id', requireAdmin, async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM pedidos WHERE id = $1', [req.params.id])
    if (!rows[0]) return res.status(404).json({ error: 'Pedido no encontrado.' })
    return res.json({ pedido: rows[0] })
  } catch (err) {
    next(err)
  }
})

/**
 * PATCH /api/pedidos/:id/estado  (protegido)
 * Body: { estado }. Cambia el estado y dispara el correo correspondiente.
 */
router.patch('/:id/estado', requireAdmin, async (req, res, next) => {
  try {
    const { estado } = req.body || {}
    if (!ESTADOS_VALIDOS.includes(estado)) {
      return res.status(400).json({
        error: `Estado inválido. Valores permitidos: ${ESTADOS_VALIDOS.join(', ')}`,
      })
    }

    const { rows } = await query(
      'UPDATE pedidos SET estado = $1 WHERE id = $2 RETURNING *',
      [estado, req.params.id]
    )
    if (!rows[0]) return res.status(404).json({ error: 'Pedido no encontrado.' })

    const pedido = rows[0]
    const emailStatus = await sendEstadoEmail(pedido, estado)

    return res.json({ pedido, email: emailStatus })
  } catch (err) {
    next(err)
  }
})

/**
 * PATCH /api/pedidos/:id  (protegido)
 * Edición general del pedido desde el panel admin (datos, entrega y platos).
 * Sólo actualiza los campos presentes en el body. No reajusta cupos.
 */
router.patch('/:id', requireAdmin, async (req, res, next) => {
  try {
    const b = req.body || {}
    const sets = []
    const params = []
    const add = (col, val, cast = '') => {
      params.push(val)
      sets.push(`${col} = $${params.length}${cast}`)
    }

    if (b.nombre !== undefined) add('nombre', String(b.nombre).trim())
    if (b.email !== undefined) add('email', String(b.email).trim())
    if (b.telefono !== undefined) add('telefono', b.telefono || null)
    if (b.direccion !== undefined) add('direccion', b.direccion || null)
    if (b.comuna !== undefined) add('comuna', b.comuna || null)
    if (b.fecha_entrega !== undefined) add('fecha_entrega', b.fecha_entrega)
    if (b.tipo_entrega !== undefined) add('tipo_entrega', b.tipo_entrega || null)
    if (b.observaciones !== undefined) add('observaciones', b.observaciones || null)
    if (b.costo_despacho !== undefined) add('costo_despacho', Number(b.costo_despacho) || 0)
    if (b.total !== undefined) add('total', Number(b.total) || 0)
    if (b.servicio !== undefined) {
      if (!SERVICIOS_VALIDOS.includes(b.servicio)) {
        return res.status(400).json({ error: 'servicio inválido (meal_prep|cocinera).' })
      }
      add('servicio', b.servicio)
    }
    if (b.platos !== undefined) add('platos', JSON.stringify(asArray(b.platos)), '::jsonb')
    if (b.restricciones !== undefined) add('restricciones', JSON.stringify(asArray(b.restricciones)), '::jsonb')
    if (b.productos_hornear !== undefined) add('productos_hornear', JSON.stringify(asArray(b.productos_hornear)), '::jsonb')
    if (b.lista_compras !== undefined) add('lista_compras', JSON.stringify(asArray(b.lista_compras)), '::jsonb')

    if (!sets.length) return res.status(400).json({ error: 'No hay campos para actualizar.' })

    params.push(req.params.id)
    const { rows } = await query(
      `UPDATE pedidos SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    )
    if (!rows[0]) return res.status(404).json({ error: 'Pedido no encontrado.' })
    return res.json({ pedido: rows[0] })
  } catch (err) {
    next(err)
  }
})

export default router
