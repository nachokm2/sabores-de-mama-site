import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SectionLabel from '../ui/SectionLabel'
import { useWhatsApp } from '../../hooks/useWhatsApp'

const FAQ_ITEMS = [
  {
    q: '¿Cuál es el tiempo de entrega?',
    a: 'Normalmente entre 45 minutos y 1 hora según tu sector y la demanda del día. Te confirmamos el tiempo exacto al recibir tu pedido.',
  },
  {
    q: '¿Hacen delivery los fines de semana?',
    a: 'Sí, atendemos sábados y domingos de 11:00 a 17:00. Los domingos son especialmente populares para la cazuela familiar.',
  },
  {
    q: '¿Puedo hacer el pedido con anticipación?',
    a: 'Por supuesto. Puedes escribirnos el día anterior o en la mañana para asegurar tu pedido, especialmente para los platos más solicitados.',
  },
  {
    q: '¿Hacen pedidos para eventos o grupos grandes?',
    a: 'Sí, tenemos precios especiales para pedidos de 10 o más porciones. Contáctanos con al menos 48 horas de anticipación.',
  },
  {
    q: '¿Cómo se paga?',
    a: 'Aceptamos transferencia bancaria y efectivo al momento de la entrega. Los datos de pago se envían al confirmar el pedido.',
  },
  {
    q: '¿En qué comunas hacen delivery?',
    a: 'Cubrimos varias comunas de Santiago. Escríbenos tu dirección y te confirmamos si estamos en tu sector.',
  },
]

function FaqItem({ item, index }) {
  const [open, setOpen] = useState(false)

  return (
    <motion.div
      className="border-b border-wheat/30 last:border-0"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: [0.19, 1, 0.22, 1] }}
    >
      <button
        className="w-full flex items-center justify-between py-5 text-left group"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
      >
        <span className="font-display text-espresso text-base font-semibold pr-6 group-hover:text-amber transition-colors duration-200">
          {item.q}
        </span>
        <motion.span
          className="flex-shrink-0 w-7 h-7 rounded-full border border-amber/30 flex items-center justify-center text-amber text-base leading-none"
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.28 }}
          aria-hidden="true"
        >
          +
        </motion.span>
      </button>

      <motion.div
        initial={false}
        animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.32, ease: [0.19, 1, 0.22, 1] }}
        className="overflow-hidden"
      >
        <p className="font-body text-warm-gray text-sm leading-relaxed pb-5 pr-10">
          {item.a}
        </p>
      </motion.div>
    </motion.div>
  )
}

export default function FAQ() {
  const { openDefault } = useWhatsApp()

  return (
    <section className="section-padding bg-cream" aria-labelledby="faq-heading">
      <div className="container-site">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">

          {/* Left: heading + CTA */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
          >
            <SectionLabel>Preguntas frecuentes</SectionLabel>
            <h2 id="faq-heading" className="section-title text-espresso mt-4 mb-6">
              Todo lo que
              <br />
              <em className="not-italic text-amber">necesitas saber.</em>
            </h2>
            <p className="font-body text-warm-gray text-base leading-relaxed mb-8">
              ¿Tienes más dudas? Escríbenos directamente por WhatsApp y
              te respondemos en minutos.
            </p>
            <motion.button
              onClick={openDefault}
              className="btn-whatsapp text-sm"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              <WaIcon />
              Consultar por WhatsApp
            </motion.button>
          </motion.div>

          {/* Right: accordion */}
          <div>
            {FAQ_ITEMS.map((item, i) => (
              <FaqItem key={item.q} item={item} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function WaIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}
