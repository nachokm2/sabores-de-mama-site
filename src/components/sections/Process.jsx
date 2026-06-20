import { motion } from 'framer-motion'
import SectionLabel from '../ui/SectionLabel'
import { useScrollReveal } from '../../hooks/useScrollAnimation'

const STEPS = [
  {
    step: '01',
    icon: '📱',
    title: 'Elige tu plato',
    description: 'Revisa nuestro menú y elige lo que más se te antoje. Tenemos algo para cada hambre y cada momento.',
    color: 'from-amber/20 to-gold/10',
    borderColor: 'border-amber/30',
    accentColor: 'text-accent-600',
  },
  {
    step: '02',
    icon: '💬',
    title: 'Escríbenos por WhatsApp',
    description: 'Envíanos tu pedido por WhatsApp. Te confirmamos disponibilidad y precio en minutos. Sin complicaciones.',
    color: 'from-[#25D366]/15 to-[#25D366]/5',
    borderColor: 'border-[#25D366]/30',
    accentColor: 'text-[#166534]',
  },
  {
    step: '03',
    icon: '👩‍🍳',
    title: 'Cocinamos con amor',
    description: 'Preparamos tu pedido fresco, con los mejores ingredientes. Cada plato sale de nuestra cocina al tuyo.',
    color: 'from-terracotta/15 to-ember/10',
    borderColor: 'border-terracotta/30',
    accentColor: 'text-terracotta',
  },
  {
    step: '04',
    icon: '🏠',
    title: 'Llega a tu puerta',
    description: 'Recibe tu comida caliente y lista para disfrutar. El sabor de mamá, en tu hogar, cuando lo necesitas.',
    color: 'from-gold/15 to-amber/10',
    borderColor: 'border-gold/30',
    accentColor: 'text-ember',
  },
]

function StepCard({ step, index }) {
  return (
    <motion.div
      className={`relative rounded-2xl p-6 md:p-7 border bg-gradient-to-br ${step.color} ${step.borderColor} overflow-hidden group`}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay: index * 0.12, ease: [0.19, 1, 0.22, 1] }}
      whileHover={{ y: -4 }}
    >
      {/* Step number - background */}
      <span
        className={`absolute -right-3 -top-3 font-display text-7xl font-bold opacity-[0.06] select-none ${step.accentColor}`}
        aria-hidden="true"
      >
        {step.step}
      </span>

      {/* Icon */}
      <div className="text-4xl mb-4" aria-hidden="true">{step.icon}</div>

      {/* Step label */}
      <p className={`font-body text-xs font-semibold tracking-[0.15em] uppercase mb-2 ${step.accentColor}`}>
        Paso {step.step}
      </p>

      {/* Title */}
      <h3 className="font-display text-espresso text-xl font-bold mb-3 leading-tight">
        {step.title}
      </h3>

      {/* Description */}
      <p className="font-body text-warm-gray text-sm leading-relaxed">
        {step.description}
      </p>

      {/* Connector arrow (except last) */}
      {index < STEPS.length - 1 && (
        <div
          className="hidden lg:block absolute -right-5 top-1/2 -translate-y-1/2 z-10 text-warm-gray/40"
          aria-hidden="true"
        >
          →
        </div>
      )}
    </motion.div>
  )
}

export default function Process() {
  const headerRef = useScrollReveal({ selector: '.process-item', stagger: 0.1, y: 30 })

  return (
    <section
      className="section-padding bg-ivory overflow-hidden"
      aria-labelledby="process-heading"
    >
      <div className="container-site">
        {/* Header */}
        <div ref={headerRef} className="text-center mb-14 md:mb-16">
          <SectionLabel>¿Cómo funciona?</SectionLabel>
          <h2
            id="process-heading"
            className="section-title text-espresso mt-4 process-item"
          >
            Pedir es
            <span className="text-terracotta"> tan fácil</span>
            <br />
            como llamar a mamá.
          </h2>
          <p className="section-subtitle mx-auto mt-5 process-item">
            En pocos pasos tienes comida casera en tu mesa.
            Sin apps, sin registros, sin complicaciones.
          </p>
        </div>

        {/* Steps grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
          {STEPS.map((step, i) => (
            <StepCard key={step.step} step={step} index={i} />
          ))}
        </div>

        {/* Bottom note */}
        <motion.p
          className="text-center text-warm-gray text-sm mt-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.5 }}
        >
          📍 Delivery disponible en Santiago · Consulta cobertura por WhatsApp
        </motion.p>
      </div>
    </section>
  )
}
