import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import SEOHead from '../components/seo/SEOHead'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import PageHero from '../components/ui/PageHero'
import SectionLabel from '../components/ui/SectionLabel'
import { getComunas } from '../lib/publicApi'
import { openChatBot } from '../lib/openChatBot'
import { WHATSAPP, getWhatsAppLink } from '../data/siteConfig'

/* ── Para quién es ─────────────────────────────────────────────────────────── */
const PARA_QUIEN = [
  { icon: '💼', title: 'Trabajadores y oficinas', text: 'Almuerza casero en tu escritorio sin depender del delivery de comida rápida ni cocinar de noche.' },
  { icon: '👨‍👩‍👧', title: 'Familias sin tiempo', text: 'Deja resuelta la comida de la semana y recupera tus tardes en casa.' },
  { icon: '🩺', title: 'Turnos y horarios largos', text: 'Ideal para personal de salud, TI y quienes trabajan por turnos: comida lista para recalentar cuando quieras.' },
  { icon: '🏠', title: 'Quien vive solo', text: 'Porciones individuales, sin sobras que se echan a perder ni supermercado todos los días.' },
]

/* ── Cómo funciona ─────────────────────────────────────────────────────────── */
const PASOS = [
  { n: '01', icon: '🍽️', title: 'Elige tus platos', text: 'Escoges hasta 5 preparaciones caseras de nuestro menú de más de 60 opciones.' },
  { n: '02', icon: '📅', title: 'Agenda tu entrega', text: 'Seleccionas la fecha; nosotros preparamos todo fresco para ese despacho.' },
  { n: '03', icon: '📦', title: 'Recíbelo sellado al vacío', text: 'Llega a tu domicilio porcionado y sellado al vacío, listo para refrigerar o congelar.' },
  { n: '04', icon: '🔥', title: 'Calienta y disfruta', text: 'Cuando tengas hambre, calientas tu plato casero en minutos. Sin cocinar, sin lavar ollas.' },
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

export default function AlmuerzosDomicilio() {
  const [comunas, setComunas] = useState([])

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const lista = await getComunas('meal_prep')
        if (active && Array.isArray(lista)) setComunas(lista)
      } catch {
        /* sin cobertura en vivo: la sección lo indica */
      }
    })()
    return () => { active = false }
  }, [])

  return (
    <>
      <SEOHead
        title="Almuerzos Caseros a Domicilio en Santiago"
        description="Almuerzos caseros a domicilio en Santiago: elige hasta 5 preparaciones, las recibes porcionadas y selladas al vacío, listas para calentar. Ideal para el trabajo, la oficina y familias sin tiempo de cocinar."
        canonical="https://saboresdemama.com/almuerzos-a-domicilio-santiago"
      />

      <Navbar />

      <main>
        {/* ── Hero ── */}
        <PageHero
          label="Almuerzos a domicilio"
          title="Almuerzos caseros,"
          titleHighlight="a la puerta de tu casa."
          subtitle="Comida como la de siempre, porcionada y lista para calentar. Para quienes quieren comer rico y casero sin gastar tiempo en cocinar."
          breadcrumb={[{ label: 'Inicio', href: '/' }, { label: 'Almuerzos a domicilio', href: '/almuerzos-a-domicilio-santiago' }]}
        >
          <div className="flex flex-wrap gap-3 justify-center">
            <button onClick={openChatBot} className="btn-primary text-sm">Pedir ahora</button>
            <Link to="/menu" className="btn-outline text-sm">Ver el menú</Link>
          </div>
        </PageHero>

        {/* ── Qué es ── */}
        <section className="section-padding bg-ivory" aria-labelledby="que-es-heading">
          <div className="container-site max-w-3xl text-center">
            <SectionLabel>Comida casera a domicilio</SectionLabel>
            <h2 id="que-es-heading" className="section-title text-espresso mt-4 mb-5">
              El sabor de casa, <em className="not-italic text-amber">sin cocinar tú.</em>
            </h2>
            <div className="space-y-4 font-body text-warm-gray text-base md:text-lg leading-relaxed">
              <p>
                <strong className="text-espresso">Sabores de Mamá</strong> lleva almuerzos caseros a domicilio en
                Santiago: preparaciones hechas como en casa, con ingredientes frescos y la sazón de Estela.
              </p>
              <p>
                Recibes tus platos <strong className="text-espresso">porcionados y sellados al vacío</strong>,
                así que solo calientas y disfrutas. Sin pensar qué cocinar, sin supermercado a diario y sin lavar ollas.
              </p>
            </div>
          </div>
        </section>

        {/* ── Para quién ── */}
        <section className="section-padding bg-cream" aria-labelledby="para-quien-heading">
          <div className="container-site">
            <div className="text-center mb-14">
              <SectionLabel>Para quién es</SectionLabel>
              <h2 id="para-quien-heading" className="section-title text-espresso mt-4">
                Pensado para quien <em className="not-italic text-amber">no tiene tiempo.</em>
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {PARA_QUIEN.map((item, i) => (
                <Card key={item.title} item={item} index={i} />
              ))}
            </div>
          </div>
        </section>

        {/* ── Cómo funciona ── */}
        <section className="section-padding bg-ivory" aria-labelledby="pasos-heading">
          <div className="container-site">
            <div className="text-center mb-14">
              <SectionLabel>Cómo funciona</SectionLabel>
              <h2 id="pasos-heading" className="section-title text-espresso mt-4">
                Pedir es <em className="not-italic text-amber">así de simple.</em>
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {PASOS.map((p, i) => (
                <Card key={p.n} item={p} index={i} />
              ))}
            </div>
          </div>
        </section>

        {/* ── Precios ── */}
        <section className="section-padding bg-cream" aria-labelledby="precios-heading">
          <div className="container-site max-w-4xl">
            <div className="text-center mb-12">
              <SectionLabel>Precios claros</SectionLabel>
              <h2 id="precios-heading" className="section-title text-espresso mt-4">
                Un valor, hasta 5 preparaciones.
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-ivory border border-wheat/50 rounded-2xl p-7 text-center">
                <h3 className="font-display text-espresso text-xl font-bold mb-1">Meal Prep</h3>
                <p className="font-body text-warm-gray text-sm mb-4">Tú eliges los platos y te los despachamos.</p>
                <p className="font-display text-3xl font-bold text-terracotta mb-1">$60.000</p>
                <p className="font-body text-warm-gray text-sm">hasta 5 preparaciones · despacho según comuna</p>
              </div>
              <div className="bg-ivory border border-wheat/50 rounded-2xl p-7 text-center">
                <h3 className="font-display text-espresso text-xl font-bold mb-1">Cocinera a Domicilio</h3>
                <p className="font-body text-warm-gray text-sm mb-4">Mamá cocina en tu hogar con tus ingredientes.</p>
                <p className="font-display text-3xl font-bold text-terracotta mb-1">$55.000</p>
                <p className="font-body text-warm-gray text-sm">hasta 5 preparaciones · movilización según comuna</p>
              </div>
            </div>
            <div className="text-center mt-8">
              <Link to="/menu" className="btn-outline text-sm">Ver todos los platos y servicios</Link>
            </div>
          </div>
        </section>

        {/* ── Cobertura ── */}
        <section className="section-padding bg-ivory" aria-labelledby="cobertura-heading">
          <div className="container-site max-w-4xl">
            <div className="text-center mb-10">
              <SectionLabel>Cobertura</SectionLabel>
              <h2 id="cobertura-heading" className="section-title text-espresso mt-4 mb-4">
                Despachamos en el <em className="not-italic text-amber">Gran Santiago.</em>
              </h2>
              <p className="font-body text-warm-gray text-base max-w-xl mx-auto">
                Llegamos a comunas como Las Condes, Providencia, Ñuñoa, Vitacura, La Reina y más.
                El costo de despacho se calcula según tu comuna al hacer el pedido.
              </p>
            </div>

            {comunas.length > 0 && (
              <div className="bg-cream border border-wheat/50 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-2 sm:grid-cols-3">
                  {comunas.map((c) => (
                    <div key={c.id || c.nombre} className="px-4 py-2.5 border-b border-wheat/40 text-sm text-espresso">
                      {c.nombre}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── Explora por comuna (enlazado interno a las landings locales) ── */}
        <section className="section-padding bg-cream" aria-labelledby="comunas-heading">
          <div className="container-site max-w-3xl text-center">
            <SectionLabel>Por comuna</SectionLabel>
            <h2 id="comunas-heading" className="section-title text-espresso mt-4 mb-6">Almuerzos a domicilio en tu comuna</h2>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/comida-a-domicilio/las-condes" className="text-sm bg-ivory border border-wheat/60 rounded-full px-4 py-2 text-espresso hover:border-terracotta/50 transition-colors">Las Condes</Link>
              <Link to="/comida-a-domicilio/providencia" className="text-sm bg-ivory border border-wheat/60 rounded-full px-4 py-2 text-espresso hover:border-terracotta/50 transition-colors">Providencia</Link>
              <Link to="/comida-a-domicilio/nunoa" className="text-sm bg-ivory border border-wheat/60 rounded-full px-4 py-2 text-espresso hover:border-terracotta/50 transition-colors">Ñuñoa</Link>
              <Link to="/comida-a-domicilio/vitacura" className="text-sm bg-ivory border border-wheat/60 rounded-full px-4 py-2 text-espresso hover:border-terracotta/50 transition-colors">Vitacura</Link>
            </div>
          </div>
        </section>

        {/* ── CTA final ── */}
        <section className="py-20 bg-background-warm border-t border-espresso/10">
          <div className="container-site text-center max-w-2xl">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-espresso mb-4">
              Deja resuelta tu comida de la semana
            </h2>
            <p className="font-body text-warm-gray text-base mb-8">
              Elige tus platos y recibe todo casero, porcionado y listo para calentar.
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
