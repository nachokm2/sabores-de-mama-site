import crypto from 'crypto'

// Token determinista por pedido para el enlace de la encuesta. No se guarda: se
// recalcula y valida. Es difícil de adivinar (HMAC con secreto) y la unicidad de
// respuesta la garantiza el UNIQUE(order_id) en la tabla.
const SECRET =
  process.env.SURVEY_SECRET || process.env.JWT_SECRET || 'sabores-encuesta-secret'

export function surveyToken(orderId) {
  return crypto
    .createHmac('sha256', SECRET)
    .update(`encuesta:${orderId}`)
    .digest('hex')
    .slice(0, 32)
}

export function tokenValido(orderId, token) {
  if (!token || typeof token !== 'string') return false
  const esperado = surveyToken(orderId)
  try {
    const a = Buffer.from(token)
    const b = Buffer.from(esperado)
    return a.length === b.length && crypto.timingSafeEqual(a, b)
  } catch {
    return false
  }
}
