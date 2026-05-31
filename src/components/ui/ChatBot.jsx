import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { sendLead } from '../../lib/sendLead'
import { sendMealPrepEmail } from '../../lib/generateMealPrepEmail'
import { DELIVERY_PRICES } from '../../data/menu'

function getDeliveryPrice(comuna) {
  const key = comuna.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
  return DELIVERY_PRICES[key] ?? null
}

function fmtCLP(n) {
  return '$' + n.toLocaleString('es-CL')
}

const WA_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER 

// ── Datos de platos ──────────────────────────────────────────────────────────
const CATEGORIAS = [
  {
    id: 'carnes', label: 'Carnes y Pollo', icon: '🍗',
    items: ['Albóndigas', 'Pollo arvejado', 'Pollo al coñac', 'Pollo al curry', 'Pastel de choclo', 'Charquicán', 'Bistec con verduras', 'Bolognesa'],
  },
  {
    id: 'legumbres', label: 'Legumbres y Caldos', icon: '🥘',
    items: ['Lentejas', 'Porotos', 'Garbanzos', 'Carbonada', 'Cazuela'],
  },
  {
    id: 'quiches', label: 'Quiches y Tortillas', icon: '🥧',
    items: ['Quiche Lorraine', 'Quiche de Champiñón', 'Tortilla de Verduras', 'Tortilla Española'],
  },
  {
    id: 'otros', label: 'Otros', icon: '🍽️',
    items: ['Lasaña', 'Pastel de papas', 'Pastel de zapallo italiano', 'Pizza', 'Empanadas'],
  },
  {
    id: 'acomp', label: 'Acompañamientos', icon: '🍚',
    items: ['Arroz', 'Puré', 'Verduras salteadas', 'Ensaladas'],
  },
  {
    id: 'postres', label: 'Postres', icon: '🍮',
    items: ['Leche asada', 'Mousse', 'Queque integral'],
  },
]

const COMUNAS_MEAL = ['las condes', 'providencia', 'la reina', 'ñuñoa', 'nuñoa', 'vitacura', 'santiago', 'lo barnechea', 'san miguel']
const COMUNAS_DOM  = ['las condes', 'providencia', 'vitacura', 'ñuñoa', 'nuñoa']

function norm(s) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

function checkCobertura(input, service) {
  const n = norm(input)
  const list = service === 'mealprep' ? COMUNAS_MEAL : COMUNAS_DOM
  return list.find(c => n.includes(norm(c))) || null
}

function toTitleCase(s) {
  return s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

// ── Detectar "no tengo más preguntas" ────────────────────────────────────────
const NO_MORE_QUESTIONS = /^(no|nop|nope|no gracias|nada|listo|ya|esta bien|está bien|con eso|con eso esta bien|con eso es suficiente|es todo|eso es todo|continuar|siguiente|no tengo|no hay|ninguna|de acuerdo|ok|okay|perfecto|claro|adelante|sí|si)(\s|$)/

// ── FAQ ──────────────────────────────────────────────────────────────────────
function matchFAQ(q) {
  const n = norm(q)
  if (n.match(/como funciona|cómo funciona|como es el servicio|en que consiste|en qué consiste/))
    return 'Ofrecemos dos servicios:\n\n📦 *Meal Prep* ($60.000): Preparo tus comidas en mi cocina, porcionadas y selladas al vacío. Tú envías los ingredientes.\n\n🏠 *Cocinera a Domicilio* ($55.000): Voy a tu hogar y cocino hasta 5 preparaciones usando tus ingredientes.'
  if (n.match(/ingrediente|compra|quien compra|yo compro/))
    return 'Los ingredientes los proporcionas tú. Para Meal Prep, puedes enviarlos vía app de delivery (Rappi, PedidosYa). Para Cocinera a Domicilio, debes tenerlos en casa el día del servicio.'
  if (n.match(/delivery|entrega|despacho|llega|envio/))
    return 'El Meal Prep incluye entrega a domicilio con un costo adicional. La Cocinera a Domicilio se traslada directamente a tu hogar.'
  if (n.match(/precio|valor|costo|cuanto cuesta|cuánto cuesta/))
    return 'El Meal Prep tiene un valor base de $60.000 + delivery. La Cocinera a Domicilio cuesta $55.000 (traslado al hogar).'
  if (n.match(/tiempo|hora|tarda|demora|dura/))
    return 'La Cocinera a Domicilio permanece entre 2 y 5 horas según la cantidad de preparaciones. El Meal Prep se coordina previamente y la entrega depende del delivery.'
  if (n.match(/vacio|vacío|sellado|conservar|guardar/))
    return 'En el Meal Prep, cada preparación se porciona individualmente y se sella al vacío para que puedas conservarla durante la semana con total seguridad.'
  if (n.match(/porcion|porción|rinde|alcanza|porciones/))
    return 'Cada preparación rinde entre 2 y 5 porciones según el plato. Indícanos la cantidad de personas y coordinamos las porciones adecuadas.'
  if (n.match(/preparacion|preparación|cuantos platos|cuántos platos|maximo|máximo/))
    return 'Puedes elegir hasta 5 preparaciones por servicio.'
  if (n.match(/limpia|limpio|orden|ordenada/))
    return 'Al finalizar el servicio de Cocinera a Domicilio, la cocina queda completamente limpia y ordenada.'
  if (n.match(/pago|pagar|transferencia|efectivo|mercadopago/))
    return 'Esa información debe ser confirmada por nuestro equipo para entregarte una respuesta precisa.'
  if (n.match(/cobertura|comunas|sectores|zonas/))
    return 'Meal Prep: Las Condes, Providencia, La Reina, Ñuñoa, Vitacura, Santiago, Lo Barnechea, San Miguel.\nCocinera a Domicilio: Las Condes, Providencia, Vitacura, Ñuñoa.'
  return null
}

// ── Calificación ─────────────────────────────────────────────────────────────
function qualifyLead(d) {
  let s = 0
  if (d.platos?.length >= 3) s += 3; else if (d.platos?.length >= 1) s += 1
  if (d.personas >= 4) s += 2; else if (d.personas >= 2) s += 1
  if (d.correo) s += 1
  if (d.telefono) s += 2
  if (!d.dudas?.length) s += 1
  if (s >= 6) return 'Alto'
  if (s >= 3) return 'Medio'
  return 'Bajo'
}

// ── WhatsApp message ─────────────────────────────────────────────────────────
function buildWAMsg(d) {
  const isMeal    = d.service === 'mealprep'
  const svcLabel  = isMeal ? 'Meal Prep' : 'Cocinera a Domicilio'
  const svcPrecio = isMeal ? '$60.000 + delivery' : '$55.000'
  const sep       = '─────────────────────'
  const interesLabel = d.interes === 'Alto' ? 'Alto ★★★' : d.interes === 'Medio' ? 'Medio ★★' : 'Bajo ★'

  const lines = [
    '*[ NUEVO PEDIDO ] SABORES DE MAMA*',
    sep,
    '',
    `*SERVICIO:* ${svcLabel}`,
    `*VALOR:* ${svcPrecio}`,
    '',
    '*CLIENTE*',
    `Nombre: ${d.nombre}`,
    `Tel: ${d.telefono}`,
    d.correo ? `Email: ${d.correo}` : null,
    `Comuna: ${d.comuna}`,
    '',
    d.platos?.length ? `*PLATOS (${d.platos.length}/5)*` : null,
    ...(d.platos?.map(p => `  • ${p}`) || []),
    '',
    `*PERSONAS:* ${d.personas}`,
    d.condiciones ? `*CONDICION ALIMENTICIA:* ${d.condiciones}` : null,
    d.dudas?.filter(q => q.length >= 6).length
      ? `\n*CONSULTAS PREVIAS*\n${d.dudas.filter(q => q.length >= 6).map(q => `  • ${q}`).join('\n')}`
      : null,
    '',
    sep,
    `*Interés:* ${interesLabel}`,
    `_Vía asistente virtual · ${new Date().toLocaleDateString('es-CL')}_`,
  ]

  return lines.filter(l => l !== null).join('\n')
}

// ── Helpers visuales ─────────────────────────────────────────────────────────
function WaIconLg() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

function WaIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

function BotBubble({ text }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] bg-white/8 border border-white/10 text-ivory/90 rounded-2xl rounded-bl-sm px-3.5 py-2.5 font-body text-xs leading-relaxed">
        {text.split('\n').map((line, i) => (
          <p key={i} className={i > 0 ? 'mt-1' : ''}>
            {line.split(/\*([^*]+)\*/).map((part, j) =>
              j % 2 === 1 ? <strong key={j} className="font-semibold text-ivory">{part}</strong> : part
            )}
          </p>
        ))}
      </div>
    </div>
  )
}

function UserBubble({ text }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] bg-amber text-espresso rounded-2xl rounded-br-sm px-3.5 py-2.5 font-body text-xs font-medium leading-relaxed">
        {text}
      </div>
    </div>
  )
}

function TypingDots() {
  return (
    <div className="flex justify-start">
      <div className="bg-white/8 border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
        {[0, 0.15, 0.3].map((delay, i) => (
          <motion.span
            key={i}
            className="block w-1.5 h-1.5 rounded-full bg-warm-gray"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay, ease: 'easeInOut' }}
          />
        ))}
      </div>
    </div>
  )
}

function SummaryCard({ data }) {
  const ic = data.interes === 'Alto' ? 'text-green-400' : data.interes === 'Medio' ? 'text-amber' : 'text-warm-gray'
  return (
    <div className="bg-white/5 border border-white/15 rounded-xl p-3 font-body text-xs space-y-1.5 mt-2">
      <Row l="Servicio"  v={data.service === 'mealprep' ? 'Meal Prep' : 'Cocinera a Domicilio'} />
      <Row l="Comuna"    v={data.comuna} />
      <Row l="Cliente"   v={data.nombre} />
      <Row l="Teléfono"  v={data.telefono} />
      {data.correo && <Row l="Correo" v={data.correo} />}
      <div className="flex gap-2 flex-wrap">
        <span className="text-warm-gray shrink-0">Platos:</span>
        <span className="text-ivory/80">{data.platos?.join(', ')}</span>
      </div>
      <Row l="Personas"  v={data.personas} />
      {data.condiciones && <Row l="Condiciones" v={data.condiciones} />}
      <div className="flex items-center gap-2 pt-1.5 border-t border-white/10">
        <span className="text-warm-gray">Interés:</span>
        <span className={`font-bold ${ic}`}>{data.interes}</span>
      </div>
    </div>
  )
}

function Row({ l, v }) {
  return (
    <div className="flex gap-2">
      <span className="text-warm-gray shrink-0 min-w-[62px]">{l}:</span>
      <span className="text-ivory/80">{v}</span>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ChatBot() {
  const [open, setOpen]         = useState(false)
  const [step, setStep]         = useState('init')
  const [msgs, setMsgs]         = useState([])
  const [typing, setTyping]     = useState(false)
  const [input, setInput]       = useState('')
  const [catOpen, setCatOpen]   = useState(null)
  const [platos, setPlatos]     = useState([])
  const [summary, setSummary]   = useState(null)
  const [data, setData]         = useState({
    service: null, comuna: null, nombre: null, telefono: null,
    correo: null, personas: null, platos: [], dudas: [], interes: null,
  })

  const endRef  = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, typing])

  // Escucha el evento global para abrir el bot desde cualquier CTA del sitio
  useEffect(() => {
    const handler = () => {
      setMsgs([])
      setStep('init')
      setInput('')
      setPlatos([])
      setCatOpen(null)
      setSummary(null)
      setData({ service: null, comuna: null, deliveryPrice: null, nombre: null, telefono: null, correo: null, personas: null, platos: [], condiciones: null, dudas: [], interes: null })
      setTyping(false)
      setOpen(true)
    }
    window.addEventListener('sabores:open-chatbot', handler)
    return () => window.removeEventListener('sabores:open-chatbot', handler)
  }, [])

  useEffect(() => {
    if (open && step === 'init') initChat()
  }, [open, step])

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

  function addBot(text, extra = {}) {
    setMsgs(p => [...p, { id: Date.now() + Math.random(), from: 'bot', text, ...extra }])
  }
  function addUser(text) {
    setMsgs(p => [...p, { id: Date.now() + Math.random(), from: 'user', text }])
  }

  async function bot(text, nextStep, delay = 900) {
    setTyping(true)
    await sleep(delay)
    setTyping(false)
    addBot(text)
    setStep(nextStep)
    await sleep(80)
    inputRef.current?.focus()
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  async function initChat() {
    await bot(
      'Hola 👋 Bienvenido a *Sabores de Mamá*.\n\n¿Qué servicio deseas contratar?',
      'servicio', 600
    )
  }

  // ── Paso 1: Servicio ──────────────────────────────────────────────────────
  async function onServicio(svc) {
    addUser(svc === 'mealprep' ? 'Meal Prep 📦' : 'Cocinera a Domicilio 🏠')
    setData(p => ({ ...p, service: svc }))
    setStep('waiting')
    await bot('Perfecto. ¿En qué *comuna* o dirección necesitas el servicio?', 'cobertura')
  }

  // ── Paso 2: Cobertura ─────────────────────────────────────────────────────
  async function onCobertura() {
    const val = input.trim()
    if (!val) return
    setInput('')
    addUser(val)
    setStep('waiting')

    const found = checkCobertura(val, data.service)
    const label = found ? toTitleCase(found) : val
    const deliveryPrice = data.service === 'mealprep' ? getDeliveryPrice(found || val) : null
    setData(p => ({ ...p, comuna: label, deliveryPrice }))

    if (found) {
      const deliveryMsg = deliveryPrice != null
        ? `\n\nEl costo de delivery a *${label}* es *${fmtCLP(deliveryPrice)}*.\n\nElige los platos que te interesan (hasta 5).`
        : '\n\nElige los platos que te interesan (hasta 5).'
      await bot('¡Genial! Tenemos cobertura en tu zona. 🎉' + deliveryMsg, 'platos')
    } else {
      await bot(
        'Actualmente no contamos con cobertura para tu comuna. Estamos trabajando para ampliar nuestras zonas de atención.\n\n¿Me dejas tus datos para avisarte cuando lleguemos a tu sector?',
        'nc_nombre'
      )
    }
  }

  // ── Paso 3: Platos ────────────────────────────────────────────────────────
  async function onPlatosConfirm() {
    const isMeal = data.service === 'mealprep'
    if (isMeal && platos.length < 5) {
      await bot('Para el Meal Prep necesitas seleccionar *exactamente 5 platos*. Te faltan ' + (5 - platos.length) + '.', 'platos', 300)
      return
    }
    if (!platos.length) return
    addUser(platos.join(', '))
    setData(p => ({ ...p, platos }))
    setStep('waiting')
    await bot('¿Para *cuántas personas* necesitas el servicio?', 'personas')
  }

  // ── Paso 4: Personas ──────────────────────────────────────────────────────
  async function onPersonas() {
    const val = input.trim()
    const n = parseInt(val)
    if (isNaN(n) || n < 1) {
      addUser(val)
      setInput('')
      await bot('Por favor, ingresa un número válido de personas.', 'personas', 400)
      return
    }
    setInput('')
    addUser(`${n} persona${n !== 1 ? 's' : ''}`)
    setData(p => ({ ...p, personas: n }))
    setStep('waiting')
    await bot('¿Tienes alguna *condición alimenticia* o restricción de dieta que debamos considerar?\n\nEj: diabetes, sin lactosa, sin gluten, alergia a algún alimento o condimento.\n\nSi no tienes ninguna, escribe "ninguna".', 'condiciones')
  }

  // ── Paso 4b: Condiciones alimenticias ────────────────────────────────────────
  async function onCondiciones() {
    const val = input.trim()
    if (!val) return
    setInput('')
    const noCondicion = NO_MORE_QUESTIONS.test(norm(val)) || norm(val) === 'ninguna' || norm(val) === 'no tengo' || norm(val) === 'no'
    const condiciones = noCondicion ? null : val
    addUser(condiciones || 'Ninguna')
    setData(p => ({ ...p, condiciones }))
    setStep('waiting')
    await bot('¿Tienes alguna pregunta sobre el servicio?\n\nPuedes escribirla aquí o *continuar directamente*.', 'dudas')
  }

  // ── Paso 5: Dudas ─────────────────────────────────────────────────────────
  async function onDuda() {
    const val = input.trim()
    if (!val) return
    setInput('')

    // Si el usuario indica que no tiene más preguntas, continuar
    if (NO_MORE_QUESTIONS.test(norm(val))) {
      await onDudasSaltar()
      return
    }

    addUser(val)
    setData(p => ({ ...p, dudas: [...p.dudas, val] }))
    setStep('waiting')
    const resp = matchFAQ(val) || 'Esa información debe ser confirmada por nuestro equipo para entregarte una respuesta precisa.'
    await bot(resp + '\n\n¿Tienes alguna otra pregunta?', 'dudas')
  }

  async function onDudasSaltar() {
    addUser('No tengo más preguntas')
    setStep('waiting')
    await bot('¡Perfecto! Para finalizar, ¿cuál es tu *nombre*?', 'datos_nombre')
  }

  // ── Paso 6: Datos ─────────────────────────────────────────────────────────
  async function onNombre() {
    const val = input.trim()
    if (!val) return
    setInput('')
    addUser(val)
    setData(p => ({ ...p, nombre: val }))
    setStep('waiting')
    await bot(`Mucho gusto, ${val.split(' ')[0]} 😊\n\n¿Cuál es tu número de *teléfono*?`, 'datos_tel')
  }

  async function onTelefono() {
    const val = input.trim()
    if (!val) return
    setInput('')
    addUser(val)
    setData(p => ({ ...p, telefono: val }))
    setStep('waiting')
    const correoMsg = data.service === 'mealprep'
      ? '¿Cuál es tu *correo electrónico*? Lo necesitamos para enviarte la lista de ingredientes y guía de conservación.'
      : '¿Cuál es tu *correo electrónico*? _(opcional — escribe "omitir" si prefieres)_'
    await bot(correoMsg, 'datos_correo')
  }

  async function onCorreo() {
    const val = input.trim()
    const isMeal = data.service === 'mealprep'

    // Meal Prep: email obligatorio
    if (isMeal && (!val || norm(val) === 'omitir' || norm(val) === 'no')) {
      addUser(val || '-')
      setInput('')
      await bot('Para el Meal Prep necesitamos tu correo para enviarte la lista de ingredientes. Por favor ingrésalo.', 'datos_correo', 400)
      return
    }

    setInput('')
    const correo = norm(val) === 'omitir' || norm(val) === 'no' || !val ? null : val
    addUser(correo || 'Sin correo')
    setStep('waiting')

    const final = { ...data, platos, correo, hasCobertura: true }
    final.interes = qualifyLead(final)
    setData(final)
    setSummary(final)

    // Captura lead por correo (notificación interna al negocio)
    sendLead(final)

    setTyping(true)
    await sleep(1200)
    setTyping(false)

    if (isMeal) {
      // Meal Prep → enviar email con lista de ingredientes al cliente
      addBot('Generando tu lista de ingredientes y guía de conservación...', {})
      setStep('waiting')
      await sleep(800)
      const result = await sendMealPrepEmail(final, final.personas)
      if (result.ok) {
        addBot(`Lista enviada a *${correo}* ✓\n\nRevisa tu bandeja de entrada (o spam) para ver la lista completa de ingredientes, tiempos de conservación e instrucciones de calentado.`, { isSummary: true, isMealPrep: true })
      } else {
        addBot('Hubo un problema al enviar el correo. Te contactaremos directamente para enviarte la lista.\n\nAquí está el resumen de tu solicitud:', { isSummary: true, isMealPrep: true })
      }
      setStep('resumen')
    } else {
      // Cocinera a Domicilio → WhatsApp
      addBot('¡Perfecto! Ya tengo toda la información.\n\nAquí está el *resumen* de tu solicitud:', { isSummary: true, isMealPrep: false })
      setStep('resumen')
    }
  }

  // ── Sin cobertura ─────────────────────────────────────────────────────────
  async function onNcNombre() {
    const val = input.trim()
    if (!val) return
    setInput('')
    addUser(val)
    setData(p => ({ ...p, nombre: val }))
    setStep('waiting')
    await bot(`Gracias, ${val.split(' ')[0]}. ¿Cuál es tu *teléfono* de contacto?`, 'nc_tel')
  }

  async function onNcTel() {
    const val = input.trim()
    if (!val) return
    setInput('')
    addUser(val)
    setData(p => ({ ...p, telefono: val }))
    setStep('waiting')
    await bot('¿Cuál es tu *correo electrónico*? _(opcional — escribe "omitir" si prefieres)_', 'nc_correo')
  }

  async function onNcCorreo() {
    const val = input.trim()
    setInput('')
    const correo = norm(val) === 'omitir' || norm(val) === 'no' || !val ? null : val
    addUser(correo || 'Sin correo')
    setData(p => ({ ...p, correo }))
    setStep('waiting')

    const finalNc = { ...data, correo, hasCobertura: false, platos: [], interes: 'Fuera de cobertura' }
    setData(finalNc)

    // Captura el lead fuera de cobertura por correo
    sendLead(finalNc)

    await bot('¡Listo! Registramos tus datos. Te avisaremos cuando tengamos cobertura en tu sector. ¡Gracias por tu interés! 😊', 'fin_nc')
  }

  // ── Reset ─────────────────────────────────────────────────────────────────
  function reset() {
    setMsgs([])
    setStep('init')
    setInput('')
    setPlatos([])
    setCatOpen(null)
    setSummary(null)
    setData({ service: null, comuna: null, deliveryPrice: null, nombre: null, telefono: null, correo: null, personas: null, platos: [], condiciones: null, dudas: [], interes: null })
    setTyping(false)
  }

  // ── Dispatcher ────────────────────────────────────────────────────────────
  function handleSend() {
    switch (step) {
      case 'cobertura':    onCobertura();    break
      case 'personas':     onPersonas();     break
      case 'condiciones':  onCondiciones();  break
      case 'dudas':        onDuda();         break
      case 'datos_nombre': onNombre();     break
      case 'datos_tel':    onTelefono();   break
      case 'datos_correo': onCorreo();     break
      case 'nc_nombre':    onNcNombre();   break
      case 'nc_tel':       onNcTel();      break
      case 'nc_correo':    onNcCorreo();   break
    }
  }

  const textSteps = ['cobertura','personas','condiciones','dudas','datos_nombre','datos_tel','datos_correo','nc_nombre','nc_tel','nc_correo']

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Floating WhatsApp button ── */}
      <AnimatePresence>
        {!open && (
          <motion.div
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[90] flex flex-col items-end gap-3"
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25, delay: 1.8 }}
          >
            {/* Tooltip */}
            <motion.div
              className="glass-dark text-ivory text-xs font-body px-3 py-2 rounded-xl whitespace-nowrap pointer-events-none"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 2.2 }}
            >
              ¡Haz tu pedido ahora!
            </motion.div>

            {/* Button */}
            <div className="relative">
              <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-50" style={{ animationDuration: '2s' }} />
              <motion.button
                onClick={() => setOpen(true)}
                aria-label="Agendar servicio por WhatsApp"
                className="relative flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] text-white shadow-[0_4px_24px_rgba(37,211,102,0.5)] hover:bg-[#1ebe57] transition-colors duration-200"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
              >
                <WaIconLg />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Close button when chat is open ── */}
      <AnimatePresence>
        {open && (
          <motion.button
            onClick={() => setOpen(false)}
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[95] flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] text-white shadow-[0_4px_24px_rgba(37,211,102,0.5)] hover:bg-[#1ebe57] transition-colors duration-200"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.2 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            aria-label="Cerrar asistente"
          >
            <span className="text-xl font-bold leading-none">✕</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Chat window ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed bottom-[4.5rem] sm:bottom-24 right-4 sm:right-6 z-[90] bg-espresso border border-amber/20 rounded-2xl shadow-2xl overflow-hidden"
            style={{
              width: 'min(calc(100vw - 2rem), 370px)',
              height: 'min(72vh, 560px)',
              display: 'grid',
              gridTemplateRows: 'auto 1fr auto',
            }}
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-bark border-b border-amber/15">
              <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-amber/30">
                <img src="/assets/images/mama.jpg" alt="Asistente" className="w-full h-full object-cover object-top" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display text-ivory text-sm font-bold">Asistente Virtual</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                  <p className="font-body text-warm-gray text-2xs">Sabores de Mamá · En línea</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-warm-gray hover:text-ivory text-lg leading-none transition-colors p-1" aria-label="Cerrar">✕</button>
            </div>

            {/* Messages — stopPropagation evita que Lenis intercepte la rueda del mouse */}
            <div
              data-lenis-prevent
              onWheel={e => e.stopPropagation()}
              onTouchMove={e => e.stopPropagation()}
              style={{ overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
            >
              {msgs.map(m => (
                m.from === 'bot'
                  ? <div key={m.id}>
                      <BotBubble text={m.text} />
                      {m.isSummary && summary && (
                        <div className="mt-1">
                          <SummaryCard data={summary} />
                          {m.isMealPrep ? (
                            /* Meal Prep → confirmación email */
                            <div className="mt-2 bg-white/5 border border-amber/20 rounded-xl px-3.5 py-2.5 font-body text-xs text-ivory/70 text-center">
                              Lista enviada a <strong className="text-amber">{summary.correo}</strong>.<br/>
                              Revisa tu bandeja de entrada.
                            </div>
                          ) : (
                            /* Cocinera a Domicilio → WhatsApp */
                            <motion.button
                              onClick={() => window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(buildWAMsg(summary))}`, '_blank', 'noopener,noreferrer')}
                              className="w-full mt-2 flex items-center justify-center gap-2 bg-[#25D366] text-white font-semibold py-2.5 rounded-xl text-xs hover:bg-[#1ebe57] transition-colors font-body"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.97 }}
                            >
                              <WaIcon /> Agendar por WhatsApp
                            </motion.button>
                          )}
                        </div>
                      )}
                    </div>
                  : <UserBubble key={m.id} text={m.text} />
              ))}
              {typing && <TypingDots />}
              <div ref={endRef} />
            </div>

            {/* Input area */}
            <div className="border-t border-white/10">

              {/* Servicio */}
              {step === 'servicio' && (
                <div className="p-3 flex gap-2">
                  <button onClick={() => onServicio('mealprep')} className="flex-1 bg-amber/8 hover:bg-amber hover:text-espresso text-amber border border-amber/25 rounded-xl py-2.5 text-xs font-semibold font-body transition-all">
                    📦 Meal Prep
                  </button>
                  <button onClick={() => onServicio('cocinera')} className="flex-1 bg-amber/8 hover:bg-amber hover:text-espresso text-amber border border-amber/25 rounded-xl py-2.5 text-xs font-semibold font-body transition-all">
                    🏠 Cocinera a Dom.
                  </button>
                </div>
              )}

              {/* Platos */}
              {step === 'platos' && (
                <div
                  className="p-3 space-y-1.5 max-h-52 overflow-y-auto"
                  onWheel={e => e.stopPropagation()}
                  onTouchMove={e => e.stopPropagation()}
                >
                  {CATEGORIAS.map(cat => (
                    <div key={cat.id} className="border border-white/10 rounded-xl overflow-hidden">
                      <button
                        className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-white/5 transition-colors"
                        onClick={() => setCatOpen(catOpen === cat.id ? null : cat.id)}
                      >
                        <span className="font-body text-xs text-ivory/80 flex items-center gap-2">
                          {cat.icon} {cat.label}
                        </span>
                        <motion.span
                          className="text-amber text-base leading-none"
                          animate={{ rotate: catOpen === cat.id ? 45 : 0 }}
                          transition={{ duration: 0.2 }}
                        >+</motion.span>
                      </button>
                      <AnimatePresence>
                        {catOpen === cat.id && (
                          <motion.div
                            initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-3 pb-3 pt-2 border-t border-white/8 flex flex-wrap gap-1.5">
                              {cat.items.map(item => {
                                const sel = platos.includes(item)
                                return (
                                  <button
                                    key={item}
                                    onClick={() => {
                                      if (sel) setPlatos(p => p.filter(x => x !== item))
                                      else if (platos.length < 5) setPlatos(p => [...p, item])
                                    }}
                                    className={`font-body text-2xs px-2.5 py-1.5 rounded-full border transition-all ${
                                      sel ? 'bg-amber text-espresso border-amber font-semibold' : 'bg-white/5 text-ivory/65 border-white/15 hover:border-amber/40'
                                    }`}
                                  >
                                    {item}
                                  </button>
                                )
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-1">
                    <span className={`font-body text-2xs ${data.service === 'mealprep' && platos.length < 5 ? 'text-amber font-semibold' : 'text-warm-gray'}`}>
                      {platos.length}/5 {data.service === 'mealprep' ? '(se requieren 5)' : 'seleccionados'}
                    </span>
                    <button
                      onClick={onPlatosConfirm}
                      disabled={data.service === 'mealprep' ? platos.length < 5 : platos.length === 0}
                      className="font-body bg-amber text-espresso text-xs font-semibold px-4 py-2 rounded-xl disabled:opacity-40 hover:bg-gold transition-colors"
                    >
                      Confirmar ✓
                    </button>
                  </div>
                </div>
              )}

              {/* Text input */}
              {textSteps.includes(step) && (
                <div className="p-3 space-y-2">
                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      type={(step === 'datos_correo' || step === 'nc_correo') ? 'email' : (step === 'datos_tel' || step === 'nc_tel') ? 'tel' : 'text'}
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSend()}
                      placeholder={
                        step === 'cobertura'    ? 'Ej: Las Condes, Providencia...' :
                        step === 'personas'     ? 'Número de personas...' :
                        step === 'dudas'        ? 'Escribe tu pregunta...' :
                        step === 'condiciones'   ? 'Ej: sin lactosa, diabetes... o escribe "ninguna"' :
                        (step === 'datos_nombre' || step === 'nc_nombre') ? 'Tu nombre completo...' :
                        (step === 'datos_tel'   || step === 'nc_tel')    ? '+56 9 xxxx xxxx' :
                                                   'Tu correo (o "omitir")...'

                      }
                      className="flex-1 bg-bark border border-amber/20 rounded-xl px-3.5 py-2.5 font-body text-xs text-ivory placeholder:text-warm-gray/50 focus:outline-none focus:border-amber/50 caret-amber"
                      style={{ colorScheme: 'dark' }}
                    />
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() && step !== 'datos_correo'}
                      className="w-10 h-10 rounded-xl bg-amber text-espresso flex-shrink-0 flex items-center justify-center font-bold hover:bg-gold transition-colors disabled:opacity-40"
                      aria-label="Enviar"
                    >↑</button>
                  </div>
                  {step === 'dudas' && (
                    <button
                      onClick={onDudasSaltar}
                      className="w-full font-body text-2xs text-warm-gray hover:text-amber py-0.5 transition-colors"
                    >
                      Sin preguntas, continuar →
                    </button>
                  )}
                </div>
              )}

              {/* Final states */}
              {(step === 'resumen' || step === 'fin_nc') && (
                <div className="p-3">
                  <button
                    onClick={reset}
                    className="w-full font-body text-xs text-warm-gray hover:text-amber py-2 transition-colors"
                  >
                    ↺ Nueva consulta
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
