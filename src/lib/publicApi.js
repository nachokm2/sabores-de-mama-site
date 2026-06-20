// Cliente público de la API (sitio, sin autenticación).
// Configurable con VITE_API_URL. Los llamadores deben manejar errores con
// fallback a datos estáticos para que el sitio nunca se rompa si el backend
// está caído.

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

async function request(path, { method = 'GET', body } = {}) {
  let res
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('No se pudo conectar con el servidor.', 0)
  }

  let data = null
  const text = await res.text()
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = { raw: text }
    }
  }
  if (!res.ok) {
    throw new ApiError(data?.error || `Error ${res.status}`, res.status, data)
  }
  return data
}

/** Platos activos con ingredientes. Devuelve [] si algo falla (el llamador hace fallback). */
export async function getPlatos() {
  const data = await request('/platos')
  return data?.platos || []
}

/** Fechas futuras con cupos disponibles. */
export async function getCupos() {
  const data = await request('/cupos')
  return data?.cupos || []
}

/** Crea un pedido (reserva cupo + dispara correo en el backend). */
export async function createPedido(payload) {
  const data = await request('/pedidos', { method: 'POST', body: payload })
  return data?.pedido
}

/** Productos para hornear activos (add-on opcional). */
export async function getProductosHornear() {
  const data = await request('/productos-hornear')
  return data?.productos || []
}

/** Ingredientes consolidados de un conjunto de platos (para la lista de compras). */
export async function getIngredientesDePlatos(ids = []) {
  if (!ids.length) return []
  const qs = encodeURIComponent(ids.join(','))
  const data = await request(`/platos/ingredientes?platos=${qs}`)
  return data?.ingredientes || []
}

/** Resumen público de un pedido (monto/estado/fecha) para la página de pago. */
export async function getPedidoResumen(id) {
  const data = await request(`/pedidos/${id}/resumen`)
  return data?.pedido
}
