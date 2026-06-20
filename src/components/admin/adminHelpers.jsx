// Helpers compartidos por las páginas del admin (formato + badge de estado).

export function fmtCLP(n) {
  return '$' + Number(n || 0).toLocaleString('es-CL')
}

/** Extrae la parte YYYY-MM-DD de un valor de fecha (string o Date/ISO). */
export function toDateStr(v) {
  if (!v) return ''
  return String(v).slice(0, 10)
}

export function fmtFecha(v) {
  const s = toDateStr(v)
  if (!s) return '—'
  const d = new Date(s + 'T00:00:00')
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })
}

/** Fecha de hoy en formato YYYY-MM-DD (zona local). */
export function todayStr() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const ESTADO_STYLES = {
  solicitud_recibida: { label: 'Solicitud recibida', cls: 'bg-amber/15 text-accent-600 border-amber/30' },
  pagado: { label: 'Pagado', cls: 'bg-[#15803D]/10 text-[#15803D] border-[#15803D]/30' },
  en_preparacion: { label: 'En preparación', cls: 'bg-primary-100 text-primary-700 border-primary-300' },
  entregado: { label: 'Entregado', cls: 'bg-espresso/[0.06] text-warm-gray border-espresso/15' },
}

export function EstadoBadge({ estado }) {
  const s = ESTADO_STYLES[estado] || { label: estado, cls: 'bg-espresso/[0.06] text-warm-gray border-espresso/15' }
  return (
    <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full border ${s.cls}`}>
      {s.label}
    </span>
  )
}
