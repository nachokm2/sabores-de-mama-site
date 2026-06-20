import { motion } from 'framer-motion'
import { openChatBot } from '../../lib/openChatBot'
import { SITE } from '../../data/siteConfig'

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

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
          className="inline-flex w-20 h-20 rounded-full bg-[#25D366]/15 border-2 border-[#25D366]/30 items-center justify-center text-[#25D366] mb-8 mx-auto"
          initial={{ opacity: 0, scale: 0.5 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <WhatsAppIcon />
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
          <span className="text-[#15803D]">Escríbenos.</span>
        </motion.h2>

        {/* Sub */}
        <motion.p
          className="font-body text-warm-gray text-base md:text-lg leading-relaxed mb-10 max-w-md mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, delay: 0.25 }}
        >
          Un mensaje y en minutos tienes tu pedido confirmado.
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
            className="flex items-center gap-3 bg-[#25D366] text-white font-semibold text-base px-8 py-4 rounded-full shadow-[0_4px_24px_rgba(37,211,102,0.45)] hover:bg-[#1ebe57] transition-colors"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            aria-label="Hacer pedido por WhatsApp ahora"
          >
            <WhatsAppIcon />
            Pedir ahora por WhatsApp
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
