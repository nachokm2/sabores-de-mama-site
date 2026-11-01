import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { getProductosHornear, imagenUrl } from '../../lib/publicApi'
import { computeTotal, fmtCLP } from '../../lib/flowConfig'
import { detalleProducto } from '../../lib/productos'

function ProductoOpcion({ p, sel, onToggle }) {
  const [abierta, setAbierta] = useState(false)
  // ¿La descripción no cabe en sus 2 líneas? Se mide el texto real (no se
  // cuentan caracteres): lo que cabe depende del ancho de la pantalla.
  const [recortada, setRecortada] = useState(false)
  const descRef = useRef(null)
  const detalle = detalleProducto(p)

  useLayoutEffect(() => {
    const el = descRef.current
    if (!el) return undefined
    const medir = () => setRecortada(el.scrollHeight > el.clientHeight + 1)
    medir()
    if (typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver(medir)
    ro.observe(el)
    return () => ro.disconnect()
  }, [p.descripcion])

  return (
    <label
      className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 cursor-pointer transition-colors ${
        sel ? 'border-terracotta bg-amber/10' : 'border-espresso/15 bg-background-surface hover:border-terracotta/40'
      }`}
    >
      <input type="checkbox" checked={sel} onChange={onToggle} className="mt-0.5 accent-terracotta w-4 h-4 flex-shrink-0" />
      {p.imagen && (
        <img
          src={imagenUrl(p.imagen)}
          alt=""
          className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
          onError={(e) => { e.currentTarget.style.display = 'none' }}
        />
      )}
      {/* El precio va en la línea del nombre y el resto del texto usa todo el
          ancho: antes el precio ocupaba una columna propia y la descripción
          quedaba en una tira angosta y muy alta. */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-espresso leading-snug">{p.nombre}</p>
          <span className="text-sm font-semibold text-terracotta whitespace-nowrap">{fmtCLP(p.precio)}</span>
        </div>
        {detalle && <p className="text-2xs text-warm-gray mt-0.5">{detalle}</p>}
        {p.descripcion && (
          <p ref={descRef} className={`text-xs text-warm-gray leading-relaxed mt-1 ${abierta ? '' : 'line-clamp-2'}`}>
            {p.descripcion}
          </p>
        )}
        {(recortada || abierta) && (
          <button
            type="button"
            // Dentro del <label>: sin preventDefault el clic marcaría el producto.
            onClick={(e) => {
              e.preventDefault()
              setAbierta((v) => !v)
            }}
            className="text-2xs font-semibold text-terracotta hover:underline mt-0.5"
          >
            {abierta ? 'Ver menos' : 'Ver más'}
          </button>
        )}
      </div>
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

  // Una sola columna en todos los tamaños: el resumen mide ~670px y en dos
  // columnas el nombre quedaba partido en 3 o 4 líneas.
  const opciones = (lista) => (
    <div className="grid grid-cols-1 gap-2.5">
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
