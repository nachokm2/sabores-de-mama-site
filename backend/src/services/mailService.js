import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
import { query } from '../models/index.js'
import { presignGet } from './storage.js'
import { consolidarIngredientes } from '../utils/ingredientes.js'
import { surveyToken } from '../utils/encuestaToken.js'

dotenv.config()

/**
 * Servicio de correo transaccional (Nodemailer).
 *
 * Configuración SMTP por variables de entorno:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 *
 * - Si falta la config SMTP, el envío se OMITE y sólo se registra en logs (la
 *   API sigue funcionando en desarrollo sin credenciales).
 * - `sendEstadoEmail(pedido, estado)` elige y envía la plantilla del estado.
 * - HTML limpio basado en tablas + estilos inline (compatible con Gmail/Outlook).
 */

let transporter = null

function getTransporter() {
  if (transporter) return transporter
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true', // true para 465
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    // Fallar rápido si el SMTP no responde (p. ej. puerto bloqueado en el host):
    // así el envío en segundo plano no queda colgado indefinidamente.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  })
  return transporter
}

// Remitente: RESEND_FROM > MAIL_FROM > SMTP_FROM > SMTP_USER.
// Con Resend sin dominio propio verificado, usa "onboarding@resend.dev".
function mailFrom() {
  return (
    process.env.RESEND_FROM ||
    process.env.MAIL_FROM ||
    process.env.SMTP_FROM ||
    process.env.SMTP_USER ||
    'Sabores de Mamá <onboarding@resend.dev>'
  )
}

/**
 * Envío por la API HTTP de Resend (puerto 443). Funciona en hosts que bloquean
 * el SMTP saliente (Railway, Render, etc.). Usa fetch nativo (Node 18+), sin
 * dependencias extra, con timeout propio para no quedar colgado.
 */
async function sendViaResend({ apiKey, from, to, subject, html }) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15_000)
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject, html }),
      signal: controller.signal,
    })
    // Leemos el cuerpo como texto y lo intentamos parsear: así, ante un 4xx/5xx,
    // el log muestra el motivo EXACTO de Resend (dominio no verificado, cuota, etc.)
    // aunque la respuesta no sea JSON.
    const bodyText = await res.text().catch(() => '')
    let data = {}
    try {
      data = bodyText ? JSON.parse(bodyText) : {}
    } catch {
      /* respuesta no-JSON: se usa bodyText tal cual en el detalle */
    }
    if (!res.ok) {
      const detalle = data?.message || data?.name || bodyText || `HTTP ${res.status}`
      throw new Error(`Resend HTTP ${res.status}: ${detalle}`)
    }
    return data?.id
  } finally {
    clearTimeout(timer)
  }
}

// ── Formato ─────────────────────────────────────────────────────────────────
const BRAND = '#AE4C29'
const INK = '#2A1C12'
const MUTED = '#6B5D4E'
const CREAM = '#FBF6EE'
const BORDER = '#ECE1D2'

function fmtCLP(n) {
  return '$' + Number(n || 0).toLocaleString('es-CL')
}

function fmtFecha(fecha) {
  if (!fecha) return ''
  try {
    // `fecha` puede llegar como objeto Date (node-postgres parsea las columnas
    // DATE a Date) o como string ISO/"YYYY-MM-DD". Antes se hacía
    // String(fecha).slice(0,10), que sobre un Date daba "Sat Aug 0" → Invalid Date.
    let y, m, d
    if (fecha instanceof Date && !isNaN(fecha.getTime())) {
      ;[y, m, d] = [fecha.getUTCFullYear(), fecha.getUTCMonth() + 1, fecha.getUTCDate()]
    } else {
      const match = String(fecha).slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/)
      if (!match) return String(fecha)
      ;[, y, m, d] = match.map(Number)
    }
    const dt = new Date(Date.UTC(y, m - 1, d))
    if (isNaN(dt.getTime())) return String(fecha)
    return dt.toLocaleDateString('es-CL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    })
  } catch {
    return String(fecha)
  }
}

// Formatea el plazo "YYYY-MM-DDTHH:mm" (hora local que ingresó la admin) a algo
// legible: "sábado, 1 de agosto de 2026 a las 16:00 hrs".
function fmtPlazo(v) {
  if (!v) return ''
  const m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)
  if (!m) return String(v)
  const [, y, mo, d, h, mi] = m.map(Number)
  const dt = new Date(Date.UTC(y, mo - 1, d))
  if (isNaN(dt.getTime())) return String(v)
  const fecha = dt.toLocaleDateString('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
  return `${fecha} a las ${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')} hrs`
}

// Datos de envío de ingredientes (configurables por variable de entorno).
const ENVIO_DIRECCION = process.env.ENVIO_DIRECCION || 'Los plátanos 1566, Renca'
const ENVIO_CONTACTO = process.env.ENVIO_CONTACTO || '+56 9 9810 4653'

function esc(s) {
  return String(s ?? '').replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])
  )
}

function platoNombre(p) {
  return typeof p === 'string' ? p : p?.nombre || ''
}

function listaPlatosHtml(platos) {
  const arr = Array.isArray(platos) ? platos : []
  if (!arr.length) return `<p style="margin:0;color:${MUTED}">—</p>`
  const items = arr
    .map((p) => {
      const acomp = p && p.acompanamiento && p.acompanamiento.nombre ? ` (con ${esc(p.acompanamiento.nombre)})` : ''
      return `<li style="margin:2px 0;color:${INK}">${esc(platoNombre(p))}${acomp}</li>`
    })
    .join('')
  return `<ul style="margin:6px 0 0;padding-left:18px">${items}</ul>`
}

// ── Layout base (tabla, compatible con Outlook) ─────────────────────────────
function baseTemplate({ titulo, intro, bodyHtml, footerNota }) {
  const clientUrl = process.env.CLIENT_URL || 'https://saboresdemama.com'
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${CREAM};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};">
    <tr><td align="center" style="padding:24px;">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:560px;max-width:100%;font-family:Arial,Helvetica,sans-serif;">
        <tr><td style="background:${BRAND};color:#FFFCF7;padding:22px 28px;border-radius:16px 16px 0 0;text-align:center;">
          <div style="font-size:20px;font-weight:bold;">Sabores de Mamá</div>
          <div style="font-size:13px;opacity:0.9;margin-top:6px;">${esc(titulo)}</div>
        </td></tr>
        <tr><td style="background:#FFFCF7;padding:24px 28px;border:1px solid ${BORDER};border-top:0;border-radius:0 0 16px 16px;">
          ${intro ? `<p style="margin:0 0 16px;font-size:15px;color:${INK};line-height:1.5;">${intro}</p>` : ''}
          ${bodyHtml}
          ${footerNota ? `<p style="margin:20px 0 0;font-size:12px;color:${MUTED};line-height:1.5;">${footerNota}</p>` : ''}
        </td></tr>
        <tr><td style="text-align:center;font-size:11px;color:${MUTED};padding:16px 0 0;">
          Sabores de Mamá · Comida casera hecha con amor ·
          <a href="${clientUrl}" style="color:${BRAND};text-decoration:none;">${esc(clientUrl.replace(/^https?:\/\//, ''))}</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

function row(label, value) {
  return `<tr>
    <td style="padding:3px 0;color:${MUTED};font-size:14px;">${esc(label)}</td>
    <td style="padding:3px 0;text-align:right;color:${INK};font-size:14px;">${esc(value)}</td>
  </tr>`
}

function resumenPedidoHtml(pedido) {
  const servicio = pedido.servicio === 'meal_prep' ? 'Meal Prep' : 'Cocinera a Domicilio'
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};border:1px solid ${BORDER};border-radius:12px;">
    <tr><td style="padding:16px 18px;">
      <div style="font-weight:bold;color:${BRAND};margin-bottom:8px;font-size:14px;">Resumen de tu pedido #${esc(pedido.id)}</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${row('Servicio', servicio)}
        ${row('Fecha de entrega', fmtFecha(pedido.fecha_entrega))}
        ${pedido.comuna ? row('Comuna', pedido.comuna) : ''}
        ${pedido.tipo_entrega ? row('Entrega', pedido.tipo_entrega) : ''}
        ${row('Despacho', fmtCLP(pedido.costo_despacho))}
        <tr>
          <td style="padding:6px 0 0;font-weight:bold;color:${INK};font-size:15px;">Total</td>
          <td style="padding:6px 0 0;text-align:right;font-weight:bold;color:${BRAND};font-size:15px;">${esc(fmtCLP(pedido.total))}</td>
        </tr>
      </table>
      <div style="margin:12px 0 4px;font-size:13px;color:${MUTED};">Platos seleccionados</div>
      ${listaPlatosHtml(pedido.platos)}
    </td></tr>
  </table>`
}

function datosBancariosHtml(pedido) {
  // Soporta ambos esquemas de nombres: BANCO_* (checklist de deploy) y BANK_*.
  const env = process.env
  const b = {
    titular: env.BANCO_NOMBRE || env.BANK_TITULAR || '—',
    banco: env.BANCO_BANCO || env.BANK_BANCO || '—',
    tipo: env.BANCO_TIPO || env.BANK_TIPO_CUENTA || '—',
    numero: env.BANCO_CUENTA || env.BANK_NUMERO || '—',
    rut: env.BANCO_RUT || env.BANK_RUT || '—',
    email: env.BANCO_EMAIL || env.BANK_EMAIL || env.SMTP_FROM || '—',
  }
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;background:#FFFFFF;border:1px dashed ${BRAND};border-radius:12px;">
    <tr><td style="padding:16px 18px;">
      <div style="font-weight:bold;color:${INK};margin-bottom:8px;font-size:14px;">Datos para transferencia</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${row('Titular', b.titular)}
        ${row('Banco', b.banco)}
        ${row('Tipo de cuenta', b.tipo)}
        ${row('N° de cuenta', b.numero)}
        ${row('RUT', b.rut)}
        ${row('Email', b.email)}
        <tr>
          <td style="padding:6px 0 0;font-weight:bold;color:${INK};font-size:15px;">Monto a transferir</td>
          <td style="padding:6px 0 0;text-align:right;font-weight:bold;color:${BRAND};font-size:16px;">${esc(fmtCLP(pedido.total))}</td>
        </tr>
      </table>
      <div style="margin:10px 0 0;font-size:12px;color:${MUTED};">
        Envía el comprobante respondiendo este correo e indica tu pedido #${esc(pedido.id)}.
      </div>
    </td></tr>
  </table>`
}

// Lista de ingredientes/compras: tabla nombre/cantidad/unidad. Recibe una lista YA
// consolidada (un total por ingrediente) — nunca separada por plato.
function listaComprasHtml(lista, titulo = 'Lista de compras') {
  if (!Array.isArray(lista) || !lista.length) return ''
  const filas = lista
    .map(
      (i) =>
        `<tr>
          <td style="padding:4px 0;color:${INK};font-size:13px;">${esc(i.nombre)}</td>
          <td style="padding:4px 0;text-align:right;color:${INK};font-size:13px;">${esc(i.cantidad)} ${esc(i.unidad || '')}</td>
        </tr>`
    )
    .join('')
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;background:#FFFFFF;border:1px solid ${BORDER};border-radius:12px;">
    <tr><td style="padding:16px 18px;">
      <div style="font-weight:bold;color:${BRAND};margin-bottom:8px;font-size:14px;">${esc(titulo)}</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${filas}</table>
    </td></tr>
  </table>`
}

// Avisos al pie del correo de pago (solo Meal Prep): descongelación,
// recomendaciones y envío de ingredientes con el plazo que ingresó la admin.
function avisosMealPrepHtml(pedido) {
  const plazo = fmtPlazo(pedido.plazo_ingredientes)
  const li = (t) => `<li style="margin:3px 0;color:${INK};font-size:13px;">${esc(t)}</li>`
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;background:${CREAM};border:1px solid ${BORDER};border-radius:12px;">
    <tr><td style="padding:16px 18px;">
      <div style="font-weight:bold;color:${INK};margin-bottom:6px;font-size:14px;">❄️ Descongelación</div>
      <ul style="margin:0 0 14px;padding-left:18px;">${li('Pasar del congelador al refrigerador la noche anterior.')}</ul>

      <div style="font-weight:bold;color:${INK};margin-bottom:6px;font-size:14px;">⚠️ Recomendaciones importantes</div>
      <ul style="margin:0 0 14px;padding-left:18px;">
        ${li('Retirar siempre el producto de la bolsa antes de calentar.')}
        ${li('No calentar la bolsa en microondas ni horno.')}
        ${li('Calentar hasta que esté completamente caliente.')}
        ${li('No recalentar más de una vez.')}
        ${li('No volver a congelar una vez descongelado.')}
      </ul>

      <div style="font-weight:bold;color:${BRAND};margin-bottom:6px;font-size:14px;">🚚 Envío de ingredientes</div>
      <p style="margin:0;color:${INK};font-size:13px;line-height:1.5;">
        Los ingredientes deben enviarse ${
          plazo ? `<strong>a más tardar el ${esc(plazo)}</strong>` : 'dentro del plazo acordado'
        }, a través de la aplicación de delivery de tu preferencia, a la dirección
        <strong>${esc(ENVIO_DIRECCION)}</strong>. En caso de ser necesario, puedes agregar el
        siguiente número de contacto para la entrega: <strong>${esc(ENVIO_CONTACTO)}</strong>.
      </p>
    </td></tr>
  </table>`
}

// ── Plantillas por estado ───────────────────────────────────────────────────
const TEMPLATES = {
  solicitud_recibida(pedido) {
    const nombre = esc((pedido.nombre || '').split(' ')[0] || 'hola')
    return {
      subject: 'Sabores de Mamá — Recibimos tu pedido',
      html: baseTemplate({
        titulo: 'Recibimos tu pedido',
        intro: `¡Hola ${nombre}! 🎉 Recibimos tu pedido. Para confirmarlo, realiza la transferencia con los datos de más abajo.`,
        bodyHtml: resumenPedidoHtml(pedido) + datosBancariosHtml(pedido),
        footerNota: 'Tu cupo queda reservado. Una vez validemos el pago, te enviaremos la confirmación.',
      }),
    }
  },
  pagado(pedido, extra = {}) {
    const nombre = esc((pedido.nombre || '').split(' ')[0] || 'hola')
    // Una sola lista con el total por ingrediente (nunca separada por plato):
    // en Cocinera se usa la lista_compras (ya consolidada y editable); en Meal Prep
    // se consolidan los ingredientes de los platos elegidos.
    const ingredientesConsolidados =
      Array.isArray(pedido.lista_compras) && pedido.lista_compras.length
        ? listaComprasHtml(pedido.lista_compras)
        : listaComprasHtml(
            consolidarIngredientes((extra.platosConIng || []).flatMap((p) => p.ingredientes || [])),
            'Lista de ingredientes'
          )
    const esMealPrep = (pedido.servicio || 'meal_prep') === 'meal_prep'
    return {
      subject: '¡Tu pago fue confirmado! 🎉',
      html: baseTemplate({
        titulo: 'Pago confirmado',
        intro: `¡Gracias ${nombre}! ✅ Confirmamos tu pago. Tu pedido se entregará el <strong>${esc(fmtFecha(pedido.fecha_entrega))}</strong>.`,
        bodyHtml:
          resumenPedidoHtml(pedido) +
          ingredientesConsolidados +
          (esMealPrep ? avisosMealPrepHtml(pedido) : ''),
        footerNota: 'Coordinaremos contigo la entrega de los ingredientes según tu servicio.',
      }),
    }
  },
  en_preparacion(pedido) {
    const nombre = esc((pedido.nombre || '').split(' ')[0] || 'hola')
    return {
      subject: 'Tu pedido está en preparación',
      html: baseTemplate({
        titulo: 'En preparación',
        intro: `¡${nombre}, manos a la obra! 👩‍🍳 Tu pedido está en preparación para la entrega del <strong>${esc(fmtFecha(pedido.fecha_entrega))}</strong>.`,
        bodyHtml: resumenPedidoHtml(pedido),
        footerNota: 'Te avisaremos cualquier novedad por este medio.',
      }),
    }
  },
  en_delivery(pedido, extra = {}) {
    const nombre = esc((pedido.nombre || '').split(' ')[0] || 'hola')
    const fotoHtml = extra.fotoUrl
      ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;background:${CREAM};border:1px solid ${BORDER};border-radius:12px;">
           <tr><td style="padding:16px 18px;">
             <div style="font-weight:bold;color:${BRAND};margin-bottom:8px;font-size:14px;">Foto de tu pedido</div>
             <img src="${esc(extra.fotoUrl)}" alt="Foto de tu pedido" style="display:block;width:100%;max-width:100%;border-radius:10px;" />
           </td></tr>
         </table>`
      : ''
    return {
      subject: 'Tu pedido va en camino 🚗',
      html: baseTemplate({
        titulo: 'En delivery',
        intro: `¡${nombre}, tu pedido va en camino! 🚗 Pronto llegará a tu dirección${pedido.comuna ? ` en <strong>${esc(pedido.comuna)}</strong>` : ''}.`,
        bodyHtml: fotoHtml + resumenPedidoHtml(pedido),
        footerNota: 'Mantén tu teléfono a mano por si el repartidor necesita contactarte.',
      }),
    }
  },
  entregado(pedido) {
    const nombre = esc((pedido.nombre || '').split(' ')[0] || 'hola')
    const clientUrl = (process.env.CLIENT_URL || 'https://saboresdemama.com').replace(/\/$/, '')
    const encuestaUrl = `${clientUrl}/encuesta/${pedido.id}/${surveyToken(pedido.id)}`
    return {
      subject: '¡Gracias por tu pedido! ❤️',
      html: baseTemplate({
        titulo: '¡Entregado!',
        intro: `¡${nombre}, esperamos que lo disfrutes! ❤️ Gracias por confiar en Sabores de Mamá.`,
        bodyHtml:
          `<p style="margin:0 0 16px;color:${INK};line-height:1.6;">¡Esperamos que hayas disfrutado tu pedido! Tu opinión es muy importante para nosotros. Nos tomará menos de un minuto conocer tu experiencia. Haz clic en el siguiente botón para responder una breve encuesta.</p>` +
          `<div style="text-align:center;margin:8px 0 4px;"><a href="${encuestaUrl}" style="display:inline-block;background:${BRAND};color:#FFFCF7;text-decoration:none;font-weight:bold;padding:13px 30px;border-radius:999px;font-size:15px;">Responder encuesta</a></div>`,
        footerNota: '¡Hasta la próxima! 🍽️',
      }),
    }
  },
}

export const ESTADOS_VALIDOS = Object.keys(TEMPLATES)

// Para el estado "pagado": obtiene los platos del pedido con sus ingredientes
// (consulta la BD por los ids de plato presentes en pedido.platos).
async function getPlatosConIngredientes(pedido) {
  const arr = Array.isArray(pedido.platos) ? pedido.platos : []
  if (!arr.length) return []
  const ids = arr.map((p) => (typeof p === 'object' && p ? p.id : null)).filter((x) => Number.isInteger(x))

  // Cantidad exacta según nº de comensales (Cocinera); por defecto 5 (receta base).
  const n = Math.min(Math.max(Number(pedido.personas) || 5, 1), 5)

  let porPlato = new Map()
  if (ids.length) {
    try {
      const { rows } = await query(
        `SELECT plato_id, nombre, unidad, p${n} AS cantidad, p5 FROM ingredientes WHERE plato_id = ANY($1) ORDER BY id`,
        [ids]
      )
      for (const r of rows) {
        if (!porPlato.has(r.plato_id)) porPlato.set(r.plato_id, [])
        porPlato.get(r.plato_id).push({ nombre: r.nombre, cantidad: r.cantidad ?? r.p5, unidad: r.unidad })
      }
    } catch (err) {
      console.error('[mail] No se pudieron cargar ingredientes:', err.message)
    }
  }

  return arr.map((p) => {
    const id = typeof p === 'object' && p ? p.id : null
    return { nombre: platoNombre(p), ingredientes: id ? porPlato.get(id) || [] : [] }
  })
}

/**
 * Envía el correo del estado indicado. No lanza si falla: devuelve
 * { ok:false, ... } y registra el error, para no romper la operación principal.
 */
export async function sendEstadoEmail(pedido, estado) {
  const builder = TEMPLATES[estado]
  if (!builder) return { ok: false, skipped: true, reason: `estado sin plantilla: ${estado}` }
  if (!pedido?.email) return { ok: false, skipped: true, reason: 'pedido sin email' }

  // Datos extra por estado (ingredientes para "pagado"; foto para "en_delivery").
  const extra = {}
  if (estado === 'pagado') extra.platosConIng = await getPlatosConIngredientes(pedido)
  if (estado === 'en_delivery' && pedido.foto_entrega) {
    // URL firmada de larga duración (≈7 días) para embeber la foto en el correo.
    // Si el almacenamiento no está configurado, se omite sin romper el envío.
    try {
      extra.fotoUrl = await presignGet(pedido.foto_entrega, 604800)
    } catch (err) {
      console.error('[mail] no se pudo firmar la foto de entrega:', err?.message || err)
    }
  }

  const { subject, html } = builder(pedido, extra)
  return dispatchMail({ to: pedido.email, subject, html, label: estado })
}

/**
 * Envía un correo (Resend si hay API key; si no, SMTP; si no, lo omite).
 * Centraliza la lógica de proveedor para todos los correos transaccionales.
 */
async function dispatchMail({ to, subject, html, label = 'correo' }) {
  const from = mailFrom()
  if (process.env.RESEND_API_KEY) {
    try {
      const id = await sendViaResend({ apiKey: process.env.RESEND_API_KEY, from, to, subject, html })
      console.log(`[mail] Enviado "${label}" → ${to} (resend id: ${id})`)
      return { ok: true, messageId: id, provider: 'resend' }
    } catch (err) {
      console.error(`[mail] Error (Resend) enviando "${label}" → ${to}:`, err.message)
      return { ok: false, error: err.message, provider: 'resend' }
    }
  }
  const tx = getTransporter()
  if (!tx) {
    console.log(`[mail] Sin proveedor de correo. Omitiendo "${label}" → ${to} (asunto: ${subject})`)
    return { ok: false, skipped: true, reason: 'sin_proveedor' }
  }
  try {
    const info = await tx.sendMail({ from, to, subject, html })
    console.log(`[mail] Enviado "${label}" → ${to} (id: ${info.messageId})`)
    return { ok: true, messageId: info.messageId, provider: 'smtp' }
  } catch (err) {
    console.error(`[mail] Error enviando "${label}" → ${to}:`, err.message)
    return { ok: false, error: err.message, provider: 'smtp' }
  }
}

/**
 * Correo de recuperación de contraseña para clientes.
 */
export async function sendPasswordReset(email, resetUrl) {
  const html = baseTemplate({
    titulo: 'Recuperar contraseña',
    intro: 'Recibimos una solicitud para restablecer tu contraseña. Si no fuiste tú, ignora este correo.',
    bodyHtml: `
      <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="padding:8px 0">
        <a href="${esc(resetUrl)}" style="display:inline-block;background:${BRAND};color:#FFFCF7;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:10px;font-size:14px;">
          Restablecer contraseña
        </a>
      </td></tr></table>
      <p style="margin:14px 0 0;font-size:12px;color:${MUTED};word-break:break-all;">
        O copia este enlace en tu navegador:<br>${esc(resetUrl)}
      </p>`,
    footerNota: 'El enlace expira en 1 hora. Si no solicitaste el cambio, tu contraseña sigue intacta.',
  })
  return dispatchMail({ to: email, subject: 'Sabores de Mamá — Recuperar contraseña', html, label: 'recuperar' })
}

export default { sendEstadoEmail, sendPasswordReset, ESTADOS_VALIDOS }
