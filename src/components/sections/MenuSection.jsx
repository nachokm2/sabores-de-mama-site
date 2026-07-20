import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { SERVICES, DISH_CATEGORIES, DULCES_FAMILIAR, DULCES_SNACKS, DISH_DESCRIPTIONS } from '../../data/menu'
import SectionLabel from '../ui/SectionLabel'
import UtensilsIcon from '../ui/UtensilsIcon'
import { getPlatos, getComunas, getProductosHornear, imagenUrl } from '../../lib/publicApi'
import { fmtCLP } from '../../lib/flowConfig'
import { openChatBot } from '../../lib/openChatBot'

// Degradados para las tarjetas de dulces sin foto (se rotan por índice).
const DULCE_GRADIENTS = [
  'from-gold via-amber to-wheat',
  'from-terracotta via-ember to-amber',
  'from-espresso via-bark to-terracotta',
  'from-bark via-ember to-gold',
  'from-terracotta via-bark to-amber',
  'from-bark via-amber to-wheat',
]

// Producto Healthy (productos_hornear) → formato de la tarjeta DulceCard.
function mapDulce(p, i) {
  return {
    name: p.nombre,
    subtitle: [p.formato, p.porciones].filter(Boolean).join(' · ') || p.descripcion || '',
    priceLabel: fmtCLP(p.precio),
    image: p.imagen ? imagenUrl(p.imagen) : null,
    emoji: '🧁',
    gradient: DULCE_GRADIENTS[i % DULCE_GRADIENTS.length],
  }
}

// Respaldo estático si aún no hay productos Healthy cargados / backend caído.
const DULCES_FALLBACK = [...DULCES_FAMILIAR, ...DULCES_SNACKS]
import { useScrollReveal } from '../../hooks/useScrollAnimation'
import { WHATSAPP, getWhatsAppLink } from '../../data/siteConfig'

// Cada servicio inicia su propio flujo de pedido.
const SERVICE_ROUTES = {
  mealprep: '/meal-prep',
  cocinera: '/cocinera-a-domicilio',
}

// Mapeo del id de la card al valor de servicio de la API de comunas.
const SERVICE_KEY = {
  mealprep: 'meal_prep',
  cocinera: 'cocinera',
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

function buildImagesFromApi(platos) {
  const m = {}
  for (const p of platos) if (p.imagen) m[p.nombre] = p.imagen
  return m
}

/* ── WhatsApp icon ───────────────────────────────────────────────────────────── */

/* ── Service card ────────────────────────────────────────────────────────────── */
function ServiceCard({ service, index }) {
  const navigate = useNavigate()
  const [comunasSrv, setComunasSrv] = useState([])

  // Comunas habilitadas para ESTE servicio (administradas en el panel).
  useEffect(() => {
    const key = SERVICE_KEY[service.id]
    if (!key) return
    let active = true
    ;(async () => {
      try {
        const lista = await getComunas(key)
        if (active && Array.isArray(lista) && lista.length) {
          setComunasSrv(lista.map((c) => c.nombre))
        }
      } catch {
        /* se mantiene el fallback estático */
      }
    })()
    return () => {
      active = false
    }
  }, [service.id])

  const comunasMostrar = comunasSrv.length ? comunasSrv : service.communes

  const irAlFlujo = () => {
    // Cocinera a Domicilio se coordina por WhatsApp; el resto usa su flujo.
    if (service.id === 'cocinera') {
      window.open(getWhatsAppLink(WHATSAPP.cocineraMessage), '_blank', 'noopener')
      return
    }
    navigate(SERVICE_ROUTES[service.id] || '/meal-prep')
  }
  // Cocinera se coordina por WhatsApp → "Agendar servicio"; el resto, checkout.
  const ctaLabel = service.id === 'cocinera' ? 'Agendar servicio' : 'Comenzar pedido'
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
          <p className="font-body text-warm-gray text-xs leading-relaxed">{comunasMostrar.join(' · ')}</p>
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
          aria-label={`${ctaLabel} de ${service.name}`}
        >
          {ctaLabel}
        </motion.button>
      </div>
    </motion.article>
  )
}

/* ── Category accordion ──────────────────────────────────────────────────────── */
function CategoryAccordion({ cat, index, descriptions = {}, images = {} }) {
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
                {activeDish && (descriptions[activeDish] || images[activeDish]) && (
                  <motion.div
                    key={activeDish}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.18 }}
                    className="mt-4 flex items-start gap-3 bg-amber/[0.06] border border-amber/30 rounded-xl px-4 py-3"
                  >
                    {images[activeDish] ? (
                      <img
                        src={imagenUrl(images[activeDish])}
                        alt={activeDish}
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                        onError={(e) => { e.currentTarget.style.display = 'none' }}
                      />
                    ) : (
                      <span className="text-accent-600 text-base mt-0.5 flex-shrink-0">✦</span>
                    )}
                    <div>
                      <p className="font-display text-espresso text-sm font-semibold mb-0.5">{activeDish}</p>
                      {descriptions[activeDish] && (
                        <p className="font-body text-warm-gray text-xs leading-relaxed">{descriptions[activeDish]}</p>
                      )}
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
  const [images, setImages] = useState({})
  // Dulces Saludables: productos administrables (pestaña Healthy del panel).
  const [dulces, setDulces] = useState([])

  useEffect(() => {
    let active = true
    getPlatos()
      .then((platos) => {
        if (!active || !platos.length) return
        setCategories(buildCategoriesFromApi(platos))
        setDescriptions({ ...DISH_DESCRIPTIONS, ...buildDescriptionsFromApi(platos) })
        setImages(buildImagesFromApi(platos))
      })
      .catch(() => {
        /* Sin conexión / error → se mantienen los datos estáticos. */
      })
    getProductosHornear()
      .then((lista) => active && setDulces(Array.isArray(lista) ? lista : []))
      .catch(() => active && setDulces([]))
    return () => {
      active = false
    }
  }, [])

  // Si hay productos Healthy cargados, se muestran; si no, los estáticos.
  const dulcesShow = dulces.length ? dulces.map(mapDulce) : DULCES_FALLBACK

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
              <CategoryAccordion key={cat.id} cat={cat} index={i} descriptions={descriptions} images={images} />
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

          {/* Productos Healthy (administrables desde el panel) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-14">
            {dulcesShow.map((d, i) => (
              <DulceCard key={`${d.name}-${i}`} item={d} index={i} />
            ))}
          </div>

          {/* CTA */}
          <div className="text-center">
            <p className="font-body text-warm-gray text-sm mb-5">
              ¿Se te antojó algo dulce? Súmalos a tu pedido de Meal Prep.
            </p>
            <motion.button
              onClick={openChatBot}
              className="btn-primary"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <UtensilsIcon className="w-4 h-4" />
              Pedir ahora
            </motion.button>
          </div>
        </div>
      </div>
    </section>
  )
}
