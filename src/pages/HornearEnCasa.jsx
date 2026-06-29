import { motion } from 'framer-motion'
import { Helmet } from 'react-helmet-async'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import PageHero from '../components/ui/PageHero'
import SectionLabel from '../components/ui/SectionLabel'
import { DULCES_FAMILIAR, DULCES_SNACKS } from '../data/menu'
import { WHATSAPP, getWhatsAppLink } from '../data/siteConfig'

/* ── Dos formas de disfrutarlos ──────────────────────────────────────────── */
const MODOS = [
  {
    icon: '🍰',
    title: 'Listos para disfrutar',
    text: 'Llegan ya horneados a tu casa. Solo abres, sirves y disfrutas un dulce casero cuando se te antoje.',
  },
  {
    icon: '🔥',
    title: 'Para hornear en casa',
    text: 'Los terminas en tu propio horno y los sirves calentitos, con ese aroma y sabor de recién hecho que llena la casa.',
  },
]

function DulceCard({ item, index }) {
  return (
    <motion.div
      className="bg-ivory border border-wheat/50 rounded-2xl overflow-hidden hover:border-amber/40 hover:shadow-lg transition-all duration-400"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, delay: index * 0.06, ease: [0.19, 1, 0.22, 1] }}
    >
      <div className={`relative h-28 bg-gradient-to-br ${item.gradient} flex items-center justify-center overflow-hidden`}>
        {item.image ? (
          <img src={item.image} alt={item.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <span className="text-4xl" aria-hidden="true">{item.emoji}</span>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-display text-espresso text-sm font-bold leading-tight">{item.name}</h3>
        <p className="font-body text-warm-gray text-2xs mb-1">{item.subtitle}</p>
        <p className="font-body text-terracotta text-sm font-bold">{item.priceLabel}</p>
      </div>
    </motion.div>
  )
}

export default function HornearEnCasa() {
  const pedir = () => window.open(getWhatsAppLink(WHATSAPP.horneadosMessage), '_blank', 'noopener')

  return (
    <>
      <Helmet>
        <title>Healthy | Sabores de Mamá</title>
        <meta
          name="description"
          content="Postres y galletas saludables hechos en casa: los recibes listos para disfrutar o para hornear en casa y tenerlos como recién hechos. Sin culpa, sin conservantes."
        />
      </Helmet>

      <Navbar />

      <main>
        {/* ── Hero ── */}
        <PageHero
          label="Healthy"
          title="Postres y galletas,"
          titleHighlight="como recién hechos."
          subtitle="Dulces saludables hechos en casa: los recibes listos para disfrutar o para terminar en tu horno y servirlos calentitos, con ese aroma de recién horneado."
          breadcrumb={[{ label: 'Inicio', href: '/' }, { label: 'Healthy', href: '/healthy' }]}
        >
          <button onClick={pedir} className="btn-whatsapp text-sm">
            Pedir por WhatsApp
          </button>
        </PageHero>

        {/* ── En qué consiste (heading "sin culpa") ── */}
        <section className="section-padding bg-background" aria-labelledby="dulces-heading">
          <div className="container-site max-w-3xl text-center">
            <SectionLabel light>Dulces Saludables</SectionLabel>
            <h2 id="dulces-heading" className="section-title-light mt-4">
              Hecho en casa,
              <span className="text-gradient-gold"> sin culpa.</span>
            </h2>
            <p className="font-body text-warm-gray text-base md:text-lg leading-relaxed mt-5">
              Postres y galletas preparados con ingredientes naturales y mucho cariño. Los
              disfrutas tal cual o los terminas en tu horno para tenerlos como recién hechos.
              <strong className="text-espresso"> No necesitas aportar ingredientes</strong> y puedes agregarlos
              a cualquiera de tus servicios.
            </p>
          </div>
        </section>

        {/* ── Dos formas de disfrutarlos ── */}
        <section className="section-padding bg-cream" aria-labelledby="modos-heading">
          <div className="container-site max-w-4xl">
            <div className="text-center mb-12">
              <SectionLabel>Cómo los disfrutas</SectionLabel>
              <h2 id="modos-heading" className="section-title text-espresso mt-4">
                Dos formas, <em className="not-italic text-amber">el mismo sabor.</em>
              </h2>
              <p className="font-body text-warm-gray text-base md:text-lg mt-4">
                Lo saludable ya va listo.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {MODOS.map((m, i) => (
                <motion.div
                  key={m.title}
                  className="bg-ivory border border-wheat/50 rounded-2xl p-6 text-center"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                >
                  <span className="text-4xl mb-3 block" aria-hidden="true">{m.icon}</span>
                  <h3 className="font-display text-espresso text-xl font-bold mb-2">{m.title}</h3>
                  <p className="font-body text-warm-gray text-sm leading-relaxed">{m.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Productos ── */}
        <section className="section-padding bg-ivory" aria-labelledby="productos-heading">
          <div className="container-site">
            <div className="text-center mb-10">
              <SectionLabel>Nuestros dulces</SectionLabel>
              <h2 id="productos-heading" className="section-title text-espresso mt-4">
                Elige tus favoritos.
              </h2>
            </div>

            <p className="font-body text-accent-600 text-xs font-semibold tracking-[0.15em] uppercase text-center mb-5">
              Formato Familiar (Molde 20 cm) · 8 a 10 porciones
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-10">
              {DULCES_FAMILIAR.map((d, i) => <DulceCard key={d.name} item={d} index={i} />)}
            </div>

            <p className="font-body text-accent-600 text-xs font-semibold tracking-[0.15em] uppercase text-center mb-5">
              Formato Snacks (Bolsas de 10 unidades) · porción individual
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {DULCES_SNACKS.map((d, i) => <DulceCard key={d.name} item={d} index={i} />)}
            </div>
          </div>
        </section>

        {/* ── CTA final ── */}
        <section className="py-20 bg-background-warm border-t border-espresso/10">
          <div className="container-site text-center max-w-2xl">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-espresso mb-4">
              ¿Se te antojó algo dulce?
            </h2>
            <p className="font-body text-warm-gray text-base mb-8">
              Escríbenos por WhatsApp y coordinamos tus postres y galletas, listos para disfrutar o para hornear en casa.
            </p>
            <button onClick={pedir} className="btn-whatsapp">
              Pedir por WhatsApp
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
