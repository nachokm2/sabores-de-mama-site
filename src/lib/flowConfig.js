// Configuración del flujo de pedido (precios, despacho, datos bancarios).
// Los valores provienen de variables de entorno Vite con fallback razonable.

export const MEAL_PREP_BASE = Number(import.meta.env.VITE_MEAL_PREP_BASE) || 60000
export const COCINERA_BASE = Number(import.meta.env.VITE_COCINERA_BASE) || 55000
export const DELIVERY_COST = Number(import.meta.env.VITE_DELIVERY_COST) || 5000

// Costos por defecto de los servicios adicionales de Meal Prep (fallback si el
// backend no responde; la admin los configura desde Ajustes).
export const MEAL_PREP_INGREDIENTES = Number(import.meta.env.VITE_MEAL_PREP_INGREDIENTES) || 1000
export const MEAL_PREP_PORCIONADO = Number(import.meta.env.VITE_MEAL_PREP_PORCIONADO) || 3000

// Las ensaladas se cobran aparte (como los Postres y Snacks): se agregan como
// adicional al pedido con este valor por unidad.
export const ENSALADA_PRECIO = Number(import.meta.env.VITE_ENSALADA_PRECIO) || 1500

/**
 * Total del pedido = base del servicio − descuento de la fecha + despacho +
 * add-ons de hornear + servicios adicionales. `base` es parametrizable por
 * flujo (Meal Prep vs Cocinera); por defecto Meal Prep. Debe coincidir con
 * backend/src/services/pricing.js.
 */
export function computeTotal({
  base = MEAL_PREP_BASE,
  descuento = 0,
  costo_despacho = 0,
  bakingTotal = 0,
  adicionalesTotal = 0,
} = {}) {
  return (
    Number(base || MEAL_PREP_BASE) -
    Number(descuento || 0) +
    Number(costo_despacho || 0) +
    Number(bakingTotal || 0) +
    Number(adicionalesTotal || 0)
  )
}

/** Monto (en pesos) del descuento de la fecha: un % del precio base. */
export function montoDescuento(base, pct) {
  return Math.round((Number(base || 0) * Number(pct || 0)) / 100)
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
