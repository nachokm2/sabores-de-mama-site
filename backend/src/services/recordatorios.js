import { query } from '../models/index.js'
import { sendRecordatorioEncuesta } from './mailService.js'

// Horas después de la entrega en que se manda el recordatorio de la encuesta.
const horasEspera = () => Number(process.env.ENCUESTA_RECORDATORIO_HORAS) || 48
const UNA_HORA = 60 * 60_000

/**
 * Manda el recordatorio de la encuesta a los pedidos entregados hace más de
 * `horasEspera()` que aún no la respondieron. Uno solo por pedido.
 *
 * Los pedidos se "reclaman" en el mismo UPDATE que los marca: si hubiera dos
 * instancias del backend, la segunda ya no los encuentra y no se duplica el
 * correo. La contracara es que un envío fallido no se reintenta, que es
 * preferible a insistirle al cliente. El tope de 14 días evita escribirle a
 * quien recibió hace mucho si el servidor estuvo caído.
 */
export async function enviarRecordatoriosEncuesta() {
  const { rows } = await query(
    `UPDATE pedidos p
        SET encuesta_recordatorio_en = now()
      WHERE p.estado = 'entregado'
        AND p.entregado_en IS NOT NULL
        AND p.entregado_en <= now() - make_interval(hours => $1)
        AND p.entregado_en >  now() - interval '14 days'
        AND p.encuesta_recordatorio_en IS NULL
        AND NOT EXISTS (SELECT 1 FROM encuestas_satisfaccion e WHERE e.order_id = p.id)
      RETURNING p.*`,
    [horasEspera()]
  )
  for (const pedido of rows) {
    await sendRecordatorioEncuesta(pedido)
  }
  return rows.length
}

/**
 * Revisa cada hora si hay recordatorios pendientes (la primera vez, un minuto
 * después de arrancar). Se desactiva con ENCUESTA_RECORDATORIOS=false.
 */
export function iniciarRecordatoriosEncuesta() {
  if (process.env.ENCUESTA_RECORDATORIOS === 'false') return
  const revisar = () =>
    enviarRecordatoriosEncuesta()
      .then((n) => n && console.log(`[encuestas] ${n} recordatorio(s) de encuesta enviados.`))
      .catch((err) => console.error('[encuestas] falló la revisión de recordatorios:', err?.message || err))
  setTimeout(revisar, 60_000).unref()
  setInterval(revisar, UNA_HORA).unref()
}
