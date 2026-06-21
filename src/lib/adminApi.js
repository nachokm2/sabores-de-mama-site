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
export function cambiarEstadoPedido(id, estado) {
  return apiFetch(`/pedidos/${id}/estado`, { method: 'PATCH', body: { estado } })
}
export function editarPedido(id, data) {
  return apiFetch(`/pedidos/${id}`, { method: 'PATCH', body: data })
}
export function reenviarCorreo(pedidoId, estado) {
  return apiFetch(`/correos/pedido/${pedidoId}`, { method: 'POST', body: { estado } })
}

// Platos
export function getPlatos({ incluirInactivos = false } = {}) {
  const qs = incluirInactivos ? '?incluir_inactivos=true' : ''
  return apiFetch(`/platos${qs}`)
}
export function crearPlato(data) {
  return apiFetch('/platos', { method: 'POST', body: data })
}
export function editarPlato(id, data) {
  return apiFetch(`/platos/${id}`, { method: 'PUT', body: data })
}
export function eliminarPlato(id) {
  return apiFetch(`/platos/${id}`, { method: 'DELETE' })
}

// Cupos
export function getCupos({ todos = false } = {}) {
  const qs = todos ? '?todos=true' : ''
  return apiFetch(`/cupos${qs}`)
}
export function guardarCupo(data) {
  return apiFetch('/cupos', { method: 'POST', body: data })
}
export function guardarCuposBulk({ fechas, capacidad_maxima, activo }) {
  return apiFetch('/cupos/bulk', { method: 'POST', body: { fechas, capacidad_maxima, activo } })
}
export function eliminarCupo(id) {
  return apiFetch(`/cupos/${id}`, { method: 'DELETE' })
}

// Subida de imágenes (presigned URL → PUT directo al bucket)
export function presignUpload(body) {
  return apiFetch('/uploads/presign', { method: 'POST', body })
}
/** Sube un archivo y devuelve su URL pública. */
export async function subirImagen(file, prefix = 'productos-hornear') {
  const { uploadUrl, publicUrl } = await presignUpload({
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
  return publicUrl
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

// Comunas
export function getComunas({ todos = false } = {}) {
  const qs = todos ? '?todos=true' : ''
  return apiFetch(`/comunas${qs}`)
}
export function crearComuna(data) {
  return apiFetch('/comunas', { method: 'POST', body: data })
}
export function editarComuna(id, data) {
  return apiFetch(`/comunas/${id}`, { method: 'PUT', body: data })
}
export function eliminarComuna(id) {
  return apiFetch(`/comunas/${id}`, { method: 'DELETE' })
}

// Etiquetas de estado para la UI.
export const ESTADOS = [
  { value: 'solicitud_recibida', label: 'Solicitud recibida' },
  { value: 'pagado', label: 'Pagado' },
  { value: 'en_preparacion', label: 'En preparación' },
  { value: 'entregado', label: 'Entregado' },
]

export const SERVICIOS = {
  meal_prep: 'Meal Prep',
  cocinera: 'Cocinera a Domicilio',
}
