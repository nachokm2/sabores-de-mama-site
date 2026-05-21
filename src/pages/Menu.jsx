import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Helmet } from 'react-helmet-async'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import FloatingWhatsApp from '../components/ui/FloatingWhatsApp'
import PageHero from '../components/ui/PageHero'
import SectionLabel from '../components/ui/SectionLabel'
import WhatsAppCTA from '../components/sections/WhatsAppCTA'
import { MENU_ITEMS, CATEGORIES } from '../data/menu'
import { useWhatsApp } from '../hooks/useWhatsApp'

/* ── Reuse Tag ───────────────────────────────────────────────────────────── */
function Tag({ label, color }) {
  const colors = {
    amber:      'bg-amber/15 text-amber border-amber/20',
    gold:       'bg-gold/15 text-gold border-gold/20',
    terracotta: 'bg-terracotta/15 text-terracotta border-terracotta/20',
  }
  return (
    <span className={`absolute top-3 right-3 text-2xs font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full border backdrop-blur-sm ${colors[color] || colors.amber}`}>
      {label}
    </span>
  )
}

/* ── Full menu card (wider than home version) ─────────────────────────────── */
function FullMenuCard({ item, index }) {
  const { openWithItem } = useWhatsApp()
  const [hovered, setHovered] = useState(false)

  return (
    <motion.article
      className="bg-espresso rounded-2xl overflow-hidden group cursor-pointer hover:-translate-y-1 transition-all duration-500"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5, delay: index * 0.05, ease: [0.19, 1, 0.22, 1] }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
      {/* Image */}
      <div className="relative h-52 overflow-hidden">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              transform: hovered ? 'scale(1.08)' : 'scale(1)',
              transition: 'transform 0.7s cubic-bezier(0.19, 1, 0.22, 1)',
            }}
          />
        ) : (
          <>
            <div
              className={`absolute inset-0 bg-gradient-to-br ${item.gradient}`}
              style={{
                transform: hovered ? 'scale(1.08)' : 'scale(1)',
                transition: 'transform 0.7s cubic-bezier(0.19, 1, 0.22, 1)',
              }}
              aria-hidden="true"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-6xl" aria-hidden="true">{item.emoji}</span>
            </div>
          </>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-espresso/80 via-transparent to-transparent" aria-hidden="true" />
        {item.tag && <Tag label={item.tag} color={item.tagColor} />}
      </div>

      {/* Info */}
      <div className="p-5">
        <h3 className="font-display text-ivory text-xl leading-tight mb-2">{item.name}</h3>
        <p className="font-body text-warm-gray text-sm leading-relaxed mb-4">{item.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex gap-4 text-warm-gray text-xs font-body">
            <span>👤 {item.serves}</span>
            <span>⏱ {item.prepTime}</span>
          </div>
          <motion.button
            onClick={() => openWithItem(item.name)}
            className="flex items-center gap-2 text-xs font-medium font-body text-amber border border-amber/30 px-4 py-2 rounded-full hover:bg-amber hover:text-espresso transition-all duration-300"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            aria-label={`Pedir ${item.name}`}
          >
            <WaIcon /> Pedir
          </motion.button>
        </div>
      </div>
    </motion.article>
  )
}

function WaIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

export default function Menu() {
  const [activeCategory, setActiveCategory] = useState('todos')
  const { openMenu } = useWhatsApp()

  const filtered = useMemo(
    () => activeCategory === 'todos' ? MENU_ITEMS : MENU_ITEMS.filter(i => i.category === activeCategory),
    [activeCategory]
  )

  return (
    <>
      <Helmet>
        <title>Menú | Sabores de Mamá</title>
        <meta name="description" content="Explora nuestro menú de comida casera chilena: platos de fondo, sopas, empanadas, desayuno, postres. Todo hecho a diario con ingredientes frescos." />
      </Helmet>

      <Navbar />

      <main>
        <PageHero
          label="Nuestros Platos"
          title="El menú que"
          titleHighlight="te da nostalgia."
          subtitle="Todos los platos preparados a diario con ingredientes frescos. Pide por WhatsApp en minutos."
          breadcrumb={[{ label: 'Inicio', href: '/' }, { label: 'Menú', href: '/menu' }]}
        >
          <button onClick={openMenu} className="btn-outline-light text-sm">
            Pedir por WhatsApp
          </button>
        </PageHero>

        {/* ── Menu content ── */}
        <section className="section-padding bg-bark relative overflow-hidden" aria-labelledby="full-menu-heading">
          {/* Ambient glow */}
          <div
            className="absolute left-1/2 -translate-x-1/2 top-0 w-[800px] h-[400px] pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(200,135,58,0.1) 0%, transparent 70%)' }}
            aria-hidden="true"
          />

          <div className="container-site relative">
            {/* Category filters */}
            <div className="flex flex-wrap gap-2 justify-center mb-12" role="tablist" aria-label="Categorías">
              {CATEGORIES.map(cat => (
                <motion.button
                  key={cat.id}
                  role="tab"
                  aria-selected={activeCategory === cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium font-body border transition-all duration-300 ${
                    activeCategory === cat.id
                      ? 'bg-amber text-espresso border-amber shadow-[0_2px_12px_rgba(200,135,58,0.4)]'
                      : 'bg-transparent text-warm-gray border-warm-gray/30 hover:border-amber/50 hover:text-amber'
                  }`}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                >
                  <span aria-hidden="true">{cat.icon}</span>
                  {cat.label}
                </motion.button>
              ))}
            </div>

            {/* Count */}
            <p className="text-center text-warm-gray text-sm font-body mb-8">
              {filtered.length} plato{filtered.length !== 1 ? 's' : ''} disponible{filtered.length !== 1 ? 's' : ''}
            </p>

            {/* Grid */}
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6"
              layout
            >
              <AnimatePresence mode="popLayout">
                {filtered.map((item, i) => (
                  <FullMenuCard key={item.id} item={item} index={i} />
                ))}
              </AnimatePresence>
            </motion.div>

            {/* Note */}
            <motion.div
              className="mt-14 text-center bg-amber/5 border border-amber/20 rounded-2xl p-8 max-w-xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <p className="text-3xl mb-3" aria-hidden="true">📋</p>
              <h3 className="font-display text-ivory text-xl font-bold mb-2">
                ¿No ves lo que buscas?
              </h3>
              <p className="font-body text-ivory/55 text-sm leading-relaxed mb-5">
                Tenemos preparaciones especiales y pedidos personalizados.
                Escríbenos y lo conversamos.
              </p>
              <button onClick={openMenu} className="btn-outline">
                Consultar disponibilidad
              </button>
            </motion.div>
          </div>
        </section>

        {/* ── How to order ── */}
        <section className="section-padding-sm bg-ivory" aria-labelledby="order-heading">
          <div className="container-site">
            <div className="text-center mb-10">
              <SectionLabel>¿Cómo pedir?</SectionLabel>
              <h2 id="order-heading" className="section-title text-espresso mt-3">
                Tan fácil como
                <span className="text-amber"> un mensaje.</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
              {[
                { step: '1', icon: '👆', title: 'Elige tu plato', text: 'Revisa el menú y selecciona lo que quieres pedir.' },
                { step: '2', icon: '💬', title: 'Escríbenos', text: 'Envíanos un WhatsApp con tu pedido. Respondemos en minutos.' },
                { step: '3', icon: '🚀', title: 'Recibe', text: 'Preparamos y te lo entregamos caliente y listo para comer.' },
              ].map((s, i) => (
                <motion.div
                  key={s.step}
                  className="text-center"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.12 }}
                >
                  <div className="w-12 h-12 rounded-full bg-amber/10 border border-amber/20 flex items-center justify-center text-2xl mx-auto mb-4">
                    {s.icon}
                  </div>
                  <p className="text-amber text-xs font-semibold tracking-wider uppercase font-body mb-1">Paso {s.step}</p>
                  <h3 className="font-display text-espresso text-lg font-bold mb-1">{s.title}</h3>
                  <p className="font-body text-warm-gray text-sm">{s.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <WhatsAppCTA />
      </main>

      <Footer />
      <FloatingWhatsApp />
    </>
  )
}
