import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import SectionLabel from '../ui/SectionLabel'
import { getProductosHornear, imagenUrl } from '../../lib/publicApi'
import { fmtCLP } from '../../lib/flowConfig'
import { detalleProducto } from '../../lib/productos'

/**
 * Productos destacados de Postres y Snacks (los que tienen `etiqueta` en el
 * panel, p. ej. "Pan de Pascua 🎄"), con sus precios a la vista. No se piden
 * solos: se suman como adicional al pedido de Meal Prep. Si no hay ningún
 * producto destacado activo, la sección no se muestra.
 */
export default function ProductosDestacados() {
  const [productos, setProductos] = useState([])

  useEffect(() => {
    let active = true
    getProductosHornear()
      .then((lista) => active && setProductos(Array.isArray(lista) ? lista : []))
      .catch(() => active && setProductos([]))
    return () => {
      active = false
    }
  }, [])

  const grupos = new Map()
  for (const p of productos) {
    const etiqueta = (p.etiqueta || '').trim()
    if (etiqueta) grupos.set(etiqueta, [...(grupos.get(etiqueta) || []), p])
  }
  if (!grupos.size) return null

  return (
    <section className="section-padding bg-background-warm" aria-label="Productos destacados">
      <div className="container-site space-y-10">
        {[...grupos].map(([etiqueta, lista]) => (
          <div
            key={etiqueta}
            className="rounded-3xl border-2 border-terracotta bg-ivory p-6 md:p-10 shadow-[0_12px_48px_rgba(194,121,47,0.18)]"
          >
            <div className="text-center mb-8">
              <SectionLabel light>Destacado</SectionLabel>
              <h2 className="font-display text-espresso text-3xl md:text-4xl font-bold mt-3">{etiqueta}</h2>
              <p className="font-body text-warm-gray text-sm md:text-base mt-3 max-w-md mx-auto">
                Agrégalo como adicional a tu pedido de Meal Prep y te llega junto con tu servicio.
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
              {lista.map((p, i) => (
                <motion.article
                  key={p.id}
                  className="rounded-2xl border border-wheat/60 bg-background-surface overflow-hidden flex flex-col"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.5, delay: i * 0.06 }}
                >
                  {p.imagen && (
                    <img
                      src={imagenUrl(p.imagen)}
                      alt={p.nombre}
                      loading="lazy"
                      className="w-full h-28 md:h-36 object-cover"
                      onError={(e) => { e.currentTarget.style.display = 'none' }}
                    />
                  )}
                  <div className="p-3 md:p-4 flex flex-col flex-1">
                    <h3 className="font-display text-espresso text-sm md:text-base font-bold leading-tight">{p.nombre}</h3>
                    {detalleProducto(p) && (
                      <p className="font-body text-warm-gray text-xs mt-0.5">{detalleProducto(p)}</p>
                    )}
                    {p.descripcion && (
                      <p className="font-body text-warm-gray text-xs leading-relaxed mt-1 line-clamp-3">{p.descripcion}</p>
                    )}
                    <p className="font-display text-terracotta text-xl md:text-2xl font-bold mt-auto pt-2">
                      {fmtCLP(p.precio)}
                    </p>
                  </div>
                </motion.article>
              ))}
            </div>

            <div className="text-center">
              <Link to="/meal-prep" className="btn-primary">
                Agregar a mi Meal Prep
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
