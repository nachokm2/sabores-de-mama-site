import { motion } from 'framer-motion'
import { Link, useParams, Navigate } from 'react-router-dom'
import SEOHead from '../components/seo/SEOHead'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import PageHero from '../components/ui/PageHero'
import SectionLabel from '../components/ui/SectionLabel'
import { openChatBot } from '../lib/openChatBot'
import { WHATSAPP, getWhatsAppLink } from '../data/siteConfig'
import { COMUNAS_LANDING, COMUNA_SLUGS } from '../data/comunasLanding'

const PASOS = [
  { n: '01', icon: '🍽️', title: 'Elige tus platos', text: 'Hasta 5 preparaciones caseras de un menú de más de 60 opciones.' },
  { n: '02', icon: '📅', title: 'Agenda la entrega', text: 'Eliges la fecha; preparamos todo fresco para ese despacho.' },
  { n: '03', icon: '📦', title: 'Recíbelo sellado al vacío', text: 'Llega porcionado y sellado al vacío, listo para refrigerar o congelar.' },
  { n: '04', icon: '🔥', title: 'Calienta y disfruta', text: 'Comida casera lista en minutos. Sin cocinar, sin lavar ollas.' },
]

export default function ComunaLanding() {
  const { comuna } = useParams()
  const data = COMUNAS_LANDING[comuna]

  // Slug desconocido → al home (las 4 comunas válidas se pre-renderizan).
  if (!data) return <Navigate to="/" replace />

  const otras = COMUNA_SLUGS.filter((s) => s !== comuna)

  return (
    <>
      <SEOHead
        title={`Comida Casera a Domicilio en ${data.nombre}`}
        description={`Almuerzos y comida casera a domicilio en ${data.nombre}: preparaciones caseras porcionadas y selladas al vacío, listas para calentar. Pide en línea; despacho en ${data.nombre} y alrededores.`}
        canonical={`https://saboresdemama.com/comida-a-domicilio/${comuna}`}
      />

      <Navbar />

      <main>
        <PageHero
          label={`Comida a domicilio · ${data.nombre}`}
          title="Comida casera a domicilio"
          titleHighlight={`en ${data.nombre}.`}
          subtitle={data.intro}
          breadcrumb={[
            { label: 'Inicio', href: '/' },
            { label: 'Almuerzos a domicilio', href: '/almuerzos-a-domicilio-santiago' },
            { label: data.nombre, href: `/comida-a-domicilio/${comuna}` },
          ]}
        >
          <div className="flex flex-wrap gap-3 justify-center">
            <button onClick={openChatBot} className="btn-primary text-sm">Pedir ahora</button>
            <Link to="/menu" className="btn-outline text-sm">Ver el menú</Link>
          </div>
        </PageHero>

        {/* Qué ofrecemos + sectores (contenido específico de la comuna) */}
        <section className="section-padding bg-ivory" aria-labelledby="que-heading">
          <div className="container-site max-w-3xl">
            <div className="text-center mb-8">
              <SectionLabel>En {data.nombre}</SectionLabel>
              <h2 id="que-heading" className="section-title text-espresso mt-4 mb-5">
                El sabor de casa, <em className="not-italic text-amber">sin cocinar.</em>
              </h2>
              <p className="font-body text-warm-gray text-base md:text-lg leading-relaxed">{data.publico}</p>
            </div>
            <div className="bg-cream border border-wheat/50 rounded-2xl p-6">
              <p className="font-body text-espresso text-sm font-semibold mb-3">Despachamos en {data.nombre}, incluyendo sectores como:</p>
              <div className="flex flex-wrap gap-2">
                {data.sectores.map((s) => (
                  <span key={s} className="text-sm bg-ivory border border-wheat/60 rounded-full px-3 py-1 text-espresso">{s}</span>
                ))}
              </div>
              <p className="font-body text-warm-gray text-xs mt-4">El costo de despacho se calcula según tu dirección al hacer el pedido.</p>
            </div>
          </div>
        </section>

        {/* Cómo funciona */}
        <section className="section-padding bg-cream" aria-labelledby="pasos-heading">
          <div className="container-site">
            <div className="text-center mb-14">
              <SectionLabel>Cómo funciona</SectionLabel>
              <h2 id="pasos-heading" className="section-title text-espresso mt-4">
                Pedir en {data.nombre} es <em className="not-italic text-amber">así de simple.</em>
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {PASOS.map((p, i) => (
                <motion.div
                  key={p.n}
                  className="relative bg-ivory border border-wheat/50 rounded-2xl p-6"
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.7, delay: i * 0.1, ease: [0.19, 1, 0.22, 1] }}
                >
                  <span className="absolute top-5 right-5 font-display text-4xl font-bold text-amber/20" aria-hidden="true">{p.n}</span>
                  <span className="text-3xl mb-4 block" aria-hidden="true">{p.icon}</span>
                  <h3 className="font-display text-espresso text-lg font-bold mb-2 pr-10">{p.title}</h3>
                  <p className="font-body text-warm-gray text-sm leading-relaxed">{p.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Precios */}
        <section className="section-padding bg-ivory" aria-labelledby="precios-heading">
          <div className="container-site max-w-4xl">
            <div className="text-center mb-12">
              <SectionLabel>Precios claros</SectionLabel>
              <h2 id="precios-heading" className="section-title text-espresso mt-4">Un valor, hasta 5 preparaciones.</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-cream border border-wheat/50 rounded-2xl p-7 text-center">
                <h3 className="font-display text-espresso text-xl font-bold mb-1">Meal Prep</h3>
                <p className="font-body text-warm-gray text-sm mb-4">Tú eliges los platos y te los despachamos a {data.nombre}.</p>
                <p className="font-display text-3xl font-bold text-terracotta mb-1">$60.000</p>
                <p className="font-body text-warm-gray text-sm">hasta 5 preparaciones · despacho según dirección</p>
              </div>
              <div className="bg-cream border border-wheat/50 rounded-2xl p-7 text-center">
                <h3 className="font-display text-espresso text-xl font-bold mb-1">Cocinera a Domicilio</h3>
                <p className="font-body text-warm-gray text-sm mb-4">Mamá cocina en tu hogar en {data.nombre}.</p>
                <p className="font-display text-3xl font-bold text-terracotta mb-1">$55.000</p>
                <p className="font-body text-warm-gray text-sm">hasta 5 preparaciones · movilización según comuna</p>
              </div>
            </div>
          </div>
        </section>

        {/* Otras comunas (enlazado interno) */}
        <section className="section-padding bg-cream" aria-labelledby="otras-heading">
          <div className="container-site max-w-3xl text-center">
            <SectionLabel>También llegamos a</SectionLabel>
            <h2 id="otras-heading" className="section-title text-espresso mt-4 mb-6">Otras comunas</h2>
            <div className="flex flex-wrap gap-3 justify-center">
              {otras.map((s) => (
                <Link key={s} to={`/comida-a-domicilio/${s}`} className="text-sm bg-ivory border border-wheat/60 rounded-full px-4 py-2 text-espresso hover:border-terracotta/50 transition-colors">
                  Comida a domicilio en {COMUNAS_LANDING[s].nombre}
                </Link>
              ))}
              <Link to="/almuerzos-a-domicilio-santiago" className="text-sm bg-ivory border border-wheat/60 rounded-full px-4 py-2 text-espresso hover:border-terracotta/50 transition-colors">
                Almuerzos a domicilio en Santiago
              </Link>
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="py-20 bg-background-warm border-t border-espresso/10">
          <div className="container-site text-center max-w-2xl">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-espresso mb-4">
              Deja resuelta tu comida en {data.nombre}
            </h2>
            <p className="font-body text-warm-gray text-base mb-8">
              Elige tus platos y recíbelos caseros, porcionados y listos para calentar.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button onClick={openChatBot} className="btn-primary">Pedir ahora</button>
              <a href={getWhatsAppLink(WHATSAPP.defaultMessage)} target="_blank" rel="noopener noreferrer" className="btn-whatsapp">
                Consultar por WhatsApp
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
