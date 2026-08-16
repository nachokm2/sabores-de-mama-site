import { Router } from 'express'
import { query, withTransaction } from '../models/index.js'
import { authJWT, requireAdmin, optionalUserId } from '../middleware/authJWT.js'
import { sendEstadoEmail, ESTADOS_VALIDOS } from '../services/mailService.js'
import { resumenToken, resumenTokenValido } from '../utils/tokens.js'
import { calcularTotal } from '../services/pricing.js'

const router = Router()

const SERVICIOS_VALIDOS = ['meal_prep', 'cocinera']

function asArray(v) {
  return Array.isArray(v) ? v : []
}

// Columnas de cupo por servicio (whitelist). Cada servicio tiene su propia
// capacidad y confirmados, independientes (igual que las comunas).
function cuposCols(servicio) {
  return servicio === 'cocinera'
    ? { cap: 'capacidad_cocinera', conf: 'confirmados_cocinera', act: 'activo_cocinera' }
    : { cap: 'capacidad_meal_prep', conf: 'confirmados_meal_prep', act: 'activo_meal_prep' }
}

/**
 * Id de pedido validado. Sin esto, un id no numérico llegaba tal cual a
 * PostgreSQL, que respondía con el error 22P02 y el servidor lo convertía en un
 * 500: un error de cliente presentado como una falla del servidor, que además
 * ensucia los logs y esconde los 500 de verdad.
 */
function pedidoId(req, res) {
  const id = parseInt(req.params.id, 10)
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'Número de pedido inválido.' })
    return null
  }
  return id
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

    // El total y el costo de despacho se calculan ACÁ, no se aceptan del cliente.
    //
    // Antes sólo se validaba un piso (total >= precio base). Eso dejaba pasar la
    // manipulación rentable: un pedido con despacho y adicionales enviado con
    // `total` igual al precio base pasaba el filtro, y como el correo de
    // instrucciones de transferencia se arma con ese mismo campo, la clienta
    // recibía y confirmaba a mano el monto adulterado.
    const precio = await calcularTotal(b)
    if (Number(b.total) !== precio.total) {
      // No se rechaza: el cálculo del servidor manda. Se registra para detectar
      // si el frontend y el backend se desincronizan (un precio cambiado en
      // Ajustes a mitad del flujo produce esto de forma legítima).
      console.warn(
        `[pedidos] total del cliente ${Number(b.total) || 0} != calculado ${precio.total}`,
        precio.detalle
      )
    }

    const c = cuposCols(b.servicio)
    const pedido = await withTransaction(async (client) => {
      // 1) Reservar cupo DEL SERVICIO de forma atómica (lock optimista).
      const reserva = await client.query(
        `UPDATE cupos
            SET ${c.conf} = COALESCE(${c.conf}, 0) + 1
          WHERE fecha = $1
            AND ${c.cap} IS NOT NULL
            AND COALESCE(${c.act}, false) = true
            AND COALESCE(${c.conf}, 0) < ${c.cap}
        RETURNING id`,
        [b.fecha_entrega]
      )

      if (reserva.rowCount === 0) {
        // Diferenciar el motivo para un mensaje claro.
        const chk = await client.query(
          `SELECT ${c.cap} AS cap, COALESCE(${c.act}, false) AS act FROM cupos WHERE fecha = $1`,
          [b.fecha_entrega]
        )
        const err = new Error()
        err.status = 409
        if (!chk.rows[0] || chk.rows[0].cap === null) err.message = 'No hay cupos configurados para esa fecha.'
        else if (!chk.rows[0].act) err.message = 'La fecha seleccionada no está disponible.'
        else err.message = 'No quedan cupos disponibles para esa fecha.'
        throw err
      }

      // 2) Insertar el pedido (estado inicial: solicitud_recibida). Si el
      //    cliente está logueado, se vincula a su cuenta (usuario_id).
      const insert = await client.query(
        `INSERT INTO pedidos
           (nombre, email, telefono, direccion, comuna, fecha_entrega,
            platos, restricciones, observaciones, tipo_entrega,
            costo_despacho, total, servicio, productos_hornear, lista_compras, personas, usuario_id,
            adicionales)
         VALUES
           ($1,$2,$3,$4,$5,$6,
            $7::jsonb,$8::jsonb,$9,$10,
            $11,$12,$13,$14::jsonb,$15::jsonb,$16,$17,
            $18::jsonb)
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
          precio.costo_despacho,
          precio.total,
          b.servicio,
          JSON.stringify(asArray(b.productos_hornear)),
          JSON.stringify(asArray(b.lista_compras)),
          Number.isInteger(Number(b.personas)) && Number(b.personas) > 0 ? Number(b.personas) : null,
          optionalUserId(req),
          JSON.stringify(asArray(b.adicionales)),
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

    // `resumen_token` lo usa el frontend para armar la URL de la página de pago
    // (/pago/:id?t=…), que es lo único que puede leer el resumen del pedido.
    return res.status(201).json({ pedido, resumen_token: resumenToken(pedido.id) })
  } catch (err) {
    // 409: sin cupo. 400: el pedido no es despachable (comuna sin cobertura),
    // que lo levanta el cálculo de precio.
    if (err.status === 409 || err.status === 400) {
      return res.status(err.status).json({ error: err.message })
    }
    next(err)
  }
})

/**
 * POST /api/pedidos/admin  (admin) — alta MANUAL de una reserva con todos los
 * campos. A diferencia del alta pública, NO bloquea por cupo (override del
 * admin): si existe un cupo para la fecha/servicio, suma 1 (best-effort) para
 * mantener la disponibilidad al día, pero igual crea la reserva si no hay cupo o
 * está lleno. Si el email coincide con una cuenta de cliente, la vincula para
 * que aparezca en su portal. El correo al cliente sólo se envía si se pide.
 */
router.post('/admin', requireAdmin, async (req, res, next) => {
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

    const c = cuposCols(b.servicio)
    const pedido = await withTransaction(async (client) => {
      // Vincula a la cuenta del cliente si su email ya existe (para su portal).
      const u = await client.query(
        "SELECT id FROM admin_users WHERE lower(email) = lower($1) AND rol = 'cliente'",
        [String(b.email).trim()]
      )
      const usuarioId = u.rows[0]?.id || null

      const insert = await client.query(
        `INSERT INTO pedidos
           (nombre, email, telefono, direccion, comuna, fecha_entrega,
            platos, restricciones, observaciones, tipo_entrega,
            costo_despacho, total, servicio, productos_hornear, lista_compras, personas, usuario_id,
            adicionales)
         VALUES
           ($1,$2,$3,$4,$5,$6,
            $7::jsonb,$8::jsonb,$9,$10,
            $11,$12,$13,$14::jsonb,$15::jsonb,$16,$17,
            $18::jsonb)
         RETURNING *`,
        [
          String(b.nombre).trim(),
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
          Number.isInteger(Number(b.personas)) && Number(b.personas) > 0 ? Number(b.personas) : null,
          usuarioId,
          JSON.stringify(asArray(b.adicionales)),
        ]
      )

      // Best-effort: descuenta cupo del servicio si está configurado para esa
      // fecha (sin tope: el admin puede sobre-reservar a propósito).
      await client.query(
        `UPDATE cupos SET ${c.conf} = COALESCE(${c.conf}, 0) + 1 WHERE fecha = $1 AND ${c.cap} IS NOT NULL`,
        [b.fecha_entrega]
      )
      return insert.rows[0]
    })

    if (b.enviar_correo) {
      sendEstadoEmail(pedido, 'solicitud_recibida').catch((e) =>
        console.error('[mail] no se pudo enviar "solicitud_recibida" (alta manual):', e?.message || e)
      )
    }

    return res.status(201).json({ pedido, resumen_token: resumenToken(pedido.id) })
  } catch (err) {
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
              costo_despacho, platos, lista_compras, productos_hornear, adicionales, personas, observaciones, foto_entrega, fotos_entrega, created_at
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
    const { estado, fecha, desde, hasta, servicio } = req.query
    const limit = Math.min(Number(req.query.limit) || 100, 500)
    const offset = Number(req.query.offset) || 0

    const where = []
    const params = []
    if (estado) {
      params.push(estado)
      where.push(`estado = $${params.length}`)
    }
    if (servicio) {
      params.push(servicio)
      where.push(`servicio = $${params.length}`)
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
              costo_despacho, platos, lista_compras, productos_hornear, adicionales, personas, observaciones, foto_entrega, fotos_entrega, created_at
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
 * GET /api/pedidos/:id/resumen?token=...  (público, pero con token)
 * Datos mínimos para la página de pago: monto total, estado y fecha de entrega.
 *
 * Exige el token HMAC del pedido. Antes era abierto y `:id` es secuencial, así
 * que cualquiera podía recorrer 1,2,3… y leer el monto, estado y fecha de TODOS
 * los pedidos (facturación y volumen de negocio). El token lo entrega la API al
 * crear el pedido y viaja en la URL de la página de pago.
 */
router.get('/:id/resumen', async (req, res, next) => {
  try {
    // Validar el id antes de la consulta: un id no numérico llegaba a PostgreSQL
    // y provocaba un 500 (error 22P02) en vez de un 400 limpio.
    const id = parseInt(req.params.id, 10)
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Número de pedido inválido.' })
    }
    if (!resumenTokenValido(id, req.query.token)) {
      return res.status(403).json({ error: 'El enlace del pedido no es válido.' })
    }
    const { rows } = await query(
      'SELECT id, total, estado, fecha_entrega FROM pedidos WHERE id = $1',
      [id]
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
    const id = pedidoId(req, res)
    if (id === null) return
    const { rows } = await query('SELECT * FROM pedidos WHERE id = $1', [id])
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
    const b = req.body || {}
    const { estado } = b
    if (!ESTADOS_VALIDOS.includes(estado)) {
      return res.status(400).json({
        error: `Estado inválido. Valores permitidos: ${ESTADOS_VALIDOS.join(', ')}`,
      })
    }

    // Estado actual + fotos ya cargadas (para el enforcement de "en_delivery").
    const id = pedidoId(req, res)
    if (id === null) return
    const actual = await query('SELECT foto_entrega, fotos_entrega FROM pedidos WHERE id = $1', [id])
    if (!actual.rows[0]) return res.status(404).json({ error: 'Pedido no encontrado.' })

    // Fotos de la entrega. Se aceptan las dos formas: `fotos_entrega` (array, lo
    // que manda el panel ahora) y `foto_entrega` (string), que se conserva para
    // no romper a ningún cliente de la API que siga enviando una sola.
    const limpiarKeys = (v) =>
      (Array.isArray(v) ? v : [v])
        .map((k) => (typeof k === 'string' ? k.trim() : ''))
        .filter(Boolean)

    const fotosBody = [...limpiarKeys(b.fotos_entrega), ...limpiarKeys(b.foto_entrega)]
    const fotosPrevias = [...limpiarKeys(actual.rows[0].fotos_entrega), ...limpiarKeys(actual.rows[0].foto_entrega)]
    // Las nuevas reemplazan a las previas (el panel manda el conjunto completo);
    // si no vienen fotos, se conservan las que ya estaban.
    const finalFotos = [...new Set(fotosBody.length ? fotosBody : fotosPrevias)]
    // `foto_entrega` sigue guardando la primera: los pedidos antiguos y cualquier
    // lectura de esa columna siguen funcionando.
    const finalFoto = finalFotos[0] || null

    // Regla: no se puede marcar "En delivery" sin una fotografía del pedido.
    if (estado === 'en_delivery' && !finalFotos.length) {
      return res.status(422).json({
        error: 'Debes subir al menos una fotografía del pedido antes de marcarlo "En delivery".',
      })
    }

    // Plazo (fecha y hora límite) para enviar los ingredientes: lo ingresa la
    // admin al marcar "pagado". Si no viene, se conserva el existente (COALESCE).
    const plazoBody =
      typeof b.plazo_ingredientes === 'string' && b.plazo_ingredientes.trim()
        ? b.plazo_ingredientes.trim()
        : null

    const { rows } = await query(
      `UPDATE pedidos
          SET estado = $1, foto_entrega = $2, fotos_entrega = $3::jsonb,
              plazo_ingredientes = COALESCE($4, plazo_ingredientes)
        WHERE id = $5 RETURNING *`,
      [estado, finalFoto, JSON.stringify(finalFotos), plazoBody, id]
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
    if (b.foto_entrega !== undefined) add('foto_entrega', b.foto_entrega || null)
    if (b.fotos_entrega !== undefined) add('fotos_entrega', JSON.stringify(asArray(b.fotos_entrega)), '::jsonb')
    if (b.personas !== undefined) {
      add('personas', Number.isInteger(Number(b.personas)) && Number(b.personas) > 0 ? Number(b.personas) : null)
    }
    if (b.servicio !== undefined) {
      if (!SERVICIOS_VALIDOS.includes(b.servicio)) {
        return res.status(400).json({ error: 'servicio inválido (meal_prep|cocinera).' })
      }
      add('servicio', b.servicio)
    }
    if (b.platos !== undefined) add('platos', JSON.stringify(asArray(b.platos)), '::jsonb')
    if (b.restricciones !== undefined) add('restricciones', JSON.stringify(asArray(b.restricciones)), '::jsonb')
    if (b.productos_hornear !== undefined) add('productos_hornear', JSON.stringify(asArray(b.productos_hornear)), '::jsonb')
    if (b.adicionales !== undefined) add('adicionales', JSON.stringify(asArray(b.adicionales)), '::jsonb')
    if (b.lista_compras !== undefined) add('lista_compras', JSON.stringify(asArray(b.lista_compras)), '::jsonb')

    if (!sets.length) return res.status(400).json({ error: 'No hay campos para actualizar.' })

    const id = pedidoId(req, res)
    if (id === null) return
    params.push(id)
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
