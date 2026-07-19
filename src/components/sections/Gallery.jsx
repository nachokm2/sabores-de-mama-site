import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SectionLabel from '../ui/SectionLabel'
import { imagenUrl } from '../../lib/publicApi'

const GALLERY_ITEMS = [
  { id: 1, label: 'Papa Rellena', image: imagenUrl('home/7.png') },
  { id: 2, label: 'Pastel de Papas', image: imagenUrl('home/8.jpg') },
  { id: 3, label: 'Pollo Asado', image: imagenUrl('home/9.jpg') },
  { id: 4, label: 'Pescado a la Plancha', image: imagenUrl('home/10.png') },
]

/* ── Lightbox: imagen completa a pantalla, sin recortes ──────────────────────── */
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
          <motion.img
            src={item.image}
            alt={item.label || ''}
            className="max-w-full max-h-[85vh] w-auto h-auto rounded-2xl object-contain"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
          />
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
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const n = GALLERY_ITEMS.length
  const go = (dir) => setIndex((i) => (i + dir + n) % n)
  const item = GALLERY_ITEMS[index]

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
            <h2 id="gallery-heading" className="section-title-light mt-4">
              Cada plato,
              <br />
              <span className="text-gradient-gold">una obra de arte.</span>
            </h2>
          </div>
          <p className="font-body text-warm-gray text-sm max-w-xs text-right hidden md:block">
            Comida preparada a diario con pasión y recetas únicas de nuestra familia.
          </p>
        </div>

        {/* Carrusel */}
        <div className="relative max-w-3xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-background-surface ring-1 ring-espresso/10 shadow-lg">
            <AnimatePresence initial={false} mode="wait">
              <motion.div
                key={item.id}
                className="h-[46vh] min-h-[300px] md:h-[560px] flex items-center justify-center cursor-zoom-in"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.18}
                onDragEnd={(_e, info) => {
                  if (info.offset.x < -60) go(1)
                  else if (info.offset.x > 60) go(-1)
                }}
                onTap={() => setSelected(item)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
              >
                <img
                  src={item.image}
                  alt={item.label || ''}
                  draggable="false"
                  loading="lazy"
                  decoding="async"
                  className="max-w-full max-h-full w-auto h-auto object-contain select-none pointer-events-none"
                />
              </motion.div>
            </AnimatePresence>

            {/* Flechas */}
            <button
              onClick={() => go(-1)}
              aria-label="Foto anterior"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur border border-espresso/15 text-espresso text-xl flex items-center justify-center hover:bg-background transition-colors shadow"
            >
              ‹
            </button>
            <button
              onClick={() => go(1)}
              aria-label="Foto siguiente"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur border border-espresso/15 text-espresso text-xl flex items-center justify-center hover:bg-background transition-colors shadow"
            >
              ›
            </button>

            {/* Contador de posición */}
            <div className="absolute bottom-3 right-4 rounded-full bg-espresso/60 px-3 py-1 text-xs font-medium text-ivory">
              {index + 1} / {n}
            </div>
          </div>

          {/* Puntos */}
          <div className="flex justify-center gap-2 mt-5">
            {GALLERY_ITEMS.map((it, i) => (
              <button
                key={it.id}
                onClick={() => setIndex(i)}
                aria-label={`Ir a la foto ${i + 1}`}
                aria-current={i === index}
                className={`h-2.5 rounded-full transition-all ${
                  i === index ? 'w-7 bg-terracotta' : 'w-2.5 bg-espresso/20 hover:bg-espresso/40'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <Lightbox item={selected} onClose={() => setSelected(null)} />
    </section>
  )
}
