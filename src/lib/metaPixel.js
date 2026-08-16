/**
 * Eventos del píxel de Meta (1524660162308441).
 *
 * El píxel se carga desde index.html, NO desde GTM. El 16/08/2026 se pausaron en
 * el contenedor GTM-PN56NXLC las tres etiquetas de HTML personalizado que lo
 * disparaban (Base, Contact y ViewContent): la CSP bloquea los scripts que GTM
 * inyecta —no están en la lista de hashes por página— así que llevaban tiempo
 * sin medir nada. Este módulo las reemplaza desde el código, donde la CSP no
 * estorba porque el JavaScript es del propio bundle.
 *
 * `Purchase` no existía en GTM: la conversión de Meta nunca estuvo configurada.
 * Se añade aquí (ver EVENTOS_META en ./analytics.js).
 */

/**
 * Envía un evento al píxel de forma segura.
 *
 * No-op si `fbq` no existe: durante el pre-render (SSG) no hay `window`, y en el
 * navegador un bloqueador de anuncios puede impedir que el píxel cargue. En
 * ninguno de los dos casos es un error — la medición se pierde, la página no.
 *
 * @param {string} evento nombre del evento estándar de Meta (ej. 'Purchase')
 * @param {object} [params] parámetros del evento (value, currency, content_name…)
 */
export function metaTrack(evento, params) {
  if (typeof window === 'undefined' || !evento) return
  if (typeof window.fbq !== 'function') return
  window.fbq('track', evento, params)
}

/** Contact · clic en cualquier vía de contacto por WhatsApp. */
export function metaContactoWhatsApp() {
  metaTrack('Contact', { content_name: 'WhatsApp' })
}

/**
 * ¿Es la primera vez en esta pestaña? Marca la clave y responde una sola vez.
 *
 * Si sessionStorage está bloqueado (modo privado de algunos navegadores)
 * devuelve `true` siempre: se prefiere medir de más a no medir nada.
 */
export function primeraVezEnLaSesion(clave) {
  if (typeof window === 'undefined') return false
  try {
    if (window.sessionStorage.getItem(clave)) return false
    window.sessionStorage.setItem(clave, '1')
    return true
  } catch {
    return true
  }
}

/**
 * Escucha los clics en enlaces a WhatsApp de todo el sitio y emite Contact.
 *
 * Es un listener delegado en `document` en vez de un onClick por enlace porque
 * hay ocho repartidos entre páginas y componentes, construidos con dos
 * ayudantes distintos (`getWhatsAppLink` y el `waLink` local de Menu.jsx). Uno
 * solo aquí los cubre todos y, sobre todo, cubre los que se agreguen mañana sin
 * que nadie tenga que acordarse de instrumentarlos.
 *
 * No cubre los botones que abren WhatsApp con `window.open` (no son enlaces):
 * esos llaman a metaContactoWhatsApp() directamente.
 *
 * Se escucha en fase de captura para que el evento se registre aunque algún
 * manejador intermedio detenga la propagación.
 *
 * @returns {() => void} función para dejar de escuchar
 */
export function escucharClicsWhatsApp() {
  if (typeof document === 'undefined') return () => {}
  const alHacerClic = (e) => {
    if (e.target?.closest?.('a[href*="wa.me"]')) metaContactoWhatsApp()
  }
  document.addEventListener('click', alHacerClic, true)
  return () => document.removeEventListener('click', alHacerClic, true)
}
