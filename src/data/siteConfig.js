export const SITE = {
  name:        'Sabores de Mamá',
  tagline:     'Comida casera hecha con amor',
  description: 'Sabores auténticos que te devuelven a la mesa familiar. Comida casera preparada con ingredientes frescos y mucho cariño, lista para disfrutar en tu hogar.',
  url:         import.meta.env.VITE_SITE_URL || 'https://saboresdemama.com',
  whatsapp:    import.meta.env.VITE_WHATSAPP_NUMBER || '56966705821',
  email:       'estela.zavalla@saboresdemama.com',
  address:     'Santiago, Chile',
  hours: {
    weekdays: 'Lunes a Viernes: 11:00 – 20:00',
    weekend:  'Sábado y Domingo: 11:00 – 17:00',
  },
  social: {
    instagram: 'https://instagram.com/saboresdemama.casero',
    facebook:  null,
    tiktok:    'https://tiktok.com/@saboresdemama.casero',
  },
}

export const WHATSAPP = {
  baseUrl: 'https://wa.me/',
  defaultMessage: '¡Hola! Quiero hacer un pedido de comida casera 🍽️',
  menuMessage:    '¡Hola! Me interesa el menú. ¿Me puedes indicar disponibilidad?',
  orderMessage:   '¡Hola! Quiero hacer un pedido de: ',
  cocineraMessage: '¡Hola! Quiero agendar el servicio de Cocinera a Domicilio 👩‍🍳 para coordinar fecha y detalles.',
  horneadosMessage: '¡Hola! Quiero pedir postres/galletas para hornear en casa 🍪 ¿Me cuentas disponibilidad?',
}

export function getWhatsAppLink(message = WHATSAPP.defaultMessage) {
  const encoded = encodeURIComponent(message)
  return `${WHATSAPP.baseUrl}${SITE.whatsapp}?text=${encoded}`
}
