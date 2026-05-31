import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Helmet } from 'react-helmet-async'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import PageHero from '../components/ui/PageHero'
import SectionLabel from '../components/ui/SectionLabel'
import WhatsAppCTA from '../components/sections/WhatsAppCTA'
import {
  SERVICES, DISH_CATEGORIES, MEAL_PREP_READY,
  EXTRAS, DULCES_FAMILIAR, DULCES_SNACKS, COMMUNES,
} from '../data/menu'
import { useWhatsApp } from '../hooks/useWhatsApp'

const WA_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER 
function waLink(msg) {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`
}

function WaIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

/* ── Category accordion ─────────────────────────────────────────────────────── */
function CategoryAccordion({ cat, index, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <motion.div
      className="border border-white/10 rounded-2xl overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
    >
      <button
        className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden="true">{cat.icon}</span>
          <span className="font-display text-ivory text-lg font-semibold">{cat.label}</span>
          <span className="font-body text-warm-gray text-xs bg-white/8 px-2.5 py-0.5 rounded-full">
            {cat.items.length} platos
          </span>
        </div>
        <motion.span
          className="text-amber text-xl leading-none flex-shrink-0"
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.25 }}
          aria-hidden="true"
        >
          +
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-white/8 pt-4">
              <div className="flex flex-wrap gap-2">
                {cat.items.map((item) => (
                  <a
                    key={item}
                    href={waLink(`¡Hola! Me gustaría incluir ${item} en mi pedido. ¿Está disponible?`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-body text-ivory/70 text-sm bg-white/6 border border-white/10 px-3.5 py-1.5 rounded-full hover:border-amber/50 hover:text-amber hover:bg-amber/8 transition-all duration-200"
                  >
                    {item}
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ── Dulce card ─────────────────────────────────────────────────────────────── */
function DulceCard({ item, index }) {
  return (
    <motion.a
      href={waLink(`¡Hola! Me interesa pedir ${item.name}. ¿Está disponible?`)}
      target="_blank"
      rel="noopener noreferrer"
      className="relative rounded-2xl overflow-hidden group"
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: index * 0.06 }}
      whileHover={{ y: -4 }}
      aria-label={`Pedir ${item.name}`}
    >
      <div className={`h-32 relative overflow-hidden ${!item.image ? `bg-gradient-to-br ${item.gradient}` : 'bg-espresso'}`}>
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl transition-transform duration-500 group-hover:scale-110" aria-hidden="true">{item.emoji}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-espresso/60 to-transparent" aria-hidden="true" />
        <div className="absolute top-2.5 left-2.5 bg-espresso/85 backdrop-blur-sm text-amber text-xs font-bold px-2.5 py-1 rounded-full">
          {item.priceLabel}
        </div>
      </div>
      <div className="bg-espresso p-3.5">
        <h4 className="font-display text-ivory text-sm font-semibold leading-tight mb-0.5">{item.name}</h4>
        <p className="font-body text-warm-gray text-xs">{item.subtitle}</p>
      </div>
    </motion.a>
  )
}

/* ── Service summary card ────────────────────────────────────────────────────── */
function ServiceSummary({ service, index }) {
  return (
    <motion.div
      className={`rounded-2xl p-6 flex flex-col gap-4 ${service.highlight ? 'ring-2 ring-amber/40' : 'ring-1 ring-white/10'}`}
      style={{ background: 'linear-gradient(160deg, #1A0B06 0%, #2C1810 100%)' }}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.12 }}
    >
      <div className={`h-1 w-full rounded-full bg-gradient-to-r ${service.gradient}`} aria-hidden="true" />
      <div className="flex items-center gap-3">
        <span className="text-3xl" aria-hidden="true">{service.icon}</span>
        <div>
          <h3 className="font-display text-ivory text-xl font-bold">{service.name}</h3>
          <p className="font-body text-amber text-sm font-semibold">{service.priceLabel} <span className="text-warm-gray font-normal">por servicio</span></p>
        </div>
      </div>
      <ul className="space-y-2">
        {service.features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <span className="text-amber flex-shrink-0 mt-0.5" aria-hidden="true">✓</span>
            <span className="font-body text-ivory/65 text-sm">{f}</span>
          </li>
        ))}
      </ul>
      <a
        href={waLink(`¡Hola! Me interesa el servicio de ${service.name} ($${service.priceLabel}). ¿Me puedes dar más información?`)}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold font-body transition-all duration-300 ${
          service.highlight
            ? 'bg-amber text-espresso hover:bg-gold'
            : 'bg-white/8 text-ivory border border-white/15 hover:bg-amber hover:text-espresso hover:border-amber'
        }`}
      >
        <WaIcon />
        Agendar este servicio
      </a>
    </motion.div>
  )
}

/* ── Page ─────────────────────────────────────────────────────────────────────── */
export default function Menu() {
  const { openDefault } = useWhatsApp()

  return (
    <>
      <Helmet>
        <title>Menú y Servicios | Sabores de Mamá</title>
        <meta name="description" content="Cocinera a domicilio ($55.000) y Meal Prep ($60.000). Más de 60 preparaciones de comida casera chilena para elegir. Agenda por WhatsApp." />
      </Helmet>

      <Navbar />

      <main>
        <PageHero
          label="Menú y Servicios"
          title="Comida casera"
          titleHighlight="hecha para ti."
          subtitle="Elige tu servicio y hasta 5 preparaciones. Tú pones los ingredientes, yo cocino con amor."
          breadcrumb={[{ label: 'Inicio', href: '/' }, { label: 'Menú', href: '/menu' }]}
        >
          <button onClick={openDefault} className="btn-whatsapp text-sm">
            <WaIcon className="w-4 h-4" />
            Agendar por WhatsApp
          </button>
        </PageHero>

        {/* ── Services ── */}
        <section className="section-padding bg-bark relative overflow-hidden" aria-labelledby="services-heading">
          <div
            className="absolute left-1/2 -translate-x-1/2 top-0 w-[900px] h-[500px] pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(200,135,58,0.1) 0%, transparent 70%)' }}
            aria-hidden="true"
          />
          <div className="container-site relative">
            <div className="text-center mb-12">
              <SectionLabel light>Servicios</SectionLabel>
              <h2 id="services-heading" className="section-title-light mt-4">
                ¿Cómo quieres
                <span className="text-gradient-gold"> tu comida?</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto">
              {SERVICES.map((s, i) => <ServiceSummary key={s.id} service={s} index={i} />)}
            </div>
          </div>
        </section>

        {/* ── Dish categories ── */}
        <section className="section-padding bg-espresso" aria-labelledby="dishes-heading">
          <div className="container-site">
            <div className="text-center mb-12">
              <SectionLabel light>Elige tus Platos</SectionLabel>
              <h2 id="dishes-heading" className="section-title-light mt-4">
                Más de 60 platos
                <span className="text-gradient-gold"> para elegir.</span>
              </h2>
              <p className="font-body text-ivory/50 text-sm mt-4 max-w-md mx-auto">
                Haz clic en cualquier plato para pedirlo directamente por WhatsApp.
                ¿Algo que no está en la lista? Sin problema, ¡lo hacemos igual!
              </p>
            </div>

            <div className="space-y-3 max-w-3xl mx-auto mb-14">
              {DISH_CATEGORIES.map((cat, i) => (
                <CategoryAccordion key={cat.id} cat={cat} index={i} defaultOpen={i === 0} />
              ))}
            </div>

            {/* Meal prep ready-to-cook */}
            <div className="max-w-3xl mx-auto">
              <div className="bg-amber/5 border border-amber/20 rounded-2xl p-6 mb-6">
                <div className="flex items-start gap-3 mb-5">
                  <span className="text-3xl" aria-hidden="true">🧊</span>
                  <div>
                    <h3 className="font-display text-ivory text-xl font-bold">Preparaciones Listas para Cocinar</h3>
                    <p className="font-body text-ivory/55 text-sm mt-1">
                      Exclusivo Meal Prep · Crudas y listas para que cocines cuando quieras · 2 preparaciones = 1 plato
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {MEAL_PREP_READY.map((group) => (
                    <div key={group.id} className="bg-white/5 rounded-xl p-4">
                      <p className="font-body text-amber text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
                        <span aria-hidden="true">{group.icon}</span>{group.label}
                      </p>
                      <ul className="space-y-1.5">
                        {group.items.map((item) => (
                          <li key={item} className="font-body text-ivory/65 text-sm">• {item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Extras ── */}
        <section className="section-padding-sm bg-bark" aria-labelledby="extras-heading">
          <div className="container-site">
            <div className="text-center mb-10">
              <SectionLabel light>Extras para tu Menú</SectionLabel>
              <h2 id="extras-heading" className="font-display text-ivory text-3xl md:text-4xl font-bold mt-3">
                Complementa tu pedido.
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto">
              {/* Ensaladas */}
              <div className="bg-espresso/60 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl" aria-hidden="true">🥗</span>
                  <div>
                    <h3 className="font-display text-ivory text-lg font-bold">Ensaladas</h3>
                    <p className="font-body text-amber text-sm font-semibold">{EXTRAS.ensaladas.priceLabel} · Hasta {EXTRAS.ensaladas.maxItems} opciones</p>
                  </div>
                </div>
                <ul className="space-y-3">
                  {EXTRAS.ensaladas.items.map((e) => (
                    <li key={e.name} className="border-b border-white/8 pb-3 last:border-0 last:pb-0">
                      <p className="font-display text-ivory text-sm font-semibold">{e.name}</p>
                      <p className="font-body text-warm-gray text-xs mt-0.5">{e.desc}</p>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Postres */}
              <div className="bg-espresso/60 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl" aria-hidden="true">🍮</span>
                  <div>
                    <h3 className="font-display text-ivory text-lg font-bold">Postres</h3>
                    <p className="font-body text-amber text-sm font-semibold">{EXTRAS.postres.note}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {EXTRAS.postres.items.map((p) => (
                    <span key={p} className="font-body text-ivory/70 text-sm bg-white/6 border border-white/10 px-3 py-1.5 rounded-full">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Dulces Saludables ── */}
        <section className="section-padding bg-espresso" aria-labelledby="dulces-heading">
          <div className="container-site">
            <div className="text-center mb-12">
              <SectionLabel light>Dulces Saludables</SectionLabel>
              <h2 id="dulces-heading" className="section-title-light mt-4">
                Hecho en casa,
                <span className="text-gradient-gold"> sin culpa.</span>
              </h2>
              <p className="font-body text-ivory/50 text-sm mt-4 max-w-md mx-auto">
                No necesitas aportar ingredientes. Puedes agregarlos a cualquiera de tus servicios.
              </p>
            </div>

            <p className="font-body text-amber text-xs font-semibold tracking-[0.15em] uppercase text-center mb-5">
              Formato Familiar (Molde 20 cm) · 8 a 10 porciones
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-10">
              {DULCES_FAMILIAR.map((d, i) => <DulceCard key={d.name} item={d} index={i} />)}
            </div>

            <p className="font-body text-amber text-xs font-semibold tracking-[0.15em] uppercase text-center mb-5">
              Formato Snacks (Bolsas de 10 unidades) · 1 porción individual
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {DULCES_SNACKS.map((d, i) => <DulceCard key={d.name} item={d} index={i} />)}
            </div>
          </div>
        </section>

        {/* ── Communes ── */}
        <section className="section-padding-sm bg-bark" aria-labelledby="communes-heading">
          <div className="container-site">
            <div className="text-center mb-10">
              <SectionLabel light>Cobertura</SectionLabel>
              <h2 id="communes-heading" className="font-display text-ivory text-3xl md:text-4xl font-bold mt-3">
                Llegamos a tu hogar.
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl mx-auto">
              <div className="bg-espresso/60 border border-white/10 rounded-2xl p-6">
                <p className="font-body text-amber text-xs font-semibold uppercase tracking-wider mb-4">📦 Meal Prep</p>
                <div className="flex flex-wrap gap-2">
                  {COMMUNES.mealPrep.map((c) => (
                    <span key={c} className="font-body text-ivory/70 text-sm bg-white/6 border border-white/10 px-3 py-1.5 rounded-full">{c}</span>
                  ))}
                </div>
              </div>
              <div className="bg-espresso/60 border border-white/10 rounded-2xl p-6">
                <p className="font-body text-amber text-xs font-semibold uppercase tracking-wider mb-4">🏠 Cocinera a Domicilio</p>
                <div className="flex flex-wrap gap-2">
                  {COMMUNES.cocinera.map((c) => (
                    <span key={c} className="font-body text-ivory/70 text-sm bg-white/6 border border-white/10 px-3 py-1.5 rounded-full">{c}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <WhatsAppCTA />
      </main>

      <Footer />
    </>
  )
}
