import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import SEOHead from '../components/seo/SEOHead'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import PageHero from '../components/ui/PageHero'
import SectionLabel from '../components/ui/SectionLabel'
import { getWhatsAppLink } from '../data/siteConfig'

// Mensaje de WhatsApp específico para cotizaciones de empresas (B2B).
const MSG_EMPRESA =
  '¡Hola! Quiero cotizar comida casera para mi empresa/oficina. Somos aproximadamente ___ personas.'
const linkEmpresa = () => getWhatsAppLink(MSG_EMPRESA)

/* ── Beneficios para la empresa ────────────────────────────────────────────── */
const BENEFICIOS = [
  { icon: '🥗', title: 'Comida casera y equilibrada', text: 'Nada de comida rápida: preparaciones caseras y balanceadas que cuidan a tu equipo.' },
  { icon: '🔁', title: 'Pedidos recurrentes', text: 'Coordinamos entregas semanales o para días puntuales según la necesidad de tu oficina.' },
  { icon: '📦', title: 'Porcionado e higiénico', text: 'Cada almuerzo llega porcionado y sellado al vacío, listo para repartir y calentar.' },
  { icon: '📝', title: 'Menú a medida', text: 'Adaptamos las preparaciones y cantidades al tamaño de tu equipo y sus preferencias.' },
]

/* ── Ideal para ────────────────────────────────────────────────────────────── */
const IDEAL = [
  'Almuerzos para el equipo en la oficina',
  'Colaciones para turnos y jornadas largas',
  'Reuniones, capacitaciones y eventos internos',
  'Equipos en terreno que necesitan comida lista',
]

/* ── Cómo funciona (B2B) ───────────────────────────────────────────────────── */
const PASOS = [
  { n: '01', icon: '💬', title: 'Cuéntanos tu necesidad', text: 'Nos escribes cuántas personas son, con qué frecuencia y para qué días.' },
  { n: '02', icon: '📋', title: 'Armamos el menú y la cotización', text: 'Te proponemos las preparaciones, cantidades y el valor según tu comuna.' },
  { n: '03', icon: '🍲', title: 'Cocinamos casero', text: 'Preparamos todo fresco el día acordado y lo dejamos porcionado.' },
  { n: '04', icon: '🚚', title: 'Entregamos en tu oficina', text: 'Despachamos a tu empresa, listo para repartir y disfrutar.' },
]

function Card({ item, index }) {
  return (
    <motion.div
      className="relative bg-ivory border border-wheat/50 rounded-2xl p-6 hover:border-amber/40 hover:shadow-lg transition-all duration-400"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay: index * 0.1, ease: [0.19, 1, 0.22, 1] }}
    >
      {item.n && (
        <span className="absolute top-5 right-5 font-display text-4xl font-bold text-amber/20" aria-hidden="true">
          {item.n}
        </span>
      )}
      <span className="text-3xl mb-4 block" aria-hidden="true">{item.icon}</span>
      <h3 className="font-display text-espresso text-lg font-bold mb-2 pr-10">{item.title}</h3>
      <p className="font-body text-warm-gray text-sm leading-relaxed">{item.text}</p>
    </motion.div>
  )
}

export default function ComidaEmpresas() {
  return (
    <>
      <SEOHead
        title="Comida Casera para Empresas y Oficinas en Santiago"
        description="Comida casera para empresas y oficinas en Santiago: almuerzos y colaciones para tu equipo, porcionados y sellados al vacío. Menú a medida y pedidos recurrentes. Cotiza por WhatsApp."
        canonical="https://saboresdemama.com/comida-para-empresas"
      />

      <Navbar />

      <main>
        {/* ── Hero ── */}
        <PageHero
          label="Comida para empresas"
          title="Comida casera para"
          titleHighlight="tu equipo."
          subtitle="Almuerzos y colaciones caseras para oficinas y empresas en Santiago. Cuida a tu equipo con comida rica, equilibrada y lista para servir."
          breadcrumb={[{ label: 'Inicio', href: '/' }, { label: 'Comida para empresas', href: '/comida-para-empresas' }]}
        >
          <a href={linkEmpresa()} target="_blank" rel="noopener noreferrer" className="btn-whatsapp text-sm">
            Cotizar por WhatsApp
          </a>
        </PageHero>

        {/* ── Intro ── */}
        <section className="section-padding bg-ivory" aria-labelledby="intro-heading">
          <div className="container-site max-w-3xl text-center">
            <SectionLabel>Alimentación para tu equipo</SectionLabel>
            <h2 id="intro-heading" className="section-title text-espresso mt-4 mb-5">
              Comida de casa, <em className="not-italic text-amber">en tu oficina.</em>
            </h2>
            <div className="space-y-4 font-body text-warm-gray text-base md:text-lg leading-relaxed">
              <p>
                Ofrecer un buen almuerzo casero a tu equipo mejora el ánimo y la productividad, y evita las
                comidas rápidas de siempre. <strong className="text-espresso">Sabores de Mamá</strong> prepara
                almuerzos y colaciones caseras para empresas y oficinas en Santiago.
              </p>
              <p>
                Nos adaptamos a tu equipo: <strong className="text-espresso">definimos el menú, las cantidades y
                la frecuencia</strong>, y entregamos todo porcionado y listo para repartir.
              </p>
            </div>
          </div>
        </section>

        {/* ── Beneficios ── */}
        <section className="section-padding bg-cream" aria-labelledby="beneficios-heading">
          <div className="container-site">
            <div className="text-center mb-14">
              <SectionLabel>Por qué elegirnos</SectionLabel>
              <h2 id="beneficios-heading" className="section-title text-espresso mt-4">
                Lo que tu empresa <em className="not-italic text-amber">recibe.</em>
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {BENEFICIOS.map((item, i) => (
                <Card key={item.title} item={item} index={i} />
              ))}
            </div>
          </div>
        </section>

        {/* ── Ideal para ── */}
        <section className="section-padding bg-ivory" aria-labelledby="ideal-heading">
          <div className="container-site max-w-3xl">
            <div className="text-center mb-10">
              <SectionLabel>Ideal para</SectionLabel>
              <h2 id="ideal-heading" className="section-title text-espresso mt-4">
                Distintas necesidades, misma sazón.
              </h2>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {IDEAL.map((item) => (
                <li key={item} className="flex items-start gap-2.5 bg-cream border border-wheat/50 rounded-xl px-4 py-3 font-body text-espresso text-sm">
                  <span className="text-amber mt-0.5" aria-hidden="true">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Cómo funciona ── */}
        <section className="section-padding bg-cream" aria-labelledby="pasos-heading">
          <div className="container-site">
            <div className="text-center mb-14">
              <SectionLabel>Cómo funciona</SectionLabel>
              <h2 id="pasos-heading" className="section-title text-espresso mt-4">
                De la consulta <em className="not-italic text-amber">a la oficina.</em>
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {PASOS.map((p, i) => (
                <Card key={p.n} item={p} index={i} />
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA final ── */}
        <section className="py-20 bg-background-warm border-t border-espresso/10">
          <div className="container-site text-center max-w-2xl">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-espresso mb-4">
              Cotiza la comida de tu equipo
            </h2>
            <p className="font-body text-warm-gray text-base mb-8">
              Cuéntanos cuántas personas son y con qué frecuencia; te armamos un menú y una cotización a medida.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <a href={linkEmpresa()} target="_blank" rel="noopener noreferrer" className="btn-whatsapp">
                Cotizar por WhatsApp
              </a>
              <Link to="/menu" className="btn-outline">Ver el menú</Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
