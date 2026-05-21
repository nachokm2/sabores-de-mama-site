import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MENU_ITEMS, CATEGORIES } from '../../data/menu'
import SectionLabel from '../ui/SectionLabel'
import { useWhatsApp } from '../../hooks/useWhatsApp'
import { useScrollReveal } from '../../hooks/useScrollAnimation'

/* ── Tag badge ───────────────────────────────────────────────────────────── */
function Tag({ label, color }) {
  const colors = {
    amber:      'bg-amber/15 text-amber border-amber/20',
    gold:       'bg-gold/15 text-gold border-gold/20',
    terracotta: 'bg-terracotta/15 text-terracotta border-terracotta/20',
  }
  return (
    <span
      className={`absolute top-3 right-3 text-2xs font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full border backdrop-blur-sm ${colors[color] || colors.amber}`}
    >
      {label}
    </span>
  )
}

/* ── Menu card ───────────────────────────────────────────────────────────── */
function MenuCard({ item, index }) {
  const { openWithItem } = useWhatsApp()
  const [hovered, setHovered] = useState(false)

  return (
    <motion.article
      className="card-menu group bg-espresso"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: [0.19, 1, 0.22, 1] }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      aria-label={item.name}
    >
      {/* ── Image area ── */}
      <div className="relative h-48 overflow-hidden">

        {item.image ? (
          /* Real photo from the website */
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              transform: hovered ? 'scale(1.08)' : 'scale(1)',
              transition: 'transform 0.7s cubic-bezier(0.19, 1, 0.22, 1)',
            }}
          />
        ) : (
          /* Gradient + emoji fallback for items without photo */
          <>
            <div
              className={`absolute inset-0 bg-gradient-to-br ${item.gradient}`}
              style={{
                transform: hovered ? 'scale(1.1)' : 'scale(1)',
                transition: 'transform 0.7s cubic-bezier(0.19, 1, 0.22, 1)',
              }}
              aria-hidden="true"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className="text-5xl md:text-6xl select-none"
                style={{
                  filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.4))',
                  transform: hovered ? 'scale(1.12) translateY(-4px)' : 'scale(1)',
                  transition: 'transform 0.5s cubic-bezier(0.19, 1, 0.22, 1)',
                }}
                aria-hidden="true"
              >
                {item.emoji}
              </span>
            </div>
          </>
        )}

        {/* Bottom gradient for text readability */}
        <div
          className="absolute bottom-0 left-0 right-0 h-20"
          style={{ background: 'linear-gradient(to top, rgba(10,6,4,0.85), transparent)' }}
          aria-hidden="true"
        />

        {/* Tag badge */}
        {item.tag && <Tag label={item.tag} color={item.tagColor} />}
      </div>

      {/* ── Content ── */}
      <div className="p-4 md:p-5">
        <h3 className="font-display text-ivory text-lg leading-tight mb-2">{item.name}</h3>

        <p className="font-body text-warm-gray text-xs leading-relaxed mb-4 line-clamp-2">
          {item.description}
        </p>

        {/* Meta row */}
        <div className="flex items-center gap-3 text-warm-gray text-2xs mb-4">
          <span>👤 {item.serves}</span>
          <span>⏱ {item.prepTime}</span>
        </div>

        {/* Order button */}
        <motion.button
          onClick={() => openWithItem(item.name)}
          className="w-full flex items-center justify-center gap-2 bg-amber/10 text-amber border border-amber/20 rounded-xl py-2.5 text-sm font-medium font-body hover:bg-amber hover:text-espresso transition-all duration-300"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          aria-label={`Pedir ${item.name} por WhatsApp`}
        >
          <WhatsAppTiny />
          Pedir este plato
        </motion.button>
      </div>
    </motion.article>
  )
}

/* ── Category filter ─────────────────────────────────────────────────────── */
function CategoryFilter({ active, onChange }) {
  return (
    <div className="flex flex-wrap gap-2 justify-center" role="tablist" aria-label="Categorías del menú">
      {CATEGORIES.map((cat) => (
        <motion.button
          key={cat.id}
          role="tab"
          aria-selected={active === cat.id}
          onClick={() => onChange(cat.id)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium font-body border transition-all duration-300 ${
            active === cat.id
              ? 'bg-amber text-espresso border-amber shadow-[0_2px_12px_rgba(200,135,58,0.4)]'
              : 'bg-transparent text-warm-gray border-warm-gray/30 hover:border-amber/50 hover:text-amber'
          }`}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
        >
          <span aria-hidden="true">{cat.icon}</span>
          {cat.label}
        </motion.button>
      ))}
    </div>
  )
}

/* ── Section ─────────────────────────────────────────────────────────────── */
export default function MenuSection() {
  const [activeCategory, setActiveCategory] = useState('todos')
  const titleRef = useScrollReveal({ selector: '.title-item', stagger: 0.1, y: 30 })

  const filtered = useMemo(
    () =>
      activeCategory === 'todos'
        ? MENU_ITEMS
        : MENU_ITEMS.filter((i) => i.category === activeCategory),
    [activeCategory]
  )

  return (
    <section
      id="menu"
      className="section-padding bg-bark relative overflow-hidden"
      aria-labelledby="menu-heading"
    >
      {/* Ambient glow */}
      <div
        className="absolute left-1/2 -translate-x-1/2 top-0 w-[800px] h-[400px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(200,135,58,0.12) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="container-site relative">
        {/* Header */}
        <div ref={titleRef} className="text-center mb-12 md:mb-16">
          <SectionLabel light>Nuestros Platos</SectionLabel>
          <h2
            id="menu-heading"
            className="section-title-light mt-4 title-item"
          >
            El menú que
            <br />
            <span className="text-gradient-gold">te da nostalgia.</span>
          </h2>
          <p className="section-subtitle text-ivory/55 mx-auto mt-5 title-item">
            Platos preparados a diario con ingredientes frescos.
            Todos disponibles para pedir por WhatsApp.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-10">
          <CategoryFilter active={activeCategory} onChange={setActiveCategory} />
        </div>

        {/* Grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5"
          layout
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((item, i) => (
              <MenuCard key={item.id} item={item} index={i} />
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center mt-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7 }}
        >
          <p className="text-ivory/50 font-body text-sm mb-5">
            ¿No encuentras lo que buscas? Pregúntanos por nuestro menú completo.
          </p>
          <a
            href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER || '56912345678'}?text=${encodeURIComponent('¡Hola! Quisiera ver el menú completo disponible.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline inline-flex"
          >
            Ver menú completo en WhatsApp
          </a>
        </motion.div>
      </div>
    </section>
  )
}

function WhatsAppTiny() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}
