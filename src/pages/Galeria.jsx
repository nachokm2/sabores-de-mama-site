import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Helmet } from 'react-helmet-async'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import PageHero from '../components/ui/PageHero'
import WhatsAppCTA from '../components/sections/WhatsAppCTA'
import { openChatBot } from '../lib/openChatBot'

/* ── All gallery items including real photos ────────────────────────────── */
const GALLERY_ITEMS = [
  { id: 1,  label: 'Papa Rellena',         image: '/assets/images/papa-rellena.jpg',       emoji: '🥔', category: 'fondos',   gradient: 'from-bark via-ember to-amber' },
  { id: 2,  label: 'Pastel de Papas',      image: '/assets/images/pastel-de-papas.jpg',    emoji: '🥘', category: 'fondos',   gradient: 'from-espresso via-bark to-amber' },
  { id: 3,  label: 'Pollo Asado',          image: '/assets/images/pollo-asado.jpg',         emoji: '🐓', category: 'fondos',   gradient: 'from-terracotta via-ember to-wheat' },
  { id: 4,  label: 'Pescado a la Plancha', image: '/assets/images/pescado-plancha.jpg',    emoji: '🐟', category: 'fondos',   gradient: 'from-bark via-terracotta to-gold' },
  { id: 5,  label: 'Quiche de Cebolla',    image: '/assets/images/quiche-de-cebolla.jpg',  emoji: '🧅', category: 'fondos',   gradient: 'from-bark via-amber to-wheat' },
  { id: 6,  label: 'Tartaleta de Frutas',  image: '/assets/images/tartaleta-de-frutas.jpg',emoji: '🍓', category: 'postres',  gradient: 'from-espresso via-ember to-gold' },
  { id: 7,  label: 'Empanadas de Pino',    image: null,  emoji: '🥟', category: 'empanadas', gradient: 'from-terracotta via-ember to-amber' },
  { id: 8,  label: 'Cazuela de Vacuno',    image: null,  emoji: '🥘', category: 'sopas',     gradient: 'from-bark via-ember to-terracotta' },
  { id: 9,  label: 'Pan Amasado',          image: null,  emoji: '🍞', category: 'desayuno',  gradient: 'from-amber via-gold to-wheat' },
  { id: 10, label: 'Leche Asada',          image: null,  emoji: '🍮', category: 'postres',   gradient: 'from-espresso via-bark to-gold' },
  { id: 11, label: 'Sopaipillas',          image: null,  emoji: '🫓', category: 'postres',   gradient: 'from-ember via-terracotta to-amber' },
  { id: 12, label: 'Sopa de Pollo',        image: null,  emoji: '🍜', category: 'sopas',     gradient: 'from-bark via-bark to-amber' },
]

const FILTER_CATS = [
  { id: 'todos',     label: 'Todos' },
  { id: 'fondos',    label: 'Platos de Fondo' },
  { id: 'sopas',     label: 'Sopas' },
  { id: 'empanadas', label: 'Empanadas' },
  { id: 'desayuno',  label: 'Desayuno' },
  { id: 'postres',   label: 'Postres' },
]

/* ── Lightbox ─────────────────────────────────────────────────────────────── */
function Lightbox({ item, onClose, onPrev, onNext }) {
  if (!item) return null
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-modal bg-espresso/96 backdrop-blur-md flex items-center justify-center p-4 md:p-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        {/* Prev */}
        <button
          className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border border-ivory/20 flex items-center justify-center text-ivory hover:bg-ivory/10 transition-colors z-10"
          onClick={(e) => { e.stopPropagation(); onPrev() }}
          aria-label="Anterior"
        >
          ‹
        </button>

        <motion.div
          key={item.id}
          className="relative w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.85, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 26 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="aspect-square w-full">
            {item.image ? (
              <img src={item.image} alt={item.label} className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${item.gradient} flex items-center justify-center`}>
                <span className="text-[100px]" aria-hidden="true">{item.emoji}</span>
              </div>
            )}
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-espresso/90 to-transparent">
            <p className="font-display text-ivory text-2xl font-bold">{item.label}</p>
            <p className="font-body text-ivory/55 text-sm mt-1">Disponible en nuestro menú</p>
          </div>
        </motion.div>

        {/* Next */}
        <button
          className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border border-ivory/20 flex items-center justify-center text-ivory hover:bg-ivory/10 transition-colors z-10"
          onClick={(e) => { e.stopPropagation(); onNext() }}
          aria-label="Siguiente"
        >
          ›
        </button>

        {/* Close */}
        <button
          className="absolute top-4 right-4 w-10 h-10 rounded-full border border-ivory/20 flex items-center justify-center text-ivory hover:bg-ivory/10 transition-colors"
          onClick={onClose}
          aria-label="Cerrar"
        >
          ✕
        </button>
      </motion.div>
    </AnimatePresence>
  )
}

/* ── Gallery item ─────────────────────────────────────────────────────────── */
function GalleryCard({ item, index, onClick }) {
  return (
    <motion.button
      className="relative overflow-hidden rounded-2xl cursor-pointer group aspect-square"
      onClick={() => onClick(item)}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.5, delay: index * 0.04, ease: [0.19, 1, 0.22, 1] }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      aria-label={`Ver ${item.label}`}
    >
      {item.image ? (
        <img
          src={item.image}
          alt={item.label}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} transition-transform duration-700 group-hover:scale-110`} aria-hidden="true" />
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-espresso/40 group-hover:bg-espresso/20 transition-colors duration-400" />

      {/* No-image emoji */}
      {!item.image && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-5xl transition-transform duration-500 group-hover:scale-125" aria-hidden="true">
            {item.emoji}
          </span>
        </div>
      )}

      {/* Label */}
      <div className="absolute inset-x-0 bottom-0 p-3 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
        <span className="font-display text-ivory text-sm font-semibold bg-espresso/70 backdrop-blur-sm px-2.5 py-1 rounded-lg">
          {item.label}
        </span>
      </div>
    </motion.button>
  )
}

export default function Galeria() {
  const [activeFilter, setActiveFilter] = useState('todos')
  const [selected, setSelected]         = useState(null)

  const filtered = useMemo(
    () => activeFilter === 'todos' ? GALLERY_ITEMS : GALLERY_ITEMS.filter(i => i.category === activeFilter),
    [activeFilter]
  )

  const selectedIndex = selected ? filtered.findIndex(i => i.id === selected.id) : -1

  const goPrev = () => {
    if (selectedIndex <= 0) setSelected(filtered[filtered.length - 1])
    else setSelected(filtered[selectedIndex - 1])
  }

  const goNext = () => {
    if (selectedIndex >= filtered.length - 1) setSelected(filtered[0])
    else setSelected(filtered[selectedIndex + 1])
  }

  return (
    <>
      <Helmet>
        <title>Galería | Sabores de Mamá</title>
        <meta name="description" content="Galería de platos de Sabores de Mamá. Comida casera chilena fotografiada con amor: papa rellena, pollo asado, empanadas, postres y más." />
      </Helmet>

      <Navbar />

      <main>
        <PageHero
          label="Galería"
          title="Cada plato,"
          titleHighlight="una obra de arte."
          subtitle="Comida preparada con pasión y recetas únicas de nuestra familia. Haz clic en cualquier foto para verla completa."
          breadcrumb={[{ label: 'Inicio', href: '/' }, { label: 'Galería', href: '/galeria' }]}
        />

        {/* ── Gallery grid ── */}
        <section className="section-padding bg-background-soft relative overflow-hidden" aria-label="Galería de platos">
          {/* Glow */}
          <div
            className="absolute left-1/2 -translate-x-1/2 top-0 w-[700px] h-[350px] pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(194,121,47,0.07) 0%, transparent 70%)' }}
            aria-hidden="true"
          />

          <div className="container-site relative">
            {/* Filters */}
            <div className="flex flex-wrap gap-2 justify-center mb-10">
              {FILTER_CATS.map(cat => (
                <motion.button
                  key={cat.id}
                  onClick={() => setActiveFilter(cat.id)}
                  className={`px-4 py-2 rounded-full text-xs font-medium font-body border transition-all duration-300 ${
                    activeFilter === cat.id
                      ? 'bg-amber text-espresso border-amber shadow-[0_2px_12px_rgba(194,121,47,0.4)]'
                      : 'bg-transparent text-warm-gray border-warm-gray/30 hover:border-amber/50 hover:text-accent-600'
                  }`}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                >
                  {cat.label}
                </motion.button>
              ))}
            </div>

            {/* Grid */}
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4"
              layout
            >
              <AnimatePresence mode="popLayout">
                {filtered.map((item, i) => (
                  <GalleryCard key={item.id} item={item} index={i} onClick={setSelected} />
                ))}
              </AnimatePresence>
            </motion.div>

            {/* CTA */}
            <motion.div
              className="text-center mt-14"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <p className="text-warm-gray font-body text-sm mb-5">
                ¿Te antojaste? Pide ahora por WhatsApp.
              </p>
              <button onClick={openChatBot} className="btn-primary-dark">
                Hacer un pedido
              </button>
            </motion.div>
          </div>
        </section>

        <WhatsAppCTA />
      </main>

      <Footer />

      <Lightbox item={selected} onClose={() => setSelected(null)} onPrev={goPrev} onNext={goNext} />
    </>
  )
}
