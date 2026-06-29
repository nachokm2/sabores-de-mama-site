import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Helmet } from 'react-helmet-async'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import PageHero from '../components/ui/PageHero'
import SectionLabel from '../components/ui/SectionLabel'
import { getComunas } from '../lib/publicApi'
import { fmtCLP } from '../lib/flowConfig'

/* ── Cómo funciona ───────────────────────────────────────────────────────── */
const PASOS = [
  {
    n: '01',
    icon: '📅',
    title: 'Agenda tu servicio',
    text: 'Eliges una fecha disponible y reservas tu cupo en segundos. Así mamá organiza su cocina para tu preparación.',
  },
  {
    n: '02',
    icon: '🛒',
    title: 'Envías tus ingredientes',
    text: 'Tú compras los ingredientes que quieras y se los haces llegar a mamá. Esos productos los pones tú: NO van en el cobro del servicio.',
  },
  {
    n: '03',
    icon: '👩‍🍳',
    title: 'Mamá cocina y envasa al vacío',
    text: 'Con tus ingredientes, mamá prepara tus platos con la sazón de siempre y los envasa al vacío para que lleguen frescos y duren más.',
  },
  {
    n: '04',
    icon: '🚚',
    title: 'Te llega por delivery',
    text: 'Despachamos tus platos listos a tu domicilio. El costo del despacho depende de tu comuna y queda incluido al agendar.',
  },
]

const INCLUYE = [
  'Preparación de tus platos con la receta y sazón de Sabores de Mamá',
  'Envasado al vacío para máxima frescura y duración',
  'Despacho a domicilio (costo según tu comuna)',
]

const NO_INCLUYE = ['Los ingredientes: los eliges, compras y envías tú a mamá']

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

export default function MealPrep() {
  const navigate = useNavigate()
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
    return () => {
      active = false
    }
  }, [])

  const agendar = () => navigate('/meal-prep')

  return (
    <>
      <Helmet>
        <title>Meal Prep | Sabores de Mamá</title>
        <meta
          name="description"
          content="Meal Prep de Sabores de Mamá: tú envías los ingredientes y mamá prepara tus platos caseros, los envasa al vacío y te los despacha. El despacho depende de tu comuna."
        />
      </Helmet>

      <Navbar />

      <main>
        {/* ── Hero ── */}
        <PageHero
          label="Meal Prep"
          title="Tú pones los ingredientes,"
          titleHighlight="mamá los convierte en comida casera."
          subtitle="Un servicio de preparación a tu medida: nos envías tus ingredientes, mamá cocina con su sazón de siempre, envasa al vacío y te lo despacha listo para disfrutar."
          breadcrumb={[{ label: 'Inicio', href: '/' }, { label: 'Meal Prep', href: '/meal-prep-en-casa' }]}
        >
          <button onClick={agendar} className="btn-primary text-sm">
            Agendar mi Meal Prep
          </button>
        </PageHero>

        {/* ── En qué consiste ── */}
        <section className="section-padding bg-ivory" aria-labelledby="consiste-heading">
          <div className="container-site max-w-3xl text-center">
            <SectionLabel>¿En qué consiste?</SectionLabel>
            <h2 id="consiste-heading" className="section-title text-espresso mt-4 mb-5">
              La cocina de mamá, <em className="not-italic text-amber">con tus ingredientes.</em>
            </h2>
            <p className="font-body text-warm-gray text-base md:text-lg leading-relaxed">
              El Meal Prep es ideal si quieres comida casera lista para la semana sin pasar
              horas en la cocina. <strong className="text-espresso">Tú eliges y compras los ingredientes</strong> que
              prefieras y se los envías a mamá. Ella los prepara con dedicación, los
              <strong className="text-espresso"> envasa al vacío</strong> para que conserven su frescura y te los
              despacha a tu domicilio. Como los ingredientes los pones tú, solo pagas por la
              preparación y el despacho.
            </p>
          </div>
        </section>

        {/* ── Cómo funciona ── */}
        <section className="section-padding bg-cream" aria-labelledby="pasos-heading">
          <div className="container-site">
            <div className="text-center mb-14">
              <SectionLabel>Cómo funciona</SectionLabel>
              <h2 id="pasos-heading" className="section-title text-espresso mt-4">
                Cuatro pasos, <em className="not-italic text-amber">cero complicaciones.</em>
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
                  Los ingredientes son tuyos, así que tienes el control total de la calidad y
                  la cantidad de cada plato. 💚
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Cobertura y despacho por comuna ── */}
        <section className="section-padding bg-cream" aria-labelledby="cobertura-heading">
          <div className="container-site max-w-4xl">
            <div className="text-center mb-10">
              <SectionLabel>Cobertura y despacho</SectionLabel>
              <h2 id="cobertura-heading" className="section-title text-espresso mt-4 mb-4">
                El despacho depende <em className="not-italic text-amber">de tu comuna.</em>
              </h2>
              <p className="font-body text-warm-gray text-base max-w-xl mx-auto">
                Llevamos tus platos a estas comunas del Gran Santiago. El valor del despacho se
                ajusta según la distancia y queda incluido al momento de agendar.
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
                Consulta el despacho de tu comuna al momento de agendar.
              </p>
            )}
          </div>
        </section>

        {/* ── CTA final ── */}
        <section className="py-20 bg-background-warm border-t border-espresso/10">
          <div className="container-site text-center max-w-2xl">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-espresso mb-4">
              ¿Listo para tu Meal Prep?
            </h2>
            <p className="font-body text-warm-gray text-base mb-8">
              Agenda tu fecha, envíanos tus ingredientes y deja que mamá haga su magia.
            </p>
            <button onClick={agendar} className="btn-primary">
              Agendar mi Meal Prep
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
