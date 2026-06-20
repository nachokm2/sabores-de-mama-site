import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import SectionLabel from '../ui/SectionLabel'
import { useScrollReveal } from '../../hooks/useScrollAnimation'

/* ── Decorative plate illustration ──────────────────────────────────────── */
function PlateIllustration({ className }) {
  return (
    <svg viewBox="0 0 280 280" fill="none" className={className} aria-hidden="true">
      <circle cx="140" cy="140" r="130" fill="rgba(200,135,58,0.06)" stroke="rgba(200,135,58,0.2)" strokeWidth="1"/>
      <circle cx="140" cy="140" r="95"  fill="rgba(200,135,58,0.04)" stroke="rgba(200,135,58,0.15)" strokeWidth="1"/>
      <circle cx="140" cy="140" r="55"  fill="rgba(200,135,58,0.07)" />
      {/* Steam */}
      <path d="M115 80 Q120 65 115 50" stroke="rgba(200,135,58,0.4)" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <path d="M140 75 Q145 58 140 42" stroke="rgba(200,135,58,0.5)" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <path d="M165 80 Q170 65 165 50" stroke="rgba(200,135,58,0.4)" strokeWidth="2" strokeLinecap="round" fill="none"/>
    </svg>
  )
}

/* ── Stat card ───────────────────────────────────────────────────────────── */
function StatCard({ number, label, delay }) {
  return (
    <motion.div
      className="text-center"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay, ease: [0.19, 1, 0.22, 1] }}
    >
      <p className="font-display text-5xl md:text-6xl font-bold text-terracotta">{number}</p>
      <p className="font-body text-warm-gray text-sm mt-1 leading-tight">{label}</p>
    </motion.div>
  )
}

/* ── Feature item ────────────────────────────────────────────────────────── */
function FeatureItem({ icon, title, text, delay }) {
  return (
    <motion.div
      className="flex gap-4 items-start"
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.7, delay, ease: [0.19, 1, 0.22, 1] }}
    >
      <span
        className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber/10 flex items-center justify-center text-xl"
        aria-hidden="true"
      >
        {icon}
      </span>
      <div>
        <h3 className="font-display text-lg font-semibold text-espresso mb-1">{title}</h3>
        <p className="font-body text-warm-gray text-sm leading-relaxed">{text}</p>
      </div>
    </motion.div>
  )
}

export default function Storytelling() {
  const sectionRef = useRef(null)
  const textRef = useScrollReveal({ selector: '.reveal-item', stagger: 0.12, y: 40 })

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })

  const illustrationY = useTransform(scrollYProgress, [0, 1], [-40, 40])

  return (
    <section
      ref={sectionRef}
      id="nosotros"
      className="section-padding bg-ivory overflow-hidden"
      aria-labelledby="story-heading"
    >
      <div className="container-site">

        {/* ── Top: Quote strip ── */}
        <div className="flex items-center gap-6 mb-16 md:mb-24 overflow-hidden">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber/30 to-transparent" />
          <p className="font-display italic text-base md:text-lg text-warm-gray text-center whitespace-nowrap px-4">
            "La mesa familiar es el lugar donde el amor se sirve caliente."
          </p>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber/30 to-transparent" />
        </div>

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">

          {/* ── Left: Illustration ── */}
          <motion.div
            className="relative flex items-center justify-center order-2 lg:order-1"
            style={{ y: illustrationY }}
          >
            {/* Background circle */}
            <div
              className="absolute w-72 h-72 md:w-96 md:h-96 rounded-full"
              style={{
                background: 'radial-gradient(ellipse, rgba(200,135,58,0.12) 0%, transparent 70%)',
              }}
              aria-hidden="true"
            />

            {/* Main plate illustration */}
            <PlateIllustration className="w-60 h-60 md:w-80 md:h-80 relative z-10" />

            {/* Floating recipe card */}
            <motion.div
              className="absolute -right-4 top-8 glass-dark rounded-2xl p-4 max-w-[180px]"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <p className="text-2xl mb-1" aria-hidden="true">🥘</p>
              <p className="font-display text-espresso text-sm font-semibold">Receta de abuela</p>
              <p className="font-body text-warm-gray text-xs mt-0.5">Desde 1985</p>
            </motion.div>

            {/* Floating badge */}
            <motion.div
              className="absolute -left-4 bottom-12 glass-dark rounded-2xl p-4 flex items-center gap-3"
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            >
              <span className="text-2xl" aria-hidden="true">💚</span>
              <div>
                <p className="font-body text-espresso text-xs font-semibold">Sin conservantes</p>
                <p className="font-body text-warm-gray text-xs">100% natural</p>
              </div>
            </motion.div>
          </motion.div>

          {/* ── Right: Text ── */}
          <div ref={textRef} className="order-1 lg:order-2 space-y-8">
            <div>
              <SectionLabel>Nuestra Historia</SectionLabel>
              <h2
                id="story-heading"
                className="section-title text-espresso mt-4 reveal-item"
              >
                Cocinamos con el alma.
                <br />
                <em className="text-terracotta not-italic">Siempre lo hicimos.</em>
              </h2>
            </div>

            <p className="font-body text-warm-gray text-base md:text-lg leading-relaxed reveal-item">
              Sabores de Mamá nació de una cocina pequeña y un corazón grande.
              Creemos que la comida casera tiene el poder de transportarte a casa,
              a los domingos en familia, a los olores que nunca se olvidan.
            </p>

            <p className="font-body text-warm-gray text-base leading-relaxed reveal-item">
              Cada plato es preparado con ingredientes frescos seleccionados,
              sin atajos y sin conservantes. Solo sabor auténtico, tal como lo
              prepararía tu mamá.
            </p>

            <div className="space-y-5 pt-2 reveal-item">
              <FeatureItem
                icon="🌿"
                title="Ingredientes frescos"
                text="Seleccionamos los mejores ingredientes de temporada cada mañana."
                delay={0.1}
              />
              <FeatureItem
                icon="👩‍🍳"
                title="Recetas familiares"
                text="Preparaciones transmitidas de generación en generación."
                delay={0.2}
              />
              <FeatureItem
                icon="🏠"
                title="Sabor de hogar"
                text="Cada mordida te devuelve al calor de la mesa familiar."
                delay={0.3}
              />
            </div>
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="mt-20 md:mt-28 pt-12 border-t border-amber/20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatCard number="2.000+" label="Pedidos felices"    delay={0} />
            <StatCard number="8+"     label="Años de experiencia" delay={0.1} />
            <StatCard number="4.9/5"  label="Calificación"       delay={0.2} />
            <StatCard number="15+"    label="Platos en el menú"  delay={0.3} />
          </div>
        </div>
      </div>
    </section>
  )
}
