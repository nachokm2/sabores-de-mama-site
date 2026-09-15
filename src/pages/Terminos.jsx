import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import SEOHead from '../components/seo/SEOHead'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import PageHero from '../components/ui/PageHero'
import SectionLabel from '../components/ui/SectionLabel'
import { SITE, WHATSAPP, getWhatsAppLink } from '../data/siteConfig'
import { SECCIONES, TERMINOS_FECHA_LARGA, TERMINOS_VERSION } from '../data/terminos'

/**
 * Términos y Condiciones del servicio (/terminos-y-condiciones).
 *
 * El texto vive en `src/data/terminos.js` junto con su número de versión, que es
 * el mismo que la casilla del formulario envía al backend. Esta página solo lo
 * presenta: así el documento que lee el cliente y el que queda registrado en su
 * pedido no pueden separarse.
 */

function Bloque({ bloque }) {
  if (bloque.destacado) {
    return (
      <p className="font-body text-espresso text-sm leading-relaxed bg-amber/[0.08] border-l-2 border-terracotta rounded-r-xl px-4 py-3">
        {bloque.destacado}
      </p>
    )
  }
  if (bloque.lista) {
    return (
      <ul className="list-disc pl-5 space-y-2 font-body text-warm-gray text-sm leading-relaxed">
        {bloque.lista.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    )
  }
  return <p className="font-body text-warm-gray text-sm leading-relaxed">{bloque.p}</p>
}

function Seccion({ seccion, index }) {
  return (
    <motion.section
      id={seccion.id}
      className="scroll-mt-28 bg-ivory border border-wheat/50 rounded-2xl p-6"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.04, 0.24), ease: [0.19, 1, 0.22, 1] }}
      aria-labelledby={`${seccion.id}-titulo`}
    >
      <h2 id={`${seccion.id}-titulo`} className="font-display text-espresso text-lg font-bold mb-3">
        {seccion.titulo}
      </h2>
      <div className="space-y-3">
        {seccion.bloques.map((bloque, i) => (
          <Bloque key={i} bloque={bloque} />
        ))}
      </div>
    </motion.section>
  )
}

export default function Terminos() {
  return (
    <>
      <SEOHead
        title="Términos y Condiciones"
        description="Términos y Condiciones del servicio de Sabores de Mamá: cómo se hace un pedido, pago, ingredientes, entregas y horarios estimados, cambios y cancelaciones, y tratamiento de tus datos."
        canonical="https://saboresdemama.com/terminos-y-condiciones"
      />

      <Navbar />

      <main>
        <PageHero
          label="Términos y Condiciones"
          title="Las reglas del"
          titleHighlight="servicio, claras."
          subtitle="Cómo se hace un pedido, cómo se paga, cómo funcionan las entregas y qué puedes esperar de nosotros. Sin letra chica."
          breadcrumb={[
            { label: 'Inicio', href: '/' },
            { label: 'Términos y Condiciones', href: '/terminos-y-condiciones' },
          ]}
        />

        <section className="section-padding bg-cream" aria-labelledby="terminos-heading">
          <div className="container-site max-w-3xl">
            <div className="text-center mb-10">
              <SectionLabel>Condiciones del servicio</SectionLabel>
              <h2 id="terminos-heading" className="section-title text-espresso mt-4">
                Términos y Condiciones
              </h2>
              <p className="font-body text-warm-gray text-sm mt-4">
                Versión {TERMINOS_VERSION} · Vigente desde el {TERMINOS_FECHA_LARGA}
              </p>
            </div>

            {/* Índice: el documento es largo y la duda concreta (horarios) tiene
                que estar a un clic, no a un scroll. */}
            <nav aria-label="Contenido de los términos" className="bg-ivory border border-wheat/50 rounded-2xl p-6 mb-6">
              <h2 className="font-display text-espresso text-base font-bold mb-3">Contenido</h2>
              <ol className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 list-none">
                {SECCIONES.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="font-body text-warm-gray text-sm hover:text-terracotta transition-colors duration-200"
                    >
                      {s.titulo}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            <div className="space-y-4">
              {SECCIONES.map((s, i) => (
                <Seccion key={s.id} seccion={s} index={i} />
              ))}
            </div>

            <p className="font-body text-warm-gray text-xs leading-relaxed mt-8 text-center">
              ¿Tienes una duda sobre estas condiciones? Escríbenos a{' '}
              <a href={`mailto:${SITE.email}`} className="text-terracotta hover:underline">
                {SITE.email}
              </a>{' '}
              o por WhatsApp y te la resolvemos antes de que pidas.
            </p>
          </div>
        </section>

        {/* CTA final (mismo cierre que el resto de las páginas internas) */}
        <section className="py-20 bg-background-warm border-t border-espresso/10">
          <div className="container-site text-center max-w-2xl">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-espresso mb-4">
              ¿Te queda alguna duda?
            </h2>
            <p className="font-body text-warm-gray text-base mb-8">
              Revisa las preguntas frecuentes o escríbenos directamente. Preferimos aclararlo antes del pedido.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/preguntas-frecuentes" className="btn-primary">
                Preguntas frecuentes
              </Link>
              <a
                href={getWhatsAppLink(WHATSAPP.faqMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-whatsapp"
              >
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
