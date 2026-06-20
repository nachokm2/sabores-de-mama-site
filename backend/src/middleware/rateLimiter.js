/**
 * Rate limiter en memoria (ventana fija) — sin dependencias externas.
 *
 * Limita las peticiones por IP. Por defecto: 10 req/min, usado en las rutas de
 * pedidos. La ventana es fija: se cuentan las peticiones dentro de cada bloque
 * de `windowMs` y se reinicia al expirar.
 *
 * Nota: el almacenamiento es por proceso. Para múltiples instancias detrás de un
 * balanceador conviene un store compartido (Redis). Para un único servicio en
 * Railway esto es suficiente.
 */
export function createRateLimiter({ windowMs = 60_000, max = 10 } = {}) {
  /** @type {Map<string, { count: number, resetAt: number }>} */
  const hits = new Map()

  // Limpieza periódica de entradas expiradas para no acumular memoria.
  const cleanup = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(key)
    }
  }, windowMs)
  if (typeof cleanup.unref === 'function') cleanup.unref()

  // Limpia el contador (útil para aislar tests).
  function reset() {
    hits.clear()
  }

  function rateLimiter(req, res, next) {
    // `req.ip` requiere app.set('trust proxy', 1) detrás de un proxy (Railway).
    const key = req.ip || req.socket?.remoteAddress || 'desconocido'
    const now = Date.now()

    let entry = hits.get(key)
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs }
      hits.set(key, entry)
    }

    entry.count += 1
    const remaining = Math.max(0, max - entry.count)
    const resetSeconds = Math.ceil((entry.resetAt - now) / 1000)

    res.set('X-RateLimit-Limit', String(max))
    res.set('X-RateLimit-Remaining', String(remaining))
    res.set('X-RateLimit-Reset', String(resetSeconds))

    if (entry.count > max) {
      res.set('Retry-After', String(resetSeconds))
      return res.status(429).json({
        error: 'Demasiadas solicitudes. Intenta nuevamente en un momento.',
        retryAfter: resetSeconds,
      })
    }

    next()
  }

  rateLimiter.reset = reset
  return rateLimiter
}

// Limiter por defecto para las rutas de pedidos: 10 req/min por IP.
// El límite es configurable con PEDIDOS_RATE_LIMIT (p. ej. subirlo para E2E).
export const pedidosRateLimiter = createRateLimiter({
  windowMs: 60_000,
  max: Number(process.env.PEDIDOS_RATE_LIMIT) || 10,
})

export default pedidosRateLimiter
