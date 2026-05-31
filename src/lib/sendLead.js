import emailjs from '@emailjs/browser'

const SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
const PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

/**
 * Envía los datos del lead por correo via EmailJS.
 * Funciona tanto para leads con cobertura como sin cobertura.
 * Si las variables de entorno no están configuradas, falla silenciosamente.
 */
export async function sendLead(data) {
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    console.warn('[sendLead] EmailJS no está configurado. Agrega VITE_EMAILJS_* en el .env')
    return { ok: false, reason: 'not_configured' }
  }

  const params = {
    lead_tipo:      data.hasCobertura ? '✅ CON COBERTURA' : '🚨 FUERA DE COBERTURA',
    servicio:       data.service === 'mealprep' ? 'Meal Prep ($60.000)' : 'Cocinera a Domicilio ($55.000)',
    nombre:         data.nombre    || '-',
    telefono:       data.telefono  || '-',
    correo:         data.correo    || '-',
    comuna:         data.comuna    || '-',
    platos:         data.platos?.length ? data.platos.join(', ') : '-',
    personas:       data.personas  || '-',
    interes:        data.interes   || '-',
    dudas:          data.dudas?.length ? data.dudas.join(' | ') : 'Ninguna',
    fecha:          new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' }),
  }

  try {
    await emailjs.send(SERVICE_ID, TEMPLATE_ID, params, { publicKey: PUBLIC_KEY })
    return { ok: true }
  } catch (err) {
    console.error('[sendLead] Error al enviar email:', err)
    return { ok: false, reason: err }
  }
}
