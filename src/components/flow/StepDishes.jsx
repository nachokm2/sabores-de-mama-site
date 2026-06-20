import { useEffect, useMemo, useState } from 'react'
import { getPlatos } from '../../lib/publicApi'

const MAX = 5

function agrupar(platos) {
  const map = new Map()
  for (const p of platos) {
    const k = p.categoria || 'Otros'
    if (!map.has(k)) map.set(k, [])
    map.get(k).push(p)
  }
  return Array.from(map, ([cat, items]) => ({ cat, items }))
}

/**
 * Paso 3 · Selección de platos. Carga los platos desde la API. Permite elegir
 * exactamente 5 (ni más ni menos para avanzar). Contador en tiempo real.
 */
export default function StepDishes({ data, update, onNext, onBack }) {
  const [platos, setPlatos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getPlatos()
      .then((lista) => active && setPlatos(lista))
      .catch(() => active && setError('No pudimos cargar los platos. Intenta más tarde.'))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  const grupos = useMemo(() => agrupar(platos), [platos])
  const seleccionados = data.platos || []
  const count = seleccionados.length
  const completo = count === MAX

  const toggle = (p) => {
    const isSel = seleccionados.includes(p.id)
    let nextIds
    if (isSel) nextIds = seleccionados.filter((id) => id !== p.id)
    else if (count >= MAX) return
    else nextIds = [...seleccionados, p.id]

    const detalle = platos
      .filter((x) => nextIds.includes(x.id))
      .map((x) => ({ id: x.id, nombre: x.nombre, descripcion: x.descripcion }))
    update({ platos: nextIds, platosDetalle: detalle })
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-1">
        <h2 className="font-display text-2xl font-bold text-espresso">Elige tus 5 platos</h2>
      </div>
      <p className="text-warm-gray text-sm mb-4">Selecciona exactamente {MAX} preparaciones.</p>

      {/* Contador */}
      <div
        className={`sticky top-2 z-10 mb-4 rounded-xl px-4 py-2.5 text-sm font-semibold text-center border ${
          completo
            ? 'bg-[#15803D]/10 text-[#15803D] border-[#15803D]/30'
            : 'bg-amber/10 text-accent-600 border-amber/30'
        }`}
      >
        {count} de {MAX} platos seleccionados {completo && '✓'}
      </div>

      {loading ? (
        <p className="text-warm-gray text-sm py-8 text-center">Cargando platos…</p>
      ) : error ? (
        <p className="text-primary-600 text-sm py-6">{error}</p>
      ) : (
        <div className="space-y-5 mb-6">
          {grupos.map(({ cat, items }) => (
            <div key={cat}>
              <h3 className="font-display text-sm font-bold text-terracotta mb-2">{cat}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {items.map((p) => {
                  const sel = seleccionados.includes(p.id)
                  const bloqueado = !sel && count >= MAX
                  return (
                    <button
                      key={p.id}
                      onClick={() => toggle(p)}
                      disabled={bloqueado}
                      aria-pressed={sel}
                      className={`text-left rounded-xl border p-3 transition-all ${
                        sel
                          ? 'border-terracotta bg-amber/10 ring-1 ring-terracotta'
                          : bloqueado
                            ? 'border-espresso/10 bg-espresso/[0.02] opacity-50 cursor-not-allowed'
                            : 'border-espresso/15 bg-background-surface hover:border-terracotta/50'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span
                          className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-md border flex items-center justify-center text-[10px] ${
                            sel ? 'bg-terracotta border-terracotta text-ivory' : 'border-espresso/30'
                          }`}
                          aria-hidden="true"
                        >
                          {sel ? '✓' : ''}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-espresso">{p.nombre}</p>
                          {p.descripcion && <p className="text-xs text-warm-gray mt-0.5">{p.descripcion}</p>}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between">
        <button onClick={onBack} className="text-warm-gray hover:text-espresso px-4 py-3">
          ← Atrás
        </button>
        <button
          onClick={onNext}
          disabled={!completo}
          className="bg-terracotta text-ivory font-semibold rounded-full px-6 py-3 hover:bg-ember transition-colors disabled:opacity-50"
        >
          Continuar
        </button>
      </div>
    </div>
  )
}
