/**
 * Rate limiter en memoria (ventana fija) — sin dependencias externas.
 *
 * Limita las peticiones por IP. Por defecto: 10 req/min, usado en las rutas de
 * pedidos. La ventana es fija: se cuentan las peticiones dentro de cada bloque
 * de `windowMs` y se reinicia al expirar.
 *
 * B7 de la auditoría · el contador es POR PROCESO, y se deja así a propósito.
 *
 * Con N instancias detrás de un balanceador el límite efectivo se multiplica por
 * N: 10 req/min por instancia son 30 si hay tres. El arreglo correcto es un store
 * compartido (Redis), pero eso significa una dependencia de infraestructura nueva
 * —otro servicio que puede caerse y que, si se cae, tumbaría los endpoints que
 * protege— para un despliegue que hoy corre en una sola instancia.
 *
 * Cuándo revisarlo: al escalar el servicio a más de una instancia. Ahí el límite
 * deja de significar lo que dice.
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

// Limiter para autenticación (login/registro/recuperar/reset): protege contra
// fuerza bruta y credential stuffing. 15 intentos por IP cada 15 min por defecto
// (configurable con AUTH_RATE_LIMIT). En tests se desactiva de facto (límite alto)
// para no interferir con las suites.
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60_000,
  // Solo se restringe en producción (Railway). En dev/test/CI queda holgado
  // salvo que se fije AUTH_RATE_LIMIT explícitamente (evita 429 en el e2e).
  max:
    Number(process.env.AUTH_RATE_LIMIT) ||
    (process.env.NODE_ENV === 'production' ? 15 : 100000),
})

export default pedidosRateLimiter
