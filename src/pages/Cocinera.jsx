import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Helmet } from 'react-helmet-async'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import PageHero from '../components/ui/PageHero'
import SectionLabel from '../components/ui/SectionLabel'
import { getComunas } from '../lib/publicApi'
import { fmtCLP } from '../lib/flowConfig'
import { WHATSAPP, getWhatsAppLink } from '../data/siteConfig'

/* ── Cómo funciona ───────────────────────────────────────────────────────── */
const PASOS = [
  {
    n: '01',
    icon: '📅',
    title: 'Elige tus platos y agenda',
    text: 'Seleccionas hasta 5 preparaciones y la fecha en que quieres que mamá vaya a tu hogar a cocinar.',
  },
  {
    n: '02',
    icon: '🛒',
    title: 'Recibe tu lista de compras',
    text: 'Según los platos que elegiste, te generamos la lista de ingredientes. Tú los compras y los tienes listos en casa.',
  },
  {
    n: '03',
    icon: '👩‍🍳',
    title: 'Mamá cocina en tu hogar',
    text: 'Estela llega a tu casa y cocina tus preparaciones con su sazón de siempre. El servicio dura entre 2 y 5 horas según la cantidad de platos.',
  },
  {
    n: '04',
    icon: '✨',
    title: 'Cocina limpia, comida lista',
    text: 'Al terminar deja tu cocina limpia y ordenada, y tú te quedas con toda tu comida lista para la semana.',
  },
]

const INCLUYE = [
  'Cocinera a domicilio: hasta 5 preparaciones con la sazón de mamá',
  'Generación de tu lista de compras según los platos elegidos',
  'Dejamos tu cocina limpia y ordenada al terminar',
  'Movilización de la cocinera (según tu comuna)',
]

const NO_INCLUYE = [
  'Los ingredientes (los compras tú con tu lista de compras) y tu cocina',
  'Los aliños y condimentos',
]

function PasoCard({ paso, index }) {
  return (
    <motion.div
      className="relative bg-ivory border border-wheat/50 rounded-2xl p-6 hover:border-amber/40 hover:shadow-lg transition-all duration-400"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay: index * 0.1, ease: [0.19, 1, 0.22, 1] }}
    >
      <span className="absolute top-5 right-5 font-display text-4xl font-bold text-amber/20" aria-hidden="true">
        {paso.n}
      </span>
      <span className="text-3xl mb-4 block" aria-hidden="true">{paso.icon}</span>
      <h3 className="font-display text-espresso text-lg font-bold mb-2 pr-10">{paso.title}</h3>
      <p className="font-body text-warm-gray text-sm leading-relaxed">{paso.text}</p>
    </motion.div>
  )
}

export default function Cocinera() {
  const [comunas, setComunas] = useState([])

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const lista = await getComunas('cocinera')
        if (active && Array.isArray(lista)) setComunas(lista)
      } catch {
        /* sin cobertura en vivo: la sección lo indica */
      }
    })()
    return () => {
      active = false
    }
  }, [])

  // La Cocinera a Domicilio se coordina por WhatsApp (horario, visita, detalles).
  const agendar = () => window.open(getWhatsAppLink(WHATSAPP.cocineraMessage), '_blank', 'noopener')

  return (
    <>
      <Helmet>
        <title>Cocinera a Domicilio | Sabores de Mamá</title>
        <meta
          name="description"
          content="Cocinera a Domicilio de Sabores de Mamá: mamá va a tu hogar y cocina hasta 5 preparaciones con tus ingredientes. Recibes tu lista de compras y deja la cocina limpia. Valor $55.000 + movilización según comuna."
        />
      </Helmet>

      <Navbar />

      <main>
        {/* ── Hero ── */}
        <PageHero
          label="Cocinera a Domicilio"
          title="Tu cocina,"
          titleHighlight="lista para toda la semana."
          subtitle="Llegamos a tu hogar, cocinamos por ti y dejamos cada preparación lista para disfrutar."
          breadcrumb={[{ label: 'Inicio', href: '/' }, { label: 'Cocinera a Domicilio', href: '/cocinera' }]}
        >
          <button onClick={agendar} className="btn-whatsapp text-sm">
            Agendar por WhatsApp
          </button>
        </PageHero>

        {/* ── En qué consiste ── */}
        <section className="section-padding bg-ivory" aria-labelledby="consiste-heading">
          <div className="container-site max-w-3xl text-center">
            <SectionLabel>¿En qué consiste?</SectionLabel>
            <h2 id="consiste-heading" className="section-title text-espresso mt-4 mb-5">
              Nosotros cocinamos. <em className="not-italic text-amber">Tú disfrutas.</em>
            </h2>
            <div className="space-y-4 font-body text-warm-gray text-base md:text-lg leading-relaxed">
              <p>
                Tú eliges <strong className="text-espresso">hasta 5 preparaciones</strong> y recibes una lista
                con todos los ingredientes que necesitarás.
              </p>
              <p>
                El día agendado vamos a tu hogar, cocinamos cada plato, dejamos las preparaciones
                listas para la semana y tu <strong className="text-espresso">cocina limpia y ordenada</strong>.
              </p>
              <p>Solo preocúpate de disfrutar la comida.</p>
            </div>
          </div>
        </section>

        {/* ── Cómo funciona ── */}
        <section className="section-padding bg-cream" aria-labelledby="pasos-heading">
          <div className="container-site">
            <div className="text-center mb-14">
              <SectionLabel>Cómo funciona</SectionLabel>
              <h2 id="pasos-heading" className="section-title text-espresso mt-4">
                Cuatro pasos, <em className="not-italic text-amber">y a disfrutar.</em>
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {PASOS.map((p, i) => (
                <PasoCard key={p.n} paso={p} index={i} />
              ))}
            </div>
          </div>
        </section>

        {/* ── Qué incluye / qué no ── */}
        <section className="section-padding bg-ivory" aria-labelledby="incluye-heading">
          <div className="container-site max-w-4xl">
            <div className="text-center mb-12">
              <SectionLabel>Claro y transparente</SectionLabel>
              <h2 id="incluye-heading" className="section-title text-espresso mt-4">
                Qué incluye el servicio.
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-cream border border-[#15803D]/20 rounded-2xl p-6">
                <h3 className="font-display text-espresso text-lg font-bold mb-4 flex items-center gap-2">
                  <span aria-hidden="true">✅</span> Incluido en el cobro
                </h3>
                <ul className="space-y-3">
                  {INCLUYE.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 font-body text-warm-gray text-sm leading-relaxed">
                      <span className="text-[#15803D] mt-0.5" aria-hidden="true">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-cream border border-amber/30 rounded-2xl p-6">
                <h3 className="font-display text-espresso text-lg font-bold mb-4 flex items-center gap-2">
                  <span aria-hidden="true">🛒</span> Lo pones tú (aparte)
                </h3>
                <ul className="space-y-3">
                  {NO_INCLUYE.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 font-body text-warm-gray text-sm leading-relaxed">
                      <span className="text-amber mt-0.5" aria-hidden="true">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs text-warm-gray bg-ivory border border-wheat/50 rounded-xl p-3">
                  Te entregamos la lista de compras según los platos que elijas, así sabes
                  exactamente qué comprar. 💚
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Cobertura y movilización por comuna ── */}
        <section className="section-padding bg-cream" aria-labelledby="cobertura-heading">
          <div className="container-site max-w-4xl">
            <div className="text-center mb-10">
              <SectionLabel>Cobertura y movilización</SectionLabel>
              <h2 id="cobertura-heading" className="section-title text-espresso mt-4 mb-4">
                La movilización depende <em className="not-italic text-amber">de tu comuna.</em>
              </h2>
              <p className="font-body text-warm-gray text-base max-w-xl mx-auto">
                Mamá se traslada a estas comunas del Gran Santiago. El valor de la movilización
                se ajusta según la distancia y queda incluido al momento de agendar.
              </p>
            </div>

            {comunas.length > 0 ? (
              <div className="bg-ivory border border-wheat/50 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {comunas.map((c) => (
                    <div
                      key={c.id || c.nombre}
                      className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-wheat/40 text-sm"
                    >
                      <span className="text-espresso">{c.nombre}</span>
                      <span className="font-semibold text-terracotta whitespace-nowrap">
                        {Number(c.costo_despacho) > 0 ? fmtCLP(c.costo_despacho) : 'Gratis'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-center font-body text-warm-gray text-sm">
                Consulta la movilización de tu comuna al momento de agendar.
              </p>
            )}
          </div>
        </section>

        {/* ── CTA final ── */}
        <section className="py-20 bg-background-warm border-t border-espresso/10">
          <div className="container-site text-center max-w-2xl">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-espresso mb-4">
              ¿Lista para que mamá cocine en tu casa?
            </h2>
            <p className="font-body text-warm-gray text-base mb-8">
              Escríbenos por WhatsApp y coordinamos tus platos, la fecha y la visita de mamá a tu hogar.
            </p>
            <button onClick={agendar} className="btn-whatsapp">
              Agendar por WhatsApp
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
