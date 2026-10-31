import { useEffect, useState } from 'react'
import { getProductosHornear, imagenUrl } from '../../lib/publicApi'
import { computeTotal, fmtCLP } from '../../lib/flowConfig'

function ProductoOpcion({ p, sel, onToggle }) {
  return (
    <label
      className={`flex items-start justify-between gap-2 rounded-xl border px-3 py-2.5 cursor-pointer transition-colors ${
        sel ? 'border-terracotta bg-amber/10' : 'border-espresso/15 bg-background-surface hover:border-terracotta/40'
      }`}
    >
      <div className="flex items-start gap-2.5 min-w-0">
        <input type="checkbox" checked={sel} onChange={onToggle} className="mt-0.5 accent-terracotta w-4 h-4 flex-shrink-0" />
        {p.imagen && (
          <img
            src={imagenUrl(p.imagen)}
            alt=""
            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-espresso">{p.nombre}</p>
          {(p.formato || p.porciones) && (
            <p className="text-2xs text-warm-gray">{[p.formato, p.porciones].filter(Boolean).join(' · ')}</p>
          )}
          {p.descripcion && <p className="text-xs text-warm-gray">{p.descripcion}</p>}
        </div>
      </div>
      <span className="text-sm font-semibold text-terracotta whitespace-nowrap">{fmtCLP(p.precio)}</span>
    </label>
  )
}

/**
 * Add-on opcional (sirve para AMBOS flujos): productos para hornear en casa.
 * Carga GET /api/productos-hornear y permite agregarlos al pedido. Los
 * productos con `etiqueta` (p. ej. "Pan de Pascua 🎄") salen primero, en un
 * recuadro resaltado por etiqueta.
 */
export default function BakingAddon({ data, update }) {
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    getProductosHornear()
      .then((lista) => active && setProductos(lista))
      .catch(() => active && setProductos([]))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  const seleccionados = data.productos_hornear || []

  const toggle = (prod) => {
    const isSel = seleccionados.includes(prod.id)
    const nextIds = isSel ? seleccionados.filter((id) => id !== prod.id) : [...seleccionados, prod.id]
    const detalle = productos.filter((p) => nextIds.includes(p.id))
    const bakingTotal = detalle.reduce((sum, p) => sum + Number(p.precio || 0), 0)
    update({
      productos_hornear: nextIds,
      productosHornearDetalle: detalle.map((p) => ({ id: p.id, nombre: p.nombre, precio: Number(p.precio || 0) })),
      bakingTotal,
      total: computeTotal({ base: data.base, costo_despacho: data.costo_despacho, bakingTotal }),
    })
  }

  if (loading) {
    return <p className="text-warm-gray text-sm">Cargando productos…</p>
  }
  if (!productos.length) return null

  // Destacados agrupados por etiqueta (en el orden en que llegan) + el resto.
  const destacados = new Map()
  const resto = []
  for (const p of productos) {
    const etiqueta = (p.etiqueta || '').trim()
    if (!etiqueta) resto.push(p)
    else destacados.set(etiqueta, [...(destacados.get(etiqueta) || []), p])
  }

  const opciones = (lista) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      {lista.map((p) => (
        <ProductoOpcion key={p.id} p={p} sel={seleccionados.includes(p.id)} onToggle={() => toggle(p)} />
      ))}
    </div>
  )

  return (
    <div className="space-y-4">
      {[...destacados].map(([etiqueta, lista]) => (
        <section
          key={etiqueta}
          className="rounded-2xl border-2 border-terracotta bg-amber/[0.12] p-4 shadow-[0_8px_30px_rgba(194,121,47,0.15)]"
        >
          <h3 className="font-display text-lg font-bold text-espresso mb-0.5">{etiqueta}</h3>
          <p className="text-xs text-warm-gray mb-3">Súmalo a tu pedido y te llega junto con tu servicio.</p>
          {opciones(lista)}
        </section>
      ))}

      {resto.length > 0 && (
        <div className="rounded-2xl border border-amber/30 bg-amber/[0.05] p-4">
          <h3 className="font-display text-base font-bold text-espresso mb-1">
            ¿Quieres agregar algo saludable?
          </h3>
          <p className="text-xs text-warm-gray mb-3">Totalmente opcional.</p>
          {opciones(resto)}
        </div>
      )}
    </div>
  )
}
