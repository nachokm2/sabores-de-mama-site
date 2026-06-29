import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import SectionLabel from '../ui/SectionLabel'

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
      aria-labelledby="family-story-heading"
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

          {/* ── Left: Text ── */}
          <motion.div style={{ y: textY }}>
            <SectionLabel light>Nuestra Esencia</SectionLabel>

            <h2
              id="family-story-heading"
              className="section-title-light mt-5 mb-7"
            >
              La comida de mamá
              <br />
              <em className="not-italic text-gradient-gold">nunca se olvida.</em>
            </h2>

            <p className="font-body text-warm-gray text-base md:text-lg leading-relaxed mb-8">
              Hay algo mágico en la comida casera. No es solo el sabor —
              es el recuerdo de una cocina llena de vapor, el sonido de la olla
              en el fuego, y la voz que dice "ya está lista la comida".
            </p>

            <p className="font-body text-warm-gray text-base leading-relaxed mb-10">
              En Sabores de Mamá recreamos esa magia. Cada plato que preparamos
              carga una historia familiar, un secreto culinario y una gran dosis
              de amor. Porque creemos que comer bien es también cuidarse,
              y cuidar a los que queremos.
            </p>

            {/* Pull quote */}
            <div className="border-l-2 border-terracotta pl-5">
              <p className="font-display text-xl text-espresso italic">
                "No cocinamos para vender. Cocinamos para compartir."
              </p>
              <p className="font-body text-warm-gray text-sm mt-2">— Fundadora, Sabores de Mamá</p>
            </div>
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
