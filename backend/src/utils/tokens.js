import crypto from 'node:crypto'

/**
 * Tokens deterministas por pedido (HMAC-SHA256, 32 hex). No se guardan en la BD:
 * se recalculan y se validan.
 *
 * Cada propósito lleva su PREFIJO en el mensaje firmado, así el token de una
 * encuesta nunca sirve como token de resumen aunque compartan el secreto. Se
 * puede aislar más aún definiendo SURVEY_SECRET / RESUMEN_SECRET por separado.
 *
 * OJO: si defines SURVEY_SECRET o RESUMEN_SECRET, los enlaces ya enviados por
 * correo con el secreto anterior dejan de validar.
 */
/**
 * Secreto base. Antes caía a la cadena literal 'sabores-token-secret' si faltaba
 * JWT_SECRET: como este repositorio es público, ese default convertía todos los
 * tokens en forjables por cualquiera —anulando el cierre del IDOR del resumen y
 * permitiendo responder encuestas ajenas—, y lo hacía en silencio. Ahora falla
 * ruidosamente: es preferible un 500 visible a un token que no protege nada.
 */
const fallback = () => {
  const secreto = process.env.JWT_SECRET
  if (!secreto) {
    throw new Error(
      'Falta JWT_SECRET: no se pueden firmar los tokens de pedido/encuesta. ' +
        'Defínelo (o define SURVEY_SECRET / RESUMEN_SECRET) en las variables de entorno.'
    )
  }
  return secreto
}
const secretoEncuesta = () => process.env.SURVEY_SECRET || fallback()
const secretoResumen = () => process.env.RESUMEN_SECRET || fallback()

function firmar(secreto, mensaje) {
  return crypto.createHmac('sha256', secreto).update(mensaje).digest('hex').slice(0, 32)
}

/** Comparación en tiempo constante (evita filtrar el token byte a byte). */
function comparar(recibido, esperado) {
  if (!recibido || typeof recibido !== 'string') return false
  try {
    const a = Buffer.from(recibido)
    const b = Buffer.from(esperado)
    return a.length === b.length && crypto.timingSafeEqual(a, b)
  } catch {
    return false
  }
}

/** Token del enlace de la encuesta post-entrega. */
export function surveyToken(orderId) {
  return firmar(secretoEncuesta(), `encuesta:${orderId}`)
}
export function tokenValido(orderId, token) {
  return comparar(token, surveyToken(orderId))
}

/**
 * Token del resumen público de un pedido (página de pago). Sin él, `:id` era
 * enumerable y cualquiera podía leer el monto, estado y fecha de TODOS los
 * pedidos recorriendo ids consecutivos.
 */
export function resumenToken(orderId) {
  return firmar(secretoResumen(), `resumen:${orderId}`)
}
export function resumenTokenValido(orderId, token) {
  return comparar(token, resumenToken(orderId))
}
