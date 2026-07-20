import { motion } from 'framer-motion'
import { openChatBot } from '../../lib/openChatBot'
import { SITE } from '../../data/siteConfig'
import UtensilsIcon from '../ui/UtensilsIcon'

function SmokeEffect() {
  return (
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-40 pointer-events-none" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="absolute bottom-0 w-10 h-20 rounded-full"
          style={{
            left: `${i * 35}%`,
            background: 'radial-gradient(ellipse, rgba(200,135,58,0.1) 0%, transparent 70%)',
            animation: `smoke ${7 + i * 1.5}s ease-in-out infinite`,
            animationDelay: `${i * 1.2}s`,
          }}
        />
      ))}
    </div>
  )
}

export default function WhatsAppCTA() {

  return (
    <section
      className="relative overflow-hidden section-padding"
      aria-labelledby="cta-heading"
    >
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 20% 50%, rgba(194,121,47,0.16) 0%, transparent 55%),
            radial-gradient(ellipse at 80% 30%, rgba(181,81,46,0.12) 0%, transparent 55%),
            linear-gradient(135deg, #FBF6EE 0%, #F7EFE2 100%)
          `,
        }}
        aria-hidden="true"
      />

      {/* Grain */}
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.07'/%3E%3C/svg%3E")`,
        }}
        aria-hidden="true"
      />

      <SmokeEffect />

      <div className="container-narrow relative z-10 text-center">
        {/* Icon */}
        <motion.div
          className="inline-flex w-20 h-20 rounded-full bg-amber/15 border-2 border-amber/40 items-center justify-center text-terracotta mb-8 mx-auto"
          initial={{ opacity: 0, scale: 0.5 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <UtensilsIcon className="w-8 h-8" />
        </motion.div>

        {/* Headline */}
        <motion.h2
          id="cta-heading"
          className="font-display text-4xl md:text-5xl lg:text-6xl text-espresso leading-[1.05] tracking-tighter-display mb-6 text-balance"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.19, 1, 0.22, 1] }}
        >
          ¿Con hambre?
          <br />
          <span className="text-terracotta">Pídelo aquí.</span>
        </motion.h2>

        {/* Sub */}
        <motion.p
          className="font-body text-warm-gray text-base md:text-lg leading-relaxed mb-10 max-w-md mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, delay: 0.25 }}
        >
          En unos pocos pasos completas tu pedido.
          Sin apps, sin registros complicados. Solo comida de verdad, directo a tu puerta.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          className="flex flex-wrap justify-center gap-4 mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, delay: 0.35 }}
        >
          <motion.button
            onClick={openChatBot}
            className="flex items-center gap-3 bg-terracotta text-ivory font-semibold text-base px-8 py-4 rounded-full shadow-[0_4px_24px_rgba(174,76,41,0.35)] hover:bg-ember transition-colors"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            aria-label="Completar mi pedido ahora"
          >
            <UtensilsIcon className="w-6 h-6" />
            Pedir ahora
          </motion.button>
          <motion.button
            onClick={openChatBot}
            className="btn-outline-light"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
          >
            Ver menú completo
          </motion.button>
        </motion.div>

        {/* Hours */}
        <motion.div
          className="text-warm-gray text-sm font-body space-y-1"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <p>{SITE.hours.weekdays}</p>
          <p>{SITE.hours.weekend}</p>
          <p className="mt-3 text-warm-gray/70 text-xs">📍 {SITE.address}</p>
        </motion.div>
      </div>
    </section>
  )
}
