// Cliente de la API admin + utilidades de autenticación (JWT en localStorage).
//
// Configura la URL del backend con VITE_API_URL (ej: https://api.saboresdemama.com/api).
// Por defecto apunta al backend local en desarrollo.

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
const TOKEN_KEY = 'sdm_admin_token'

// ── Manejo de token ─────────────────────────────────────────────────────────
export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

/** Decodifica el payload de un JWT (sin verificar la firma; sólo para leer exp). */
export function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(json)
  } catch {
    return null
  }
}

/** ¿Hay un token presente y NO expirado? */
export function isTokenValid(token = getToken()) {
  if (!token) return false
  const payload = parseJwt(token)
  if (!payload || !payload.exp) return false
  // exp viene en segundos; comparar con ahora (con 5s de margen).
  return payload.exp * 1000 > Date.now() + 5000
}

/** Datos del admin actual (extraídos del token). */
export function getAdminUser() {
  const payload = parseJwt(getToken() || '')
  if (!payload) return null
  return { id: payload.sub, email: payload.email, nombre: payload.nombre }
}

// ── Fetch genérico ──────────────────────────────────────────────────────────
async function apiFetch(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (auth) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let res
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
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
    // Token inválido/expirado → limpiar para forzar re-login.
    if (res.status === 401) clearToken()
    throw new ApiError(data?.error || `Error ${res.status}`, res.status, data)
  }
  return data
}

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

// ── Endpoints ───────────────────────────────────────────────────────────────
export async function login(email, password) {
  const data = await apiFetch('/auth/login', {
    method: 'POST',
    body: { email, password },
    auth: false,
  })
  // El panel admin es solo para administradores: una cuenta cliente no entra.
  if (data?.user?.rol === 'cliente') {
    clearToken()
    throw new ApiError('Esta cuenta es de cliente. Usa el portal en /cuenta.', 403)
  }
  if (data?.token) setToken(data.token)
  return data
}

export function logout() {
  clearToken()
}

// Pedidos
export function getPedidos(params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null)
  ).toString()
  return apiFetch(`/pedidos${qs ? `?${qs}` : ''}`)
}
export function getPedido(id) {
  return apiFetch(`/pedidos/${id}`)
}
export function crearPedidoAdmin(data) {
  return apiFetch('/pedidos/admin', { method: 'POST', body: data })
}
export function cambiarEstadoPedido(id, estado, fotoEntrega, plazoIngredientes) {
  const body = {
    estado,
    ...(fotoEntrega ? { foto_entrega: fotoEntrega } : {}),
    ...(plazoIngredientes ? { plazo_ingredientes: plazoIngredientes } : {}),
  }
  return apiFetch(`/pedidos/${id}/estado`, { method: 'PATCH', body })
}
export function editarPedido(id, data) {
  return apiFetch(`/pedidos/${id}`, { method: 'PATCH', body: data })
}
export function reenviarCorreo(pedidoId, estado) {
  return apiFetch(`/correos/pedido/${pedidoId}`, { method: 'POST', body: { estado } })
}

// Platos
export function getPlatos({ incluirInactivos = false, servicio } = {}) {
  const qs = new URLSearchParams({
    ...(incluirInactivos ? { incluir_inactivos: 'true' } : {}),
    ...(servicio ? { servicio } : {}),
  }).toString()
  return apiFetch(`/platos${qs ? `?${qs}` : ''}`)
}
export function crearPlato(data) {
  return apiFetch('/platos', { method: 'POST', body: data })
}
export function editarPlato(id, data) {
  return apiFetch(`/platos/${id}`, { method: 'PUT', body: data })
}
export function recargarCatalogo(confirmacion) {
  return apiFetch('/platos/recargar-catalogo', { method: 'POST', body: { confirmacion } })
}
export function eliminarPlato(id) {
  return apiFetch(`/platos/${id}`, { method: 'DELETE' })
}

// Cupos (por servicio)
export function getCupos({ todos = false, servicio } = {}) {
  const qs = new URLSearchParams({
    ...(todos ? { todos: 'true' } : {}),
    ...(servicio ? { servicio } : {}),
  }).toString()
  return apiFetch(`/cupos${qs ? `?${qs}` : ''}`)
}
export function guardarCupo(data) {
  return apiFetch('/cupos', { method: 'POST', body: data })
}
export function guardarCuposBulk({ fechas, capacidad_maxima, activo, servicio }) {
  return apiFetch('/cupos/bulk', { method: 'POST', body: { fechas, capacidad_maxima, activo, servicio } })
}
export function eliminarCupo(id, servicio) {
  const qs = servicio ? `?servicio=${encodeURIComponent(servicio)}` : ''
  return apiFetch(`/cupos/${id}${qs}`, { method: 'DELETE' })
}

// Subida de imágenes (presigned URL → PUT directo al bucket)
export function presignUpload(body) {
  return apiFetch('/uploads/presign', { method: 'POST', body })
}
/**
 * Sube un archivo al bucket y devuelve su KEY (no una URL pública). La key se
 * guarda en el producto; para mostrarla se usa imagenUrl() (publicApi), que la
 * sirve por el proxy del backend con una URL firmada.
 */
export async function subirImagen(file, prefix = 'productos-hornear') {
  const { uploadUrl, key } = await presignUpload({
    filename: file.name,
    contentType: file.type || 'application/octet-stream',
    prefix,
  })
  let put
  try {
    put = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
      body: file,
    })
  } catch {
    throw new ApiError('No se pudo conectar con el almacenamiento.', 0)
  }
  if (!put.ok) throw new ApiError(`No se pudo subir la imagen (HTTP ${put.status}).`, put.status)
  return key
}

// Productos para hornear
export function getProductosHornear({ todos = false } = {}) {
  const qs = todos ? '?todos=true' : ''
  return apiFetch(`/productos-hornear${qs}`)
}
export function guardarProductoHornear(data) {
  return apiFetch('/productos-hornear', { method: 'POST', body: data })
}
export function eliminarProductoHornear(id) {
  return apiFetch(`/productos-hornear/${id}`, { method: 'DELETE' })
}

// Comunas (por servicio)
export function getComunas({ todos = false, servicio } = {}) {
  const qs = new URLSearchParams({
    ...(todos ? { todos: 'true' } : {}),
    ...(servicio ? { servicio } : {}),
  }).toString()
  return apiFetch(`/comunas${qs ? `?${qs}` : ''}`)
}
export function crearComuna(data) {
  return apiFetch('/comunas', { method: 'POST', body: data })
}
export function editarComuna(id, data) {
  return apiFetch(`/comunas/${id}`, { method: 'PUT', body: data })
}
export function eliminarComuna(id, servicio) {
  const qs = servicio ? `?servicio=${encodeURIComponent(servicio)}` : ''
  return apiFetch(`/comunas/${id}${qs}`, { method: 'DELETE' })
}

// Ajustes por servicio (precio base, independiente entre servicios)
export function getServiciosConfig() {
  return apiFetch('/config', { auth: false })
}
export function editarServicioConfig(servicio, data) {
  return apiFetch(`/config/${encodeURIComponent(servicio)}`, { method: 'PUT', body: data })
}

// Etiquetas de todos los estados posibles.
export const ESTADOS_LABELS = {
  solicitud_recibida: 'Solicitud recibida',
  pagado: 'Pagado',
  en_preparacion: 'En preparación',
  en_delivery: 'En delivery',
  entregado: 'Entregado',
}

// Estados disponibles POR SERVICIO (en orden de avance):
// - Meal Prep añade "En delivery".
// - Cocinera a Domicilio no tiene "En preparación" ni "En delivery".
const ESTADOS_POR_SERVICIO = {
  meal_prep: ['solicitud_recibida', 'pagado', 'en_preparacion', 'en_delivery', 'entregado'],
  cocinera: ['solicitud_recibida', 'pagado', 'entregado'],
}

export function estadosDeServicio(servicio) {
  const vals = ESTADOS_POR_SERVICIO[servicio] || ESTADOS_POR_SERVICIO.meal_prep
  return vals.map((value) => ({ value, label: ESTADOS_LABELS[value] }))
}

// Lista completa (todos los estados) para vistas no acotadas a un servicio.
export const ESTADOS = Object.entries(ESTADOS_LABELS).map(([value, label]) => ({ value, label }))

export const SERVICIOS = {
  meal_prep: 'Meal Prep',
  cocinera: 'Cocinera a Domicilio',
}
