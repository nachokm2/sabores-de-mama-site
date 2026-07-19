import { useEffect, useState } from 'react'
import { getPlatos, imagenUrl } from '../../lib/publicApi'
import { computeTotal, fmtCLP, ENSALADA_PRECIO } from '../../lib/flowConfig'

const ENSALADA_CAT = 'Ensaladas'
const claveDe = (id) => `ensalada-${id}`

/**
 * Add-on opcional (ambos flujos): ensaladas. Se cobran aparte —igual que los
 * productos Healthy— a un valor fijo por unidad (ENSALADA_PRECIO). Cada ensalada
 * elegida se guarda como una entrada en `data.adicionales` (clave `ensalada-<id>`),
 * de modo que se suma al total y viaja en el pedido con el resto de adicionales.
 */
export default function EnsaladasAddon({ data, update }) {
  const [ensaladas, setEnsaladas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    // Promise.resolve por si getPlatos está mockeado y no devuelve promesa.
    Promise.resolve(getPlatos(data.servicio))
      .then((lista) => {
        if (!active) return
        const arr = Array.isArray(lista) ? lista : []
        setEnsaladas(arr.filter((p) => (p.categoria || '') === ENSALADA_CAT))
      })
      .catch(() => active && setEnsaladas([]))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [data.servicio])

  const precio = ENSALADA_PRECIO
  const adicionales = data.adicionales || []
  const isSel = (id) => adicionales.some((a) => a.clave === claveDe(id))

  const toggle = (p) => {
    const clave = claveDe(p.id)
    const next = isSel(p.id)
      ? adicionales.filter((a) => a.clave !== clave)
      : [...adicionales, { clave, nombre: `Ensalada: ${p.nombre}`, precio }]
    const adicionalesTotal = next.reduce((sum, a) => sum + Number(a.precio || 0), 0)
    update({
      adicionales: next,
      adicionalesTotal,
      total: computeTotal({
        base: data.base,
        costo_despacho: data.costo_despacho,
        bakingTotal: data.bakingTotal,
        adicionalesTotal,
      }),
    })
  }

  if (loading) return null
  if (!ensaladas.length) return null

  return (
    <div className="rounded-2xl border border-amber/30 bg-amber/[0.05] p-4">
      <h3 className="font-display text-base font-bold text-espresso mb-1">¿Agregar una ensalada?</h3>
      <p className="text-xs text-warm-gray mb-3">Se cobran aparte, {fmtCLP(precio)} c/u. Opcional.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {ensaladas.map((p) => {
          const sel = isSel(p.id)
          return (
            <label
              key={p.id}
              className={`flex items-start justify-between gap-2 rounded-xl border px-3 py-2.5 cursor-pointer transition-colors ${
                sel ? 'border-terracotta bg-amber/10' : 'border-espresso/15 bg-background-surface hover:border-terracotta/40'
              }`}
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <input
                  type="checkbox"
                  checked={sel}
                  onChange={() => toggle(p)}
                  className="mt-0.5 accent-terracotta w-4 h-4 flex-shrink-0"
                />
                {p.imagen && (
                  <img
                    src={imagenUrl(p.imagen)}
                    alt=""
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-espresso">{p.nombre}</p>
                  {p.descripcion && <p className="text-xs text-warm-gray">{p.descripcion}</p>}
                </div>
              </div>
              <span className="text-sm font-semibold text-terracotta whitespace-nowrap">+ {fmtCLP(precio)}</span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
