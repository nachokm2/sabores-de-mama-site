import emailjs from '@emailjs/browser'
import { RECIPE_DB, SHOPPING_CATS } from '../data/ingredients'

const SERVICE_ID   = import.meta.env.VITE_EMAILJS_SERVICE_ID
const MEALPREP_TPL = import.meta.env.VITE_EMAILJS_MEALPREP_TEMPLATE_ID
const PUBLIC_KEY   = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

// ── Codifica caracteres no-ASCII como entidades HTML numericas ────────────────
// Garantiza compatibilidad con cualquier cliente de correo
function enc(str) {
  if (!str && str !== 0) return ''
  let out = ''
  const s = String(str)
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i)
    out += code > 127 ? '&#' + code + ';' : s[i]
  }
  return out
}

// ── Escala de cantidades ──────────────────────────────────────────────────────
function scaleQty(qty, unit, factor) {
  if (qty === null) return null
  const scaled = qty * factor
  if (['g', 'ml'].includes(unit))                                        return Math.round(scaled / 50) * 50 || 50
  if (['taza', 'tazas'].includes(unit))                                  return Math.round(scaled * 4) / 4 || 0.25
  if (['cda', 'cdas'].includes(unit))                                    return Math.round(scaled * 2) / 2 || 0.5
  if (['cdta', 'cdtas'].includes(unit))                                  return Math.round(scaled * 2) / 2 || 0.5
  if (unit.includes('unidad') || unit === 'unidades' || unit === 'medianas') return Math.ceil(scaled)
  if (['latas', 'hojas', 'dientes', 'rebanadas', 'presas'].includes(unit)) return Math.ceil(scaled)
  return Math.round(scaled * 10) / 10 || qty
}

function fmtQty(qty, unit) {
  if (qty === null) return 'A gusto'
  return qty + ' ' + unit
}

// ── Lista consolidada de compras ──────────────────────────────────────────────
function buildShoppingList(dishes, personas) {
  const factor = personas / 5
  const map = {}

  dishes.forEach(dish => {
    const recipe = RECIPE_DB[dish]
    if (!recipe) return
    recipe.ingredients.forEach(ing => {
      if (ing.cat === 'seasoning') return
      const key = ing.name.toLowerCase()
      if (!map[key]) map[key] = { name: ing.name, qty: 0, unit: ing.unit, cat: ing.cat, buy: ing.buy }
      if (ing.qty !== null) map[key].qty += ing.qty * factor
    })
  })

  const grouped = {}
  SHOPPING_CATS.forEach(c => { grouped[c.key] = [] })
  Object.values(map).forEach(item => {
    const cat = item.cat in grouped ? item.cat : 'other'
    grouped[cat].push(item)
  })
  return grouped
}

// ── Genera el HTML del email ──────────────────────────────────────────────────
function fmtCLP(n) {
  if (!n && n !== 0) return '?'
  return '$' + Number(n).toLocaleString('es-CL')
}

export function buildMealPrepHTML(data, personas) {
  const { nombre, comuna, telefono, platos = [], deliveryPrice = null, condiciones = null } = data
  const totalPago = 60000 + (deliveryPrice || 0)
  const factor = personas / 5
  const fecha = new Date().toLocaleDateString('es-CL')
  const shopping = buildShoppingList(platos, personas)
  const knownDishes   = platos.filter(d => RECIPE_DB[d])
  const unknownDishes = platos.filter(d => !RECIPE_DB[d])

  const css = [
    'body{font-family:Arial,sans-serif;color:#2C1810;margin:0;padding:0;background:#f5edd6}',
    '.wrap{max-width:680px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden}',
    '.header{background:#2C1810;color:#D4A853;padding:24px 32px;text-align:center}',
    '.header h1{margin:0;font-size:22px;letter-spacing:1px}',
    '.header p{margin:6px 0 0;color:#E8C99A;font-size:13px}',
    '.section{padding:20px 32px;border-bottom:1px solid #f0e6ce}',
    '.section h2{color:#2C1810;font-size:16px;margin:0 0 12px;border-left:4px solid #C8873A;padding-left:10px}',
    '.dish-title{color:#C8873A;font-weight:bold;font-size:15px;margin:16px 0 6px}',
    'table{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:8px}',
    'th{background:#f0e6ce;color:#2C1810;text-align:left;padding:7px 10px}',
    'td{padding:6px 10px;border-bottom:1px solid #f5edd6}',
    'tr:last-child td{border-bottom:none}',
    '.shop-cat{font-weight:bold;color:#C8873A;font-size:13px;margin:12px 0 4px}',
    'ul{margin:0 0 8px;padding-left:20px;font-size:13px}',
    'li{margin:3px 0}',
    '.note{background:#fff8ec;border-left:4px solid #D4A853;padding:10px 16px;font-size:13px;margin:12px 0;border-radius:0 4px 4px 0}',
    '.cons-row{display:flex;gap:24px;font-size:13px;margin-bottom:6px}',
    '.footer{background:#2C1810;color:#E8C99A;text-align:center;padding:16px 32px;font-size:12px}',
    '.sep{border:none;border-top:1px solid #f0e6ce;margin:16px 0}',
  ].join('')

  // Tablas por plato
  let dishTables = ''
  knownDishes.forEach(dishName => {
    const recipe = RECIPE_DB[dishName]
    const rows = recipe.ingredients.map(ing => {
      const scaled = scaleQty(ing.qty, ing.unit, factor)
      return '<tr><td>' + enc(ing.name) + '</td><td><strong>' + enc(fmtQty(scaled, ing.unit)) + '</strong></td></tr>'
    }).join('')
    dishTables += '<p class="dish-title">' + enc(recipe.emoji) + ' ' + enc(dishName) + '</p>'
    dishTables += '<table><tr><th>Ingrediente</th><th>' + enc(personas) + ' persona' + (personas !== 1 ? 's' : '') + '</th></tr>' + rows + '</table>'
  })
  if (unknownDishes.length) {
    dishTables += '<div class="note"><strong>Nota:</strong> Los siguientes platos se coordinar&#225;n directamente: ' + unknownDishes.map(enc).join(', ') + '.</div>'
  }

  // Lista de compras
  let shopHTML = ''
  SHOPPING_CATS.forEach(({ key, label }) => {
    const items = shopping[key]
    if (!items?.length) return
    shopHTML += '<p class="shop-cat">' + enc(label) + '</p><ul>'
    items.forEach(item => {
      const qty = item.qty ? fmtQty(Math.round(item.qty * 10) / 10, item.unit) : ''
      const buy = item.buy ? ' &rarr; ' + enc(item.buy) : ''
      shopHTML += '<li><strong>' + enc(item.name) + '</strong>' + (qty ? ': ' + enc(qty) : '') + buy + '</li>'
    })
    shopHTML += '</ul>'
  })

  // Conservacion
  let consHTML = ''
  knownDishes.forEach(dishName => {
    const r = RECIPE_DB[dishName]
    consHTML += '<p class="dish-title">' + enc(r.emoji) + ' ' + enc(dishName) + '</p>'
    consHTML += '<div class="cons-row">'
    consHTML += '<span>Refrigerado: <strong>' + enc(r.conservation.fridge) + '</strong></span>'
    consHTML += '<span>Congelado: <strong>' + enc(r.conservation.freezer) + '</strong></span>'
    consHTML += '</div><hr class="sep">'
  })

  // Calentado
  let heatHTML = ''
  knownDishes.forEach(dishName => {
    const r = RECIPE_DB[dishName]
    heatHTML += '<p class="dish-title">' + enc(r.emoji) + ' ' + enc(dishName) + '</p>'
    heatHTML += '<ul><li>Microondas: ' + enc(r.heating.microwave) + '</li>'
    heatHTML += '<li>Horno: ' + enc(r.heating.oven) + '</li></ul><hr class="sep">'
  })

  // Construir el HTML final (texto estatico ya sin tildes para evitar problemas)
  return '<!DOCTYPE html><html><head>'
    + '<meta charset="UTF-8">'
    + '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">'
    + '<style>' + css + '</style>'
    + '</head><body>'
    + '<div class="wrap">'

    + '<div class="header">'
    + '<h1>MEAL PREP - SABORES DE MAM&#193;</h1>'
    + '<p>Lista de ingredientes | ' + enc(fecha) + '</p>'
    + '<p>' + enc(nombre) + ' &bull; ' + enc(comuna) + ' &bull; ' + enc(telefono) + '</p>'
    + (condiciones ? '<p style="color:#C8873A;font-size:12px;margin:4px 0 0">&#9888;&#65039; Condici&#243;n alimenticia: <strong>' + enc(condiciones) + '</strong></p>' : '')
    + '</div>'

    // ── SECCION PAGO ──────────────────────────────────────────────────────────
    + '<div class="section" style="background:#fff8ec;border-left:4px solid #C8873A">'
    + '<h2 style="color:#C8873A;font-size:18px;margin:0 0 4px">&#9203; Pago del servicio</h2>'
    + '<p style="font-size:13px;color:#8B0000;font-weight:bold;margin:0 0 12px">'
    + 'Tienes <strong>30 minutos</strong> para realizar la transferencia desde que recibiste este correo.'
    + '</p>'
    + '<table style="width:100%;font-size:13px;border-collapse:collapse">'
    + '<tr><td style="padding:5px 8px;width:160px;color:#666">Servicio Meal Prep</td><td style="padding:5px 8px">$60.000</td></tr>'
    + (deliveryPrice != null
        ? '<tr style="background:#f5edd6"><td style="padding:5px 8px;color:#666">Delivery a ' + enc(comuna) + '</td><td style="padding:5px 8px">' + enc(fmtCLP(deliveryPrice)) + '</td></tr>'
          + '<tr><td style="padding:7px 8px"><strong>TOTAL A PAGAR</strong></td><td style="padding:7px 8px"><strong style="font-size:16px;color:#2C1810">' + enc(fmtCLP(totalPago)) + '</strong></td></tr>'
        : '<tr><td style="padding:7px 8px"><strong>TOTAL A PAGAR</strong></td><td style="padding:7px 8px"><strong style="font-size:16px;color:#2C1810">$60.000</strong></td></tr>'
    )
    + '<tr style="background:#f5edd6"><td style="padding:5px 8px"><strong>Titular</strong></td><td style="padding:5px 8px">B&#225;rbara Solange Palma Zavalla</td></tr>'
    + '<tr><td style="padding:5px 8px"><strong>RUT</strong></td><td style="padding:5px 8px">20.143.670-2</td></tr>'
    + '<tr style="background:#f5edd6"><td style="padding:5px 8px"><strong>Banco</strong></td><td style="padding:5px 8px">Mercado Pago</td></tr>'
    + '<tr><td style="padding:5px 8px"><strong>Tipo de cuenta</strong></td><td style="padding:5px 8px">Cuenta Vista</td></tr>'
    + '<tr style="background:#f5edd6"><td style="padding:5px 8px"><strong>N&#176; de cuenta</strong></td><td style="padding:5px 8px"><strong style="font-size:15px">1095488571</strong></td></tr>'
    + '</table>'
    + '<div class="note" style="margin-top:12px;background:#fff0f0;border-left-color:#C8873A">'
    + '<strong>Env&#237;a el comprobante de pago a:</strong><br>'
    + '<a href="mailto:estela.zavalla.saboresdemama@gmail.com" style="color:#C8873A;font-weight:bold">'
    + 'estela.zavalla.saboresdemama@gmail.com</a><br>'
    + '<span style="font-size:12px;color:#666">Indica tu nombre completo y la fecha del servicio en el mensaje.</span>'
    + '</div>'
    + '<p style="font-size:12px;color:#999;margin:8px 0 0">'
    + 'Sin confirmaci&#243;n de pago dentro de los 30 minutos, el servicio podr&#237;a quedar disponible para otro cliente.'
    + '</p>'
    + '</div>'
    // ── FIN SECCION PAGO ───────────────────────────────────────────────────────

    + '<div class="section"><div class="note">'
    + '<strong>Importante:</strong><br>'
    + 'Los ingredientes se dividen en dos secciones:<br>'
    + '&bull; <strong>Ingredientes por plato:</strong> cantidades reales utilizadas en las preparaciones.<br>'
    + '&bull; <strong>Sugerencia de compra:</strong> formato en que normalmente se venden en supermercado '
    + '(pueden existir peque&#241;os excedentes).'
    + '</div></div>'

    + '<div class="section">'
    + '<h2>Lista de ingredientes por plato</h2>'
    + (dishTables || '<p><em>Platos a coordinar directamente.</em></p>')
    + '</div>'

    + '<div class="section">'
    + '<h2>Sugerencia de compra (formato supermercado)</h2>'
    + shopHTML
    + '<div class="note"><strong>Incluye el servicio:</strong><br>'
    + '&bull; Ali&#241;os y condimentos b&#225;sicos (sal, pimienta, or&#233;gano, etc.)<br>'
    + '&bull; Preparaci&#243;n completa y porcionado sellado al vac&#237;o'
    + '</div>'
    + '<div class="note">La lista est&#225; pensada para facilitar la compra en supermercado. '
    + 'Algunos productos pueden sobrar debido a los formatos de venta habituales.</div>'
    + '</div>'

    + '<div class="section">'
    + '<h2>Conservaci&#243;n (sellado al vac&#237;o)</h2>'
    + (consHTML || '<p><em>Consultar directamente.</em></p>')
    + '<div class="note">'
    + '&bull; Mantener refrigerado entre 0 y 4&#176;C<br>'
    + '&bull; Si no se consumir&#225; dentro de los primeros d&#237;as, congelar inmediatamente<br>'
    + '&bull; Una vez descongelado, no volver a congelar<br>'
    + '&bull; Calentar completamente antes de consumir'
    + '</div></div>'

    + '<div class="section">'
    + '<h2>Instrucciones de calentado</h2>'
    + '<div class="note">Todos los productos son entregados sellados al vac&#237;o y porcionados. '
    + 'Retirar siempre el producto de la bolsa antes de calentar.</div>'
    + (heatHTML || '<p><em>Consultar directamente.</em></p>')
    + '<div class="note"><strong>Recomendaciones:</strong><br>'
    + '&bull; Retirar siempre el producto de la bolsa antes de calentar<br>'
    + '&bull; No calentar la bolsa en microondas ni horno<br>'
    + '&bull; Calentar hasta que est&#233; completamente caliente<br>'
    + '&bull; No recalentar m&#225;s de una vez<br>'
    + '&bull; No volver a congelar una vez descongelado'
    + '</div></div>'

    + '<div class="section">'
    + '<h2>Env&#237;o de ingredientes</h2>'
    + '<p style="font-size:13px">Los ingredientes deben ser enviados como m&#225;ximo el d&#237;a anterior al servicio, '
    + 'a trav&#233;s de la aplicaci&#243;n de delivery de su preferencia (Rappi, PedidosYa, etc.) '
    + 'a la direcci&#243;n que se indicar&#225; al confirmar el servicio.<br><br>'
    + '<strong>Contacto para la entrega:</strong> +56966705821</p>'
    + '</div>'

    + '<div class="footer">'
    + 'Sabores de Mam&#225; &bull; Cocina casera con amor<br>'
    + '<span style="color:#C8873A">@saboresdemama.casero</span>'
    + '</div>'

    + '</div></body></html>'
}

// ── Envia el email al cliente ─────────────────────────────────────────────────
export async function sendMealPrepEmail(data, personas) {
  if (!SERVICE_ID || !MEALPREP_TPL || !PUBLIC_KEY) {
    console.warn('[sendMealPrepEmail] Plantilla Meal Prep no configurada (VITE_EMAILJS_MEALPREP_TEMPLATE_ID)')
    return { ok: false, reason: 'not_configured' }
  }
  if (!data.correo) return { ok: false, reason: 'no_email' }

  const html = buildMealPrepHTML(data, personas)

  try {
    await emailjs.send(SERVICE_ID, MEALPREP_TPL, {
      to_email:  data.correo,
      to_name:   data.nombre,
      html_body: html,
      platos:    (data.platos || []).join(', ') || '-',
      personas,
      fecha:     new Date().toLocaleDateString('es-CL'),
    }, { publicKey: PUBLIC_KEY })
    return { ok: true }
  } catch (err) {
    console.error('[sendMealPrepEmail]', err)
    return { ok: false, reason: err }
  }
}
