// Abre el asistente virtual desde cualquier parte del sitio
export function openChatBot() {
  window.dispatchEvent(new CustomEvent('sabores:open-chatbot'))
}
