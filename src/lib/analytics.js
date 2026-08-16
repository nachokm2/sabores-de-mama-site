// Analítica ligera: empuja eventos a la capa de datos de Google Tag Manager
// (window.dataLayer). En GTM se crean las etiquetas que envían estos eventos a
// GA4. Mantener los nombres de evento estables (se referencian desde GTM).

import { metaTrack } from './metaPixel'

/**
 * Eventos que además son conversiones del píxel de Meta, con su traducción al
 * nombre y los parámetros que Meta espera.
 *
 * La tabla es explícita a propósito: solo lo que está aquí llega al píxel. Y
 * vive en este archivo —en vez de llamar a metaTrack desde cada componente—
 * para que GA4 y Meta no puedan desincronizarse: quien emita la conversión la
 * emite en los dos sitios o en ninguno.
 *
 * Purchase es el que no existía: en GTM nunca hubo una etiqueta de compra, así
 * que Meta llevaba toda la campaña sin recibir una sola conversión atribuida.
 */
const EVENTOS_META = {
  pedido_confirmado: (p) => ['Purchase', { value: p.value, currency: p.currency }],
}

/**
 * Envía un evento a dataLayer de forma segura, y al píxel de Meta si es una de
 * las conversiones de EVENTOS_META.
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

  const aMeta = EVENTOS_META[event]
  if (aMeta) metaTrack(...aMeta(params))
}
