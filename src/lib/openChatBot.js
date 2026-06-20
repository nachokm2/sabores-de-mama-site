// Inicia el flujo de pedido (Meal Prep) desde cualquier CTA del sitio.
// Se mantiene el nombre `openChatBot` por compatibilidad con los componentes
// que ya lo importan; ahora dispara la navegación al stepper /meal-prep.
export function openChatBot() {
  window.dispatchEvent(new CustomEvent('sabores:start-flow'))
}
