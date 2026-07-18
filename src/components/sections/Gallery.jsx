import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SectionLabel from '../ui/SectionLabel'
import { imagenUrl } from '../../lib/publicApi'

const GALLERY_ITEMS = [
  {
    id: 1,
    emoji: '🥔',
    label: 'Papa Rellena',
    image: imagenUrl('home/7.png'),
    gradient: 'from-bark via-ember to-amber',
    span: 'col-span-1 row-span-2',
  },
  {
    id: 2,
    emoji: '🥘',
    label: 'Pastel de Papas',
    image: imagenUrl('home/8.jpg'),
    gradient: 'from-espresso via-bark to-terracotta',
    span: 'col-span-1 row-span-1',
  },
  {
    id: 3,
    emoji: '🐓',
    label: 'Pollo Asado',
    image: imagenUrl('home/9.jpg'),
    gradient: 'from-terracotta via-ember to-gold',
    span: 'col-span-1 row-span-1',
  },
  {
    id: 4,
    emoji: '🐟',
    label: 'Pescado a la Plancha',
    image: imagenUrl('home/10.png'),
    gradient: 'from-amber via-gold to-wheat',
    span: 'col-span-2 row-span-1',
  },
]

function GalleryItem({ item, onClick }) {
  return (
    <motion.button
      className={`${item.span} relative overflow-hidden rounded-2xl cursor-pointer group min-h-[140px] md:min-h-[160px]`}
      onClick={() => onClick(item)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
      aria-label="Ver foto"
    >
      {/* Foto */}
      {item.image ? (
        <img
          src={item.image}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-110"
        />
      ) : (
        <div
          className={`absolute inset-0 bg-gradient-to-br ${item.gradient} transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-110`}
          aria-hidden="true"
        />
      )}

      {/* Realce sutil al pasar el mouse */}
      <div className="absolute inset-0 bg-espresso/0 group-hover:bg-espresso/10 transition-colors duration-500" />
    </motion.button>
  )
}

/* ── Lightbox ─────────────────────────────────────────────────────────────── */
function Lightbox({ item, onClose }) {
  return (
    <AnimatePresence>
      {item && (
        <motion.div
          className="fixed inset-0 z-modal bg-espresso/95 backdrop-blur-md flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={`relative w-full max-w-md aspect-square rounded-3xl overflow-hidden ${!item.image ? `bg-gradient-to-br ${item.gradient}` : 'bg-espresso'}`}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            {item.image ? (
              <img
                src={item.image}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-[100px] drop-shadow-2xl" aria-hidden="true">{item.emoji}</span>
              </div>
            )}
          </motion.div>
          <button
            className="absolute top-6 right-6 w-10 h-10 rounded-full border border-ivory/20 flex items-center justify-center text-ivory hover:bg-ivory/10 transition-colors"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function Gallery() {
  const [selected, setSelected] = useState(null)

  return (
    <section
      id="galeria"
      className="relative section-padding bg-background-soft overflow-hidden"
      aria-labelledby="gallery-heading"
    >
      {/* Ambient glow */}
      <div
        className="absolute left-1/4 top-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(194,121,47,0.07) 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      <div className="container-site relative">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <SectionLabel light>Galería</SectionLabel>
            <h2
              id="gallery-heading"
              className="section-title-light mt-4"
            >
              Cada plato,
              <br />
              <span className="text-gradient-gold">una obra de arte.</span>
            </h2>
          </div>
          <p className="font-body text-warm-gray text-sm max-w-xs text-right hidden md:block">
            Comida preparada a diario con pasión y recetas únicas de nuestra familia.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 auto-rows-[160px] md:auto-rows-[200px]">
          {GALLERY_ITEMS.map((item) => (
            <GalleryItem key={item.id} item={item} onClick={setSelected} />
          ))}
        </div>
      </div>

      <Lightbox item={selected} onClose={() => setSelected(null)} />
    </section>
  )
}
