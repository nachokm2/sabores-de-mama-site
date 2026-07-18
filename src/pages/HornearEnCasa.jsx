import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Helmet } from 'react-helmet-async'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import PageHero from '../components/ui/PageHero'
import SectionLabel from '../components/ui/SectionLabel'
import { DULCES_FAMILIAR, DULCES_SNACKS } from '../data/menu'
import { getProductosHornear, imagenUrl } from '../lib/publicApi'
import { fmtCLP } from '../lib/flowConfig'

// Degradados para el fondo de las tarjetas sin foto (se rotan por índice).
const GRADIENTS = [
  'from-gold via-amber to-wheat',
  'from-terracotta via-ember to-amber',
  'from-espresso via-bark to-terracotta',
  'from-bark via-ember to-gold',
  'from-terracotta via-bark to-amber',
  'from-bark via-amber to-wheat',
]

// Productos estáticos de respaldo (si aún no hay productos cargados en el admin
// o si el backend no responde), para que la landing nunca quede vacía.
const DULCES_FALLBACK = [...DULCES_FAMILIAR, ...DULCES_SNACKS]

// Convierte un producto del admin (productos_hornear) al formato de la tarjeta.
function mapProducto(p, i) {
  return {
    key: p.id,
    name: p.nombre,
    subtitle: [p.formato, p.porciones].filter(Boolean).join(' · ') || p.descripcion || '',
    priceLabel: fmtCLP(p.precio),
    image: p.imagen ? imagenUrl(p.imagen) : null,
    emoji: '🧁',
    gradient: GRADIENTS[i % GRADIENTS.length],
  }
}

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
  const navigate = useNavigate()
  // El flujo de pedido es el formulario de Meal Prep (/meal-prep); los dulces
  // se suman como servicio adicional dentro de ese flujo.
  const pedir = () => navigate('/meal-prep')

  // Productos administrables (pestaña "Hornear" del panel). Si no hay ninguno
  // cargado o el backend no responde, se usan los estáticos de respaldo.
  const [productos, setProductos] = useState([])
  const [cargado, setCargado] = useState(false)

  useEffect(() => {
    let active = true
    getProductosHornear()
      .then((lista) => active && setProductos(Array.isArray(lista) ? lista : []))
      .catch(() => active && setProductos([]))
      .finally(() => active && setCargado(true))
    return () => {
      active = false
    }
  }, [])

  const dulces = productos.length ? productos.map(mapProducto) : DULCES_FALLBACK

  return (
    <>
      <Helmet>
        <title>Healthy | Sabores de Mamá</title>
        <meta
          name="description"
          content="Postres y galletas saludables hechos en casa: los recibes listos para disfrutar, con ingredientes seleccionados. Sin culpa, sin conservantes."
        />
      </Helmet>

      <Navbar />

      <main>
        {/* ── Hero ── */}
        <PageHero
          label="Healthy"
          title="Dulces caseros,"
          titleHighlight="elaborados con ingredientes seleccionados y listos para disfrutar."
          subtitle="Dulces saludables hechos en casa: los recibes listos para disfrutar, con ingredientes seleccionados y sin conservantes."
          breadcrumb={[{ label: 'Inicio', href: '/' }, { label: 'Healthy', href: '/healthy' }]}
        >
          <button onClick={pedir} className="btn-primary text-sm">
            Pedir ahora
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
              recibes listos para disfrutar, cuando se te antoje.
              <strong className="text-espresso"> No necesitas aportar ingredientes</strong> y puedes agregarlos
              a cualquiera de tus servicios.
            </p>
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

            {!cargado && productos.length === 0 ? (
              <p className="font-body text-warm-gray text-sm text-center py-8">Cargando dulces…</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {dulces.map((d, i) => (
                  <DulceCard key={d.key || d.name} item={d} index={i} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── CTA final ── */}
        <section className="py-20 bg-background-warm border-t border-espresso/10">
          <div className="container-site text-center max-w-2xl">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-espresso mb-4">
              ¿Se te antojó algo dulce?
            </h2>
            <p className="font-body text-warm-gray text-base mb-8">
              Arma tu pedido en línea y suma tus postres y galletas favoritos, listos para disfrutar.
            </p>
            <button onClick={pedir} className="btn-primary">
              Pedir ahora
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
