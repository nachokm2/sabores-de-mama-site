import { useEffect, useState } from 'react'
import { getProductosHornear } from '../../lib/publicApi'
import { computeTotal, fmtCLP } from '../../lib/flowConfig'

/**
 * Add-on opcional (sirve para AMBOS flujos): productos para hornear en casa.
 * Carga GET /api/productos-hornear y permite agregarlos al pedido.
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

  return (
    <div className="rounded-2xl border border-amber/30 bg-amber/[0.05] p-4">
      <h3 className="font-display text-base font-bold text-espresso mb-1">
        ¿Quieres agregar algo para hornear en casa?
      </h3>
      <p className="text-xs text-warm-gray mb-3">Totalmente opcional.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {productos.map((p) => {
          const sel = seleccionados.includes(p.id)
          return (
            <label
              key={p.id}
              className={`flex items-start justify-between gap-2 rounded-xl border px-3 py-2.5 cursor-pointer transition-colors ${
                sel ? 'border-terracotta bg-amber/10' : 'border-espresso/15 bg-background-surface hover:border-terracotta/40'
              }`}
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <input type="checkbox" checked={sel} onChange={() => toggle(p)} className="mt-0.5 accent-terracotta w-4 h-4 flex-shrink-0" />
                {p.imagen && (
                  <img
                    src={p.imagen}
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
        })}
      </div>
    </div>
  )
}
