import { Router } from 'express'
import { query } from '../models/index.js'
import { authJWT } from '../middleware/authJWT.js'
import { sendEstadoEmail, ESTADOS_VALIDOS } from '../services/mailService.js'

const router = Router()

/**
 * POST /api/correos/pedido/:id  (protegido)
 * Dispara manualmente el correo de un pedido.
 * Body opcional: { estado } — si se omite, usa el estado actual del pedido.
 * Útil para reenviar (p. ej. datos bancarios) sin cambiar el estado.
 */
router.post('/pedido/:id', authJWT, async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM pedidos WHERE id = $1', [req.params.id])
    const pedido = rows[0]
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado.' })

    const estado = req.body?.estado || pedido.estado
    if (!ESTADOS_VALIDOS.includes(estado)) {
      return res.status(400).json({
        error: `Estado inválido. Valores permitidos: ${ESTADOS_VALIDOS.join(', ')}`,
      })
    }

    const result = await sendEstadoEmail(pedido, estado)
    if (result.ok) return res.json({ ok: true, estado, email: result })
    return res.status(result.skipped ? 200 : 502).json({ ok: false, estado, email: result })
  } catch (err) {
    next(err)
  }
})

export default router
