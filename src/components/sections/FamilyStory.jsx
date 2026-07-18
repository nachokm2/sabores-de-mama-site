import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import SectionLabel from '../ui/SectionLabel'
import { imagenUrl } from '../../lib/publicApi'

// Imagen de la sección "Nuestra Esencia" del inicio (servida desde el bucket).
const FAMILY_IMG = import.meta.env.VITE_HOME_FAMILY_IMG || 'home/6.jpg'

const AUDIENCIAS = [
  { emoji: '💼', title: 'Quienes trabajan todo el día', text: 'Llegan a casa con ganas de disfrutar una buena comida, no de pasar horas cocinando.' },
  { emoji: '🏡', title: 'Quienes extrañan el sabor de hogar', text: 'Buscan volver a disfrutar el sabor auténtico de una comida casera, preparada con cariño.' },
  { emoji: '👨‍👩‍👧‍👦', title: 'Familias que quieren compartir más tiempo juntas', text: 'Prefieren dedicar su tiempo a estar con quienes más quieren y dejar la cocina en nuestras manos.' },
  { emoji: '🥘', title: 'Personas que quieren comer mejor', text: 'Eligen comida casera y nutritiva como una alternativa a la comida rápida y los alimentos ultraprocesados.' },
]

function MomentCard({ moment, index }) {
  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.8, delay: index * 0.15, ease: [0.19, 1, 0.22, 1] }}
    >
      {/* Vertical line connector */}
      {index < AUDIENCIAS.length - 1 && (
        <div
          className="absolute left-5 top-14 w-px h-12 bg-gradient-to-b from-amber/40 to-transparent"
          aria-hidden="true"
        />
      )}

      <div className="flex gap-5 items-start">
        {/* Icon */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber/10 border border-amber/20 flex items-center justify-center text-lg">
          {moment.emoji}
        </div>
        {/* Text */}
        <div className="pt-1.5">
          <h3 className="font-display text-espresso text-lg font-semibold mb-1">{moment.title}</h3>
          <p className="font-body text-warm-gray text-sm leading-relaxed">{moment.text}</p>
        </div>
      </div>
    </motion.div>
  )
}

export default function FamilyStory() {
  const sectionRef = useRef(null)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })

  const textY       = useTransform(scrollYProgress, [0, 1], [40, -40])
  const illustrY    = useTransform(scrollYProgress, [0, 1], [-30, 30])

  return (
    <section
      ref={sectionRef}
      className="relative section-padding overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #FFFCF7 0%, #FBF6EE 50%, #F4EADB 100%)' }}
      aria-label="Nuestra esencia"
    >
      {/* Grain overlay */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.07'/%3E%3C/svg%3E")`,
        }}
        aria-hidden="true"
      />

      {/* Amber glow right */}
      <div
        className="absolute right-0 top-1/2 -translate-y-1/2 w-96 h-96 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at right, rgba(194,121,47,0.1) 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      <div className="container-site relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">

          {/* ── Left: Imagen ── */}
          <motion.div style={{ y: textY }}>
            <img
              src={imagenUrl(FAMILY_IMG)}
              alt="La comida de mamá, hecha con cariño"
              className="w-full aspect-[4/5] object-cover rounded-3xl shadow-xl"
              loading="lazy"
            />
          </motion.div>

          {/* ── Right: Timeline moments ── */}
          <motion.div style={{ y: illustrY }} className="space-y-8">
            <h3 className="font-display text-espresso text-2xl font-bold mb-8">
              Cocinamos para personas como tú
            </h3>
            {AUDIENCIAS.map((moment, i) => (
              <MomentCard key={moment.title} moment={moment} index={i} />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
