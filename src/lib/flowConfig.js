// Configuración del flujo de pedido (precios, despacho, datos bancarios).
// Los valores provienen de variables de entorno Vite con fallback razonable.

export const MEAL_PREP_BASE = Number(import.meta.env.VITE_MEAL_PREP_BASE) || 60000
export const COCINERA_BASE = Number(import.meta.env.VITE_COCINERA_BASE) || 55000
export const DELIVERY_COST = Number(import.meta.env.VITE_DELIVERY_COST) || 5000

// Costos por defecto de los servicios adicionales de Meal Prep (fallback si el
// backend no responde; la admin los configura desde Ajustes).
export const MEAL_PREP_INGREDIENTES = Number(import.meta.env.VITE_MEAL_PREP_INGREDIENTES) || 1000
export const MEAL_PREP_PORCIONADO = Number(import.meta.env.VITE_MEAL_PREP_PORCIONADO) || 3000

// Las ensaladas se cobran aparte (como los productos Healthy): se agregan como
// adicional al pedido con este valor por unidad.
export const ENSALADA_PRECIO = Number(import.meta.env.VITE_ENSALADA_PRECIO) || 1500

/**
 * Total del pedido = base del servicio + despacho + add-ons de hornear +
 * servicios adicionales. `base` es parametrizable por flujo (Meal Prep vs
 * Cocinera); por defecto Meal Prep.
 */
export function computeTotal({ base = MEAL_PREP_BASE, costo_despacho = 0, bakingTotal = 0, adicionalesTotal = 0 } = {}) {
  return (
    Number(base || MEAL_PREP_BASE) +
    Number(costo_despacho || 0) +
    Number(bakingTotal || 0) +
    Number(adicionalesTotal || 0)
  )
}

export function fmtCLP(n) {
  return '$' + Number(n || 0).toLocaleString('es-CL')
}

// Datos bancarios para la página de pago (desde variables de entorno).
export const BANK = {
  titular: import.meta.env.VITE_BANK_TITULAR || 'Sabores de Mamá',
  banco: import.meta.env.VITE_BANK_BANCO || '—',
  tipoCuenta: import.meta.env.VITE_BANK_TIPO_CUENTA || '—',
  numero: import.meta.env.VITE_BANK_NUMERO || '—',
  rut: import.meta.env.VITE_BANK_RUT || '—',
  email: import.meta.env.VITE_BANK_EMAIL || '—',
}
