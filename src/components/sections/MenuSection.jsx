import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { SERVICES, DISH_CATEGORIES, DULCES_FAMILIAR, DULCES_SNACKS, DISH_DESCRIPTIONS } from '../../data/menu'
import SectionLabel from '../ui/SectionLabel'
import { getPlatos } from '../../lib/publicApi'
import { useScrollReveal } from '../../hooks/useScrollAnimation'

// Cada servicio inicia su propio flujo de pedido.
const SERVICE_ROUTES = {
  mealprep: '/meal-prep',
  cocinera: '/cocinera-a-domicilio',
}

// Iconos por categoría (la BD guarda la categoría como texto libre).
const CATEGORY_ICONS = {
  'Carnes y Pollo': '🍗',
  'Legumbres y Caldos': '🥘',
  'Quiches y Tortillas': '🥧',
  'Otros Platos': '🍽️',
  'Acompañamientos': '🍚',
}

// Agrupa los platos de la API por categoría → estructura del acordeón.
function buildCategoriesFromApi(platos) {
  const map = new Map()
  for (const p of platos) {
    const label = p.categoria || 'Otros Platos'
    if (!map.has(label)) map.set(label, [])
    map.get(label).push(p.nombre)
  }
  return Array.from(map, ([label, items], i) => ({
    id: `api-cat-${i}`,
    label,
    icon: CATEGORY_ICONS[label] || '🍽️',
    items,
  }))
}

function buildDescriptionsFromApi(platos) {
  const d = {}
  for (const p of platos) if (p.descripcion) d[p.nombre] = p.descripcion
  return d
}

/* ── WhatsApp icon ───────────────────────────────────────────────────────────── */
function WaIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

/* ── Service card ────────────────────────────────────────────────────────────── */
function ServiceCard({ service, index }) {
  const navigate = useNavigate()
  const irAlFlujo = () => navigate(SERVICE_ROUTES[service.id] || '/meal-prep')
  return (
    <motion.article
      className={`relative rounded-3xl overflow-hidden flex flex-col shadow-[0_10px_40px_rgba(42,28,18,0.08)] ${service.highlight ? 'ring-2 ring-amber/50' : 'ring-1 ring-espresso/10'}`}
      style={{ background: 'linear-gradient(160deg, #FFFCF7 0%, #F7EFE2 100%)' }}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay: index * 0.15, ease: [0.19, 1, 0.22, 1] }}
    >
      {service.highlight && (
        <div className="absolute top-4 right-4 bg-amber text-espresso text-2xs font-semibold tracking-wider uppercase px-3 py-1 rounded-full">
          Más Popular
        </div>
      )}

      {/* Top accent */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${service.gradient}`} aria-hidden="true" />

      <div className="p-7 flex flex-col flex-1">
        {/* Icon + Name */}
        <div className="flex items-center gap-3 mb-5">
          <span className="text-3xl" aria-hidden="true">{service.icon}</span>
          <div>
            <p className="font-body text-accent-600 text-xs font-semibold tracking-[0.15em] uppercase">{service.tagline}</p>
            <h3 className="font-display text-espresso text-xl font-bold leading-tight">{service.name}</h3>
          </div>
        </div>

        {/* Price */}
        <div className="mb-5">
          <span className="font-display text-4xl font-bold text-terracotta">{service.priceLabel}</span>
          <span className="font-body text-warm-gray text-sm ml-2">por servicio</span>
        </div>

        {/* Description */}
        <p className="font-body text-warm-gray text-sm leading-relaxed mb-6">
          {service.description}
        </p>

        {/* Features */}
        <ul className="space-y-2.5 mb-7 flex-1" aria-label={`Incluye en ${service.name}`}>
          {service.features.map((f) => (
            <li key={f} className="flex items-start gap-2.5">
              <span className="text-accent-600 mt-0.5 flex-shrink-0" aria-hidden="true">✓</span>
              <span className="font-body text-warm-gray text-sm">{f}</span>
            </li>
          ))}
        </ul>

        {/* Communes */}
        <div className="mb-7 p-3.5 rounded-xl bg-espresso/[0.04] border border-espresso/10">
          <p className="font-body text-warm-gray text-xs font-semibold uppercase tracking-wider mb-2">📍 Comunas disponibles</p>
          <p className="font-body text-warm-gray text-xs leading-relaxed">{service.communes.join(' · ')}</p>
        </div>

        {/* CTA → inicia el flujo del servicio */}
        <motion.button
          onClick={irAlFlujo}
          className={`w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-sm font-semibold font-body transition-all duration-300 ${
            service.highlight
              ? 'bg-amber text-espresso hover:bg-gold shadow-[0_4px_20px_rgba(194,121,47,0.4)]'
              : 'bg-espresso/[0.05] text-espresso border border-espresso/15 hover:bg-amber hover:text-espresso hover:border-amber'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          aria-label={`Comenzar pedido de ${service.name}`}
        >
          Comenzar pedido
        </motion.button>
      </div>
    </motion.article>
  )
}

/* ── Category accordion ──────────────────────────────────────────────────────── */
function CategoryAccordion({ cat, index, descriptions = {} }) {
  const [open, setOpen] = useState(index === 0)
  const [activeDish, setActiveDish] = useState(null)
  return (
    <motion.div
      className="border border-espresso/10 rounded-2xl overflow-hidden bg-background-surface"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: index * 0.06 }}
    >
      <button
        className="w-full flex items-center justify-between p-4 md:p-5 text-left hover:bg-espresso/[0.04] transition-colors duration-200"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl" aria-hidden="true">{cat.icon}</span>
          <span className="font-display text-espresso text-base font-semibold">{cat.label}</span>
          <span className="font-body text-warm-gray text-xs bg-espresso/[0.06] px-2 py-0.5 rounded-full">{cat.items.length}</span>
        </div>
        <motion.span
          className="text-accent-600 text-lg leading-none flex-shrink-0"
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.25 }}
          aria-hidden="true"
        >
          +
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 md:px-5 pb-5 border-t border-espresso/10 pt-4">
              <div className="flex flex-wrap gap-2">
                {cat.items.map((item) => (
                  <button
                    key={item}
                    onMouseEnter={() => setActiveDish(item)}
                    onMouseLeave={() => setActiveDish(null)}
                    onClick={() => setActiveDish(v => v === item ? null : item)}
                    className={`font-body text-xs px-3 py-1.5 rounded-full border transition-all duration-200 ${
                      activeDish === item
                        ? 'bg-amber/15 border-amber/50 text-accent-600'
                        : 'text-warm-gray bg-espresso/[0.04] border-espresso/10 hover:border-amber/50 hover:text-accent-600'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>

              {/* Panel de descripción */}
              <AnimatePresence>
                {activeDish && descriptions[activeDish] && (
                  <motion.div
                    key={activeDish}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.18 }}
                    className="mt-4 flex items-start gap-3 bg-amber/[0.06] border border-amber/30 rounded-xl px-4 py-3"
                  >
                    <span className="text-accent-600 text-base mt-0.5 flex-shrink-0">✦</span>
                    <div>
                      <p className="font-display text-espresso text-sm font-semibold mb-0.5">{activeDish}</p>
                      <p className="font-body text-warm-gray text-xs leading-relaxed">{descriptions[activeDish]}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ── Dulce card ──────────────────────────────────────────────────────────────── */
function DulceCard({ item, index }) {
  return (
    <motion.article
      className="relative rounded-2xl overflow-hidden group cursor-pointer"
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: index * 0.07 }}
      whileHover={{ y: -4 }}
      onClick={() => {
        const msg = `¡Hola! Me interesa pedir ${item.name}. ¿Está disponible?`
        const url = `https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER }?text=${encodeURIComponent(msg)}`
        window.open(url, '_blank', 'noopener,noreferrer')
      }}
      aria-label={`Pedir ${item.name}`}
    >
      {/* Image or gradient background */}
      <div className={`h-32 relative overflow-hidden ${!item.image ? `bg-gradient-to-br ${item.gradient}` : 'bg-wheat'}`}>
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl transition-transform duration-500 group-hover:scale-110" aria-hidden="true">
              {item.emoji}
            </span>
          </div>
        )}
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-espresso/60 to-transparent" aria-hidden="true" />
        {/* Price badge */}
        <div className="absolute top-2.5 left-2.5 bg-espresso/85 backdrop-blur-sm text-amber text-xs font-bold px-2.5 py-1 rounded-full">
          {item.priceLabel}
        </div>
      </div>
      {/* Info */}
      <div className="bg-background-surface border-x border-b border-espresso/8 rounded-b-2xl p-3.5">
        <h4 className="font-display text-espresso text-sm font-semibold leading-tight mb-0.5">{item.name}</h4>
        <p className="font-body text-warm-gray text-xs">{item.subtitle}</p>
      </div>
    </motion.article>
  )
}

/* ── Main section ────────────────────────────────────────────────────────────── */
export default function MenuSection() {
  const titleRef = useScrollReveal({ selector: '.menu-title', stagger: 0.1, y: 30 })

  // Platos desde la API (con fallback a los datos estáticos si el backend
  // no responde o aún no tiene platos cargados).
  const [categories, setCategories] = useState(DISH_CATEGORIES)
  const [descriptions, setDescriptions] = useState(DISH_DESCRIPTIONS)

  useEffect(() => {
    let active = true
    getPlatos()
      .then((platos) => {
        if (!active || !platos.length) return
        setCategories(buildCategoriesFromApi(platos))
        setDescriptions({ ...DISH_DESCRIPTIONS, ...buildDescriptionsFromApi(platos) })
      })
      .catch(() => {
        /* Sin conexión / error → se mantienen los datos estáticos. */
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <section
      id="menu"
      className="relative section-padding bg-background-soft overflow-hidden"
      aria-labelledby="menu-heading"
    >
      {/* Ambient */}
      <div
        className="absolute left-1/2 -translate-x-1/2 top-0 w-[900px] h-[500px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(194,121,47,0.08) 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      <div className="container-site relative">

        {/* ── Header ── */}
        <div ref={titleRef} className="text-center mb-14">
          <SectionLabel light>Nuestros Servicios</SectionLabel>
          <h2 id="menu-heading" className="section-title-light mt-4 menu-title">
            Cocina casera,
            <br />
            <span className="text-gradient-gold">a tu manera.</span>
          </h2>
          <p className="section-subtitle text-warm-gray mx-auto mt-5 menu-title">
            Elige el servicio que mejor se adapta a tu semana.
            Tú pones los ingredientes, yo pongo el amor.
          </p>
        </div>

        {/* ── Service cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-20">
          {SERVICES.map((service, i) => (
            <ServiceCard key={service.id} service={service} index={i} />
          ))}
        </div>

        {/* ── Dish categories ── */}
        <div className="mb-20">
          <div className="text-center mb-10">
            <SectionLabel light>Elige tus Platos</SectionLabel>
            <h3 className="font-display text-espresso text-3xl md:text-4xl font-bold mt-3 leading-tight">
              Más de 60 preparaciones
              <br />
              <span className="text-terracotta">para elegir.</span>
            </h3>
            <p className="font-body text-warm-gray text-sm mt-3 max-w-md mx-auto">
              Selecciona hasta 5 preparaciones por servicio. Si tienes algo en mente que no está en la lista, ¡también lo hacemos!
            </p>
          </div>

          <div className="space-y-3 max-w-3xl mx-auto">
            {categories.map((cat, i) => (
              <CategoryAccordion key={cat.id} cat={cat} index={i} descriptions={descriptions} />
            ))}
          </div>
        </div>

        {/* ── Dulces Saludables ── */}
        <div>
          <div className="text-center mb-10">
            <SectionLabel light>Dulces Saludables</SectionLabel>
            <h3 className="font-display text-espresso text-3xl md:text-4xl font-bold mt-3">
              Hecho en casa,
              <span className="text-terracotta"> con amor.</span>
            </h3>
            <p className="font-body text-warm-gray text-sm mt-3 max-w-md mx-auto">
              Preparaciones dulces saludables elaboradas por mí, sin que necesites aportar ingredientes. Perfectas para complementar tu semana.
            </p>
          </div>

          {/* Familiar */}
          <p className="font-body text-accent-600 text-xs font-semibold tracking-[0.15em] uppercase text-center mb-4">
            Formato Familiar (Molde 20 cm) · 8 a 10 porciones
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
            {DULCES_FAMILIAR.map((d, i) => (
              <DulceCard key={d.name} item={d} index={i} />
            ))}
          </div>

          {/* Snacks */}
          <p className="font-body text-accent-600 text-xs font-semibold tracking-[0.15em] uppercase text-center mb-4">
            Formato Snacks (Bolsas de 10 unidades) · 1 porción individual
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-14">
            {DULCES_SNACKS.map((d, i) => (
              <DulceCard key={d.name} item={d} index={i} />
            ))}
          </div>

          {/* CTA */}
          <div className="text-center">
            <p className="font-body text-warm-gray text-sm mb-5">
              ¿Tienes dudas o quieres un menú personalizado?
            </p>
            <motion.a
              href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER }?text=${encodeURIComponent('¡Hola! Quiero agendar un servicio y tengo algunas preguntas 🍽️')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline inline-flex"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <WaIcon />
              Consultar por WhatsApp
            </motion.a>
          </div>
        </div>
      </div>
    </section>
  )
}
