import { motion } from 'framer-motion'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import PageHero from '../components/ui/PageHero'
import SectionLabel from '../components/ui/SectionLabel'
import WhatsAppCTA from '../components/sections/WhatsAppCTA'
import { useScrollReveal } from '../hooks/useScrollAnimation'
import { openChatBot } from '../lib/openChatBot'
import { Helmet } from 'react-helmet-async'

/* ── Team ────────────────────────────────────────────────────────────────── */
const TEAM = [
  {
    name:     'Estela Zavalla',
    role:     'La Mamá — Corazón de la cocina',
    text:     'De sus manos nacen todas las recetas. Décadas de cocinar para la familia convertidas en platos que hoy llegan a cientos de hogares.',
    image:    '/assets/images/mama.jpg',
    emoji:    '👩‍🍳',
    gradient: 'from-amber via-gold to-wheat',
    highlight: true,
  },
  {
    name:     'Rodrigo Palma',
    role:     'Planificación & digitalización',
    text:     'Impulsa el proyecto hacia adelante, gestionando la logística y llevando el negocio al mundo digital.',
    emoji:    '🚀',
    gradient: 'from-bark via-ember to-terracotta',
  },
  {
    name:     'Bárbara Palma',
    role:     'Ideas creativas & operaciones',
    text:     'Aporta la creatividad detrás de cada nuevo plato y mantiene la operación corriendo sin tropiezos.',
    emoji:    '✨',
    gradient: 'from-terracotta via-ember to-amber',
  },
  {
    name:     'Escarlet Palma',
    role:     'Marketing & redes sociales',
    text:     'Gestiona las redes, agenda los pedidos y desarrolla las estrategias para llevar el sabor a más personas.',
    emoji:    '📲',
    gradient: 'from-espresso via-bark to-amber',
  },
]

/* ── Values ─────────────────────────────────────────────────────────────── */
const VALUES = [
  {
    icon:  '🌿',
    title: 'Ingredientes Frescos',
    text:  'Cada mañana seleccionamos lo mejor de temporada. Sin congelados, sin conservantes, sin atajos.',
  },
  {
    icon:  '⏳',
    title: 'Tiempos Tradicionales',
    text:  'Respetamos los tiempos de cocción de las recetas de siempre. La prisa no cabe en una buena cazuela.',
  },
  {
    icon:  '❤️',
    title: 'Cuidado en Cada Detalle',
    text:  'Preparamos cada plato como si fuera para nuestra propia familia. Ese cuidado se nota en el sabor.',
  },
  {
    icon:  '🏠',
    title: 'El Sabor del Hogar',
    text:  'Queremos que cada bocado te recuerde a esos domingos en familia o a una tarde fría con pan recién amasado.',
  },
]

/* ── Hitos ───────────────────────────────────────────────────────────────── */
const TIMELINE = [
  { icon: '🍲', title: 'El primer pedido', text: 'Cocinamos para personas cercanas que buscaban una alternativa casera cuando no tenían tiempo para cocinar.' },
  { icon: '❤️', title: 'Llegaron las primeras recomendaciones', text: 'Nuestros propios clientes comenzaron a recomendarnos a sus familiares y amigos. Ahí entendimos que íbamos por el camino correcto.' },
  { icon: '🏡', title: 'Hoy cocinamos para muchas familias', text: 'Cada semana ayudamos a personas que quieren comer casero, ahorrar tiempo y disfrutar más de su hogar.' },
]

function TeamCard({ member, index }) {
  return (
    <motion.div
      className={`relative rounded-2xl overflow-hidden ${member.highlight ? 'ring-2 ring-amber/40' : 'ring-1 ring-wheat/20'}`}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay: index * 0.1, ease: [0.19, 1, 0.22, 1] }}
    >
      {/* Header: real photo or gradient+emoji */}
      <div className={`relative h-48 bg-gradient-to-br ${member.gradient} flex items-center justify-center overflow-hidden`}>
        {member.image ? (
          <img
            src={member.image}
            alt={member.name}
            className="absolute inset-0 w-full h-full object-cover object-top"
          />
        ) : (
          <span className="text-5xl" aria-hidden="true">{member.emoji}</span>
        )}
        {member.highlight && (
          <span className="absolute bottom-3 left-3 text-2xs font-semibold tracking-wider uppercase bg-espresso/70 backdrop-blur-sm text-amber border border-amber/30 px-2.5 py-1 rounded-full">
            La Mamá
          </span>
        )}
      </div>
      {/* Content */}
      <div className="bg-ivory p-5">
        <h3 className="font-display text-espresso text-lg font-bold leading-tight">{member.name}</h3>
        <p className="font-body text-amber text-xs font-semibold mt-0.5 mb-2">{member.role}</p>
        <p className="font-body text-warm-gray text-sm leading-relaxed">{member.text}</p>
      </div>
    </motion.div>
  )
}

function ValueCard({ item, index }) {
  return (
    <motion.div
      className="bg-ivory border border-wheat/50 rounded-2xl p-6 hover:border-amber/40 hover:shadow-lg transition-all duration-400"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay: index * 0.1, ease: [0.19, 1, 0.22, 1] }}
    >
      <span className="text-3xl mb-4 block" aria-hidden="true">{item.icon}</span>
      <h3 className="font-display text-espresso text-xl font-bold mb-2">{item.title}</h3>
      <p className="font-body text-warm-gray text-sm leading-relaxed">{item.text}</p>
    </motion.div>
  )
}

function TimelineItem({ item, index }) {
  return (
    <motion.div
      className="relative flex gap-6"
      initial={{ opacity: 0, x: -30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay: index * 0.12, ease: [0.19, 1, 0.22, 1] }}
    >
      <div className="flex flex-col items-center flex-shrink-0">
        <div className="w-14 h-14 rounded-full bg-amber/10 border-2 border-amber/30 flex items-center justify-center">
          {item.icon ? (
            <span className="text-2xl" aria-hidden="true">{item.icon}</span>
          ) : (
            <span className="font-display text-amber text-xs font-bold">{item.year}</span>
          )}
        </div>
        {index < TIMELINE.length - 1 && (
          <div className="w-px flex-1 mt-3 bg-gradient-to-b from-amber/30 to-transparent min-h-[3rem]" aria-hidden="true" />
        )}
      </div>
      <div className="pt-3 pb-8">
        <h3 className="font-display text-espresso text-lg font-semibold mb-1">{item.title}</h3>
        <p className="font-body text-warm-gray text-sm leading-relaxed">{item.text}</p>
      </div>
    </motion.div>
  )
}

export default function Nosotros() {
  const ref1 = useScrollReveal({ selector: '.fade-item', stagger: 0.12, y: 35 })

  return (
    <>
      <Helmet>
        <title>Nuestra Historia | Sabores de Mamá</title>
        <meta name="description" content="Conoce la historia detrás de Sabores de Mamá. Una familia unida por el amor a la comida casera, ingredientes frescos y recetas transmitidas de generación en generación." />
      </Helmet>

      <Navbar />

      <main>
        {/* ── Page Hero ── */}
        <PageHero
          label="Nuestra Historia"
          title="Un proyecto hecho"
          titleHighlight="con amor y sazón familiar."
          subtitle="Somos una familia que decidió compartir lo que más amamos: la comida que reconforta, que recuerda y que une."
          breadcrumb={[{ label: 'Inicio', href: '/' }, { label: 'Nosotros', href: '/nosotros' }]}
        >
          <button onClick={openChatBot} className="btn-whatsapp text-sm">
            Hacer un pedido
          </button>
        </PageHero>

        {/* ── Story section ── */}
        <section className="section-padding bg-ivory" aria-labelledby="story-heading">
          <div className="container-site">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

              {/* Photo side */}
              <motion.div
                className="relative flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.9 }}
              >
                {/* Glow */}
                <div
                  className="absolute inset-0 rounded-3xl pointer-events-none"
                  style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(194,121,47,0.12) 0%, transparent 70%)' }}
                  aria-hidden="true"
                />
                {/* Portrait */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl ring-1 ring-amber/20 w-full max-w-sm">
                  <img
                    src="/assets/images/mama.jpg"
                    alt="Estela Zavalla — La mamá de Sabores de Mamá"
                    className="w-full h-full object-cover object-top"
                    style={{ aspectRatio: '3/4' }}
                  />
                  {/* Overlay badge */}
                  <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-espresso/90 to-transparent">
                    <p className="font-display text-ivory text-xl font-bold">Estela Zavalla</p>
                    <p className="font-body text-amber text-sm">La Mamá — Corazón de la cocina</p>
                  </div>
                </div>
                {/* Floating badge */}
                <motion.div
                  className="absolute -right-3 top-8 glass-dark rounded-2xl p-4"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <p className="text-xl mb-1" aria-hidden="true">🥘</p>
                  <p className="font-body text-espresso text-xs font-semibold">Receta de familia</p>
                  <p className="font-body text-warm-gray text-2xs">Desde 2017</p>
                </motion.div>
                <motion.div
                  className="absolute -left-3 bottom-16 glass-dark rounded-2xl p-4 flex items-center gap-3"
                  animate={{ y: [0, 6, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.7 }}
                >
                  <span className="text-2xl" aria-hidden="true">💚</span>
                  <div>
                    <p className="font-body text-espresso text-xs font-semibold">Sin conservantes</p>
                    <p className="font-body text-warm-gray text-2xs">100% natural</p>
                  </div>
                </motion.div>
              </motion.div>

              {/* Text side */}
              <div ref={ref1} className="space-y-6">
                <SectionLabel>Quiénes somos</SectionLabel>
                <h2 id="story-heading" className="section-title text-espresso fade-item">
                  Más que cocinar, queremos hacerte la vida más fácil.
                </h2>
                <p className="font-body text-warm-gray text-base md:text-lg leading-relaxed fade-item">
                  <strong className="text-espresso">Sabores de Mamá</strong> nació de una idea muy
                  simple: disfrutar de comida casera no debería depender de tener tiempo para cocinar.
                </p>
                <p className="font-body text-warm-gray text-base leading-relaxed fade-item">
                  Cada semana preparamos comidas personalizadas para personas y familias que quieren
                  seguir disfrutando del auténtico sabor de casa, sin tener que pasar horas en la cocina.
                </p>
                <p className="font-body text-warm-gray text-base leading-relaxed fade-item">
                  Utilizamos ingredientes frescos y de calidad, cocinamos cada plato como si fuera
                  para nuestra propia familia y cuidamos cada detalle para que tú solo tengas que
                  disfrutar de una comida rica, nutritiva y hecha con cariño.
                </p>
                <blockquote className="border-l-2 border-amber pl-5 fade-item">
                  <p className="font-display text-xl text-espresso italic">
                    "Siempre he creído que cocinar es una forma de cuidar a quienes queremos. Hoy
                    tengo la oportunidad de hacerlo por muchas familias, y eso es lo más lindo de
                    este proyecto."
                  </p>
                  <footer className="mt-3 not-italic">
                    <p className="font-display text-espresso font-bold">Estela Zavalla</p>
                    <p className="font-body text-warm-gray text-sm">
                      Fundadora de <strong className="text-espresso">Sabores de Mamá</strong>
                    </p>
                  </footer>
                </blockquote>
              </div>
            </div>
          </div>
        </section>

        {/* ── Team ── */}
        <section className="section-padding bg-cream" aria-labelledby="team-heading">
          <div className="container-site">
            <div className="text-center mb-14">
              <SectionLabel>Las personas detrás</SectionLabel>
              <h2 id="team-heading" className="section-title text-espresso mt-4">
                Familia Zavalla,
                <br />
                <em className="not-italic text-amber">cocinando con alma.</em>
              </h2>
              <p className="font-body text-warm-gray text-base mt-4 max-w-xl mx-auto">
                Somos cuatro personas unidas por los mismos valores: familia, autenticidad
                y el deseo de hacer llegar bienestar a través de la comida.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {TEAM.map((member, i) => (
                <TeamCard key={member.name} member={member} index={i} />
              ))}
            </div>
          </div>
        </section>

        {/* ── Values ── */}
        <section className="section-padding bg-ivory" aria-labelledby="values-heading">
          <div className="container-site">
            <div className="text-center mb-14">
              <SectionLabel>Lo que nos mueve</SectionLabel>
              <h2 id="values-heading" className="section-title text-espresso mt-4">
                Nuestros valores,
                <br />
                <em className="not-italic text-amber">en cada receta.</em>
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {VALUES.map((v, i) => <ValueCard key={v.title} item={v} index={i} />)}
            </div>
          </div>
        </section>

        {/* ── Timeline ── */}
        <section className="section-padding bg-cream" aria-labelledby="timeline-heading">
          <div className="container-site">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
              <div>
                <SectionLabel>Nuestra historia</SectionLabel>
                <h2 id="timeline-heading" className="section-title text-espresso mt-4 mb-6">
                  Todo comenzó con una cocina y muchas ganas de ayudar.
                </h2>
                <p className="font-body text-warm-gray text-base leading-relaxed mb-4">
                  Lo que empezó cocinando para familiares y amigos se convirtió en Sabores
                  de Mamá, un servicio pensado para quienes quieren volver a disfrutar comida
                  casera sin tener que cocinar.
                </p>
                <p className="font-body text-warm-gray text-base leading-relaxed">
                  Hoy seguimos haciendo lo mismo que el primer día: preparar cada plato con
                  dedicación, ingredientes frescos y el cariño de una comida hecha en casa.
                </p>
              </div>
              <div>
                <h3 className="font-display text-espresso text-xl font-bold mb-6">Tres hitos</h3>
                <div className="space-y-0">
                  {TIMELINE.map((item, i) => (
                    <TimelineItem key={item.title} item={item} index={i} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats ── */}
        <section className="py-16 bg-background-warm border-y border-espresso/10">
          <div className="container-site">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { num: '2.000+', label: 'Pedidos entregados' },
                { num: '8+ años', label: 'De experiencia' },
                { num: '4.9 ★',  label: 'Calificación promedio' },
                { num: '100%',   label: 'Ingredientes frescos' },
              ].map(({ num, label }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: i * 0.1 }}
                >
                  <p className="font-display text-4xl md:text-5xl text-terracotta font-bold">{num}</p>
                  <p className="font-body text-warm-gray text-sm mt-1">{label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <WhatsAppCTA />
      </main>

      <Footer />
    </>
  )
}
