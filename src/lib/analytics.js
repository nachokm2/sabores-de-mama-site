// Analítica ligera: empuja eventos a la capa de datos de Google Tag Manager
// (window.dataLayer). En GTM se crean las etiquetas que envían estos eventos a
// GA4. Mantener los nombres de evento estables (se referencian desde GTM).

/**
 * Envía un evento a dataLayer de forma segura.
 * - No-op en SSR (durante el pre-render no existe `window`).
 * - Inicializa dataLayer si GTM aún no lo creó.
 *
 * @param {string} event  nombre del evento (ej. 'pedido_confirmado')
 * @param {object} [params] parámetros adicionales del evento
 */
export function trackEvent(event, params = {}) {
  if (typeof window === 'undefined' || !event) return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ event, ...params })
}
