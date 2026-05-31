import { useState } from 'react'
import { motion } from 'framer-motion'
import { Helmet } from 'react-helmet-async'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import PageHero from '../components/ui/PageHero'
import SectionLabel from '../components/ui/SectionLabel'
import { SITE, getWhatsAppLink } from '../data/siteConfig'
import { useWhatsApp } from '../hooks/useWhatsApp'

const WhatsAppIcon = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

const FAQ_ITEMS = [
  {
    q: '¿En qué comunas trabajan?',
    a: 'Meal Prep: Las Condes, Providencia, La Reina, Ñuñoa, Vitacura, Santiago, Lo Barnechea y San Miguel. Cocinera a Domicilio: Las Condes, Providencia, Vitacura y Ñuñoa.',
  },
  {
    q: '¿Cuántas preparaciones incluye cada servicio?',
    a: 'Cada servicio incluye hasta 5 preparaciones a elegir de nuestro menú. Si quieres algo que no está en la lista, nos adaptamos a tus preferencias.',
  },
  {
    q: '¿Qué necesito para el Meal Prep?',
    a: 'Solo enviar los ingredientes a mi domicilio (via Rappi, PedidosYa u otro delivery) o acordar la entrega. Yo me encargo de cocinar, porcionar y sellar al vacío todo.',
  },
  {
    q: '¿Qué necesito para la Cocinera a Domicilio?',
    a: 'Tener los ingredientes listos en casa. Yo llego, cocino hasta 5 preparaciones en 2 a 5 horas según la cantidad y complejidad, y dejo la cocina limpia al terminar.',
  },
  {
    q: '¿Los Dulces Saludables necesitan ingredientes?',
    a: 'No, los dulces son elaborados completamente por mí. Puedes agregarlos a cualquier servicio sin aportar nada extra.',
  },
  {
    q: '¿Cómo se coordina y paga el servicio?',
    a: 'Todo se coordina por WhatsApp. Al confirmar el servicio te enviamos los datos de pago. Aceptamos transferencia bancaria.',
  },
]

function FaqItem({ item, index }) {
  const [open, setOpen] = useState(false)

  return (
    <motion.div
      className="border-b border-wheat/40 last:border-0"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.07 }}
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
          className="flex-shrink-0 w-6 h-6 rounded-full border border-amber/30 flex items-center justify-center text-amber text-sm"
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.3 }}
          aria-hidden="true"
        >
          +
        </motion.span>
      </button>
      <AnimatedAnswer open={open} answer={item.a} />
    </motion.div>
  )
}

function AnimatedAnswer({ open, answer }) {
  return (
    <motion.div
      initial={false}
      animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
      transition={{ duration: 0.35, ease: [0.19, 1, 0.22, 1] }}
      className="overflow-hidden"
    >
      <p className="font-body text-warm-gray text-sm leading-relaxed pb-5">
        {answer}
      </p>
    </motion.div>
  )
}

export default function Contacto() {
  const { openDefault, openMenu } = useWhatsApp()

  return (
    <>
      <Helmet>
        <title>Contacto | Sabores de Mamá</title>
        <meta name="description" content="Contáctanos por WhatsApp para hacer tu pedido o resolver tus dudas. Atendemos de lunes a viernes 11:00-20:00 y fines de semana 11:00-17:00." />
      </Helmet>

      <Navbar />

      <main>
        <PageHero
          label="Contacto"
          title="¿Con hambre?"
          titleHighlight="Escríbenos."
          subtitle="Un mensaje y en minutos tienes tu pedido confirmado. Sin apps, sin registros. Solo comida de verdad."
          breadcrumb={[{ label: 'Inicio', href: '/' }, { label: 'Contacto', href: '/contacto' }]}
        >
          <button onClick={openDefault} className="btn-whatsapp">
            <WhatsAppIcon className="w-5 h-5" />
            Abrir WhatsApp
          </button>
        </PageHero>

        {/* ── Main contact section ── */}
        <section className="section-padding bg-ivory" aria-labelledby="contact-heading">
          <div className="container-site">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20">

              {/* ── Left: WhatsApp + info ── */}
              <div>
                <SectionLabel>Canales de contacto</SectionLabel>
                <h2 id="contact-heading" className="section-title text-espresso mt-4 mb-8">
                  Siempre cerca,
                  <br />
                  <em className="not-italic text-amber">siempre disponibles.</em>
                </h2>

                {/* WhatsApp card */}
                <motion.a
                  href={getWhatsAppLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-5 bg-[#25D366]/8 border-2 border-[#25D366]/30 rounded-2xl p-6 mb-4 hover:border-[#25D366]/60 hover:bg-[#25D366]/12 transition-all duration-300 group"
                  whileHover={{ y: -2 }}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="w-12 h-12 rounded-full bg-[#25D366]/15 flex items-center justify-center text-[#25D366] flex-shrink-0">
                    <WhatsAppIcon />
                  </div>
                  <div className="flex-1">
                    <p className="font-display text-espresso font-bold text-lg">WhatsApp</p>
                    <p className="font-body text-warm-gray text-sm">La forma más rápida de hacer tu pedido</p>
                  </div>
                  <span className="text-[#25D366] text-xl group-hover:translate-x-1 transition-transform duration-200" aria-hidden="true">→</span>
                </motion.a>

                {/* Email */}
                <motion.a
                  href={`mailto:${SITE.email}`}
                  className="flex items-center gap-5 bg-amber/5 border border-amber/20 rounded-2xl p-5 mb-6 hover:border-amber/40 hover:bg-amber/8 transition-all duration-300 group"
                  whileHover={{ y: -2 }}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  <div className="w-10 h-10 rounded-full bg-amber/10 flex items-center justify-center text-amber flex-shrink-0 text-lg">
                    ✉️
                  </div>
                  <div className="flex-1">
                    <p className="font-display text-espresso font-semibold">{SITE.email}</p>
                    <p className="font-body text-warm-gray text-xs">Para consultas no urgentes</p>
                  </div>
                </motion.a>

                {/* Info grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { icon: '⏰', title: 'Horarios', lines: [SITE.hours.weekdays, SITE.hours.weekend] },
                    { icon: '📍', title: 'Cobertura', lines: ['Meal Prep: Las Condes, Providencia, La Reina, Ñuñoa, Vitacura, Santiago, Lo Barnechea, San Miguel', 'Cocinera: Las Condes, Providencia, Vitacura, Ñuñoa'] },
                  ].map((card) => (
                    <motion.div
                      key={card.title}
                      className="bg-cream rounded-xl p-5"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5 }}
                    >
                      <p className="text-2xl mb-2" aria-hidden="true">{card.icon}</p>
                      <p className="font-display text-espresso font-semibold mb-1">{card.title}</p>
                      {card.lines.map((l) => (
                        <p key={l} className="font-body text-warm-gray text-xs leading-relaxed">{l}</p>
                      ))}
                    </motion.div>
                  ))}
                </div>

                {/* Social */}
                <div className="mt-6 pt-6 border-t border-wheat/50">
                  <p className="font-body text-warm-gray text-xs uppercase tracking-widest mb-4">Síguenos</p>
                  <div className="flex gap-4">
                    {[
                      { label: 'Instagram', href: SITE.social.instagram, icon: '📸' },
                      { label: 'Facebook',  href: SITE.social.facebook,  icon: '👍' },
                      { label: 'TikTok',    href: SITE.social.tiktok,    icon: '🎵' },
                    ].map(({ label, href, icon }) =>
                      href ? (
                        <motion.a
                          key={label}
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={label}
                          className="flex items-center gap-2 text-sm font-body text-warm-gray hover:text-amber transition-colors duration-200"
                          whileHover={{ y: -2 }}
                        >
                          <span aria-hidden="true">{icon}</span> {label}
                        </motion.a>
                      ) : (
                        <span
                          key={label}
                          title={`${label} próximamente`}
                          className="flex items-center gap-2 text-sm font-body text-warm-gray/30 cursor-default select-none"
                        >
                          <span aria-hidden="true">{icon}</span> {label}
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* ── Right: FAQ ── */}
              <div>
                <SectionLabel>Preguntas frecuentes</SectionLabel>
                <h2 className="section-title text-espresso mt-4 mb-8">
                  Todo lo que
                  <br />
                  <em className="not-italic text-amber">necesitas saber.</em>
                </h2>
                <div className="divide-y-0">
                  {FAQ_ITEMS.map((item, i) => (
                    <FaqItem key={item.q} item={item} index={i} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Big WhatsApp CTA ── */}
        <section
          className="relative section-padding overflow-hidden"
          style={{ background: 'linear-gradient(160deg, #0A0604 0%, #2C1810 100%)' }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(37,211,102,0.08) 0%, transparent 60%)' }}
            aria-hidden="true"
          />
          <div className="container-narrow relative z-10 text-center">
            <div className="w-16 h-16 rounded-full bg-[#25D366]/15 border-2 border-[#25D366]/30 flex items-center justify-center mx-auto mb-6 text-[#25D366]">
              <WhatsAppIcon className="w-7 h-7" />
            </div>
            <h2 className="section-title-light mb-4">
              ¿Listo para pedir?
            </h2>
            <p className="font-body text-ivory/55 text-base leading-relaxed mb-8 max-w-sm mx-auto">
              Un mensaje es todo lo que necesitas. Te respondemos en minutos.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <motion.button
                onClick={openDefault}
                className="flex items-center gap-3 bg-[#25D366] text-white font-semibold text-base px-8 py-4 rounded-full shadow-[0_4px_24px_rgba(37,211,102,0.4)] hover:bg-[#1ebe57] transition-colors"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
              >
                <WhatsAppIcon />
                Hacer pedido ahora
              </motion.button>
              <motion.button
                onClick={openMenu}
                className="btn-outline-light"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
              >
                Ver menú completo
              </motion.button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
