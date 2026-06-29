// Helpers de API para los tests E2E: preparan datos (cupos) y verifican el
// estado en el backend (que lee/escribe la BD). Usan el endpoint protegido con
// JWT, por lo que verificar vía API equivale a verificar en la BD.

export const API_URL = process.env.E2E_API_URL || 'http://localhost:4000/api'

const ADMIN = {
  email: process.env.E2E_ADMIN_EMAIL || 'admin@saboresdemama.com',
  password: process.env.E2E_ADMIN_PASSWORD || 'admin123',
}

export async function adminToken(request) {
  const res = await request.post(`${API_URL}/auth/login`, { data: ADMIN })
  if (!res.ok()) throw new Error(`Login admin falló (${res.status()}). Revisa ADMIN_* del backend.`)
  return (await res.json()).token
}

/**
 * Crea o actualiza el cupo de una fecha (upsert). Los cupos son por servicio,
 * así que se siembra para AMBOS servicios para que cualquier flujo lo encuentre.
 */
export async function ensureCupo(request, { fecha, capacidad = 10, activo = true }) {
  const token = await adminToken(request)
  let ultimo
  for (const servicio of ['meal_prep', 'cocinera']) {
    const res = await request.post(`${API_URL}/cupos`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { fecha, servicio, capacidad_maxima: capacidad, activo },
    })
    if (!res.ok()) throw new Error(`No se pudo crear el cupo ${fecha} (${servicio}) (${res.status()})`)
    ultimo = (await res.json()).cupo
  }
  return ultimo
}

/** Obtiene un pedido por id (protegido) → para verificar estado/datos en la BD. */
export async function getPedido(request, id) {
  const token = await adminToken(request)
  const res = await request.get(`${API_URL}/pedidos/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok()) throw new Error(`No se pudo leer el pedido ${id} (${res.status()})`)
  return (await res.json()).pedido
}

/** Fecha futura YYYY-MM-DD (zona local) a N días de hoy. */
export function fechaFutura(dias) {
  const d = new Date()
  d.setDate(d.getDate() + dias)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Etiqueta "D de mes" como la muestra el StepDate (es-CL). */
export function etiquetaFecha(fechaISO) {
  const d = new Date(fechaISO + 'T00:00:00')
  return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'long' })
}
