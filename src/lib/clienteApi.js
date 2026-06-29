// Cliente de API para el PORTAL DE CLIENTES (independiente del admin).
// Usa su propio token en localStorage para no compartir sesión con el admin.
import { ApiError } from './publicApi'

export { ApiError } // re-exportado para que las páginas del portal lo usen

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
export const CLIENTE_TOKEN_KEY = 'sdm_cliente_token'

export function getToken() {
  try {
    return localStorage.getItem(CLIENTE_TOKEN_KEY)
  } catch {
    return null
  }
}
export function setToken(token) {
  localStorage.setItem(CLIENTE_TOKEN_KEY, token)
}
export function clearToken() {
  localStorage.removeItem(CLIENTE_TOKEN_KEY)
}

function parseJwt(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(base64).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    )
    return JSON.parse(json)
  } catch {
    return null
  }
}

export function isTokenValid(token = getToken()) {
  if (!token) return false
  const p = parseJwt(token)
  return Boolean(p && p.exp && p.exp * 1000 > Date.now() + 5000)
}

export function getCliente() {
  const p = parseJwt(getToken() || '')
  if (!p) return null
  return { id: p.sub, email: p.email, nombre: p.nombre, rol: p.rol }
}

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
    if (res.status === 401) clearToken()
    throw new ApiError(data?.error || `Error ${res.status}`, res.status, data)
  }
  return data
}

// ── Auth ──────────────────────────────────────────────────────────────────
export async function registro({ nombre, email, password, telefono }) {
  const data = await apiFetch('/auth/registro', {
    method: 'POST',
    body: { nombre, email, password, telefono },
    auth: false,
  })
  if (data?.token) setToken(data.token)
  return data
}

export async function login(email, password) {
  const data = await apiFetch('/auth/login', { method: 'POST', body: { email, password }, auth: false })
  // Este portal es SOLO para clientes: una cuenta admin no entra aquí.
  if (data?.user?.rol && data.user.rol !== 'cliente') {
    clearToken()
    throw new ApiError('Esta cuenta es de administración. Ingresa por el panel de administración.', 403)
  }
  if (data?.token) setToken(data.token)
  return data
}

export function logout() {
  clearToken()
}
export function recuperar(email) {
  return apiFetch('/auth/recuperar', { method: 'POST', body: { email }, auth: false })
}
export function resetPassword(token, password) {
  return apiFetch('/auth/reset', { method: 'POST', body: { token, password }, auth: false })
}

// ── Perfil y reservas ───────────────────────────────────────────────────────
export function getPerfil() {
  return apiFetch('/auth/perfil')
}
export function editarPerfil(data) {
  return apiFetch('/auth/perfil', { method: 'PATCH', body: data })
}
export function getMisReservas() {
  return apiFetch('/pedidos/mis')
}
