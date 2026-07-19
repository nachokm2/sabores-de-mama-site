import { useEffect, useMemo, useState } from 'react'
import { getPlatos, imagenUrl } from '../../lib/publicApi'

const MAX = 5
// Los acompañamientos NO son platos: no cuentan para los 5 y son la guarnición
// de los platos que la llevan.
const ACOMP_CAT = 'Acompañamientos'
// Las ensaladas tampoco cuentan para los 5: se cobran aparte y se agregan como
// adicional al pedido (ver EnsaladasAddon).
const ENSALADA_CAT = 'Ensaladas'

// Normaliza para búsqueda: minúsculas y sin tildes (acento-insensible).
const norm = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[áàäâ]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöô]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/ñ/g, 'n')

// Categorías cuyos platos llevan guarnición a elección. La regla de negocio es
// que las carnes y pollos van acompañados. Se mantiene el flag manual por plato
// (lleva_acompanamiento) como excepción configurable desde el admin.
const CATS_CON_ACOMP = new Set(['carnes y pollo'])
const llevaAcomp = (p) => CATS_CON_ACOMP.has(norm(p.categoria)) || !!p.lleva_acompanamiento

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
 * Paso 3 · Selección de platos. Carga los platos desde la API y permite elegir
 * exactamente 5. Para no abrumar con una lista larga, los platos se organizan en
 * acordeones por categoría (colapsados por defecto) y hay un buscador por nombre
 * que filtra y auto-despliega las categorías con coincidencias.
 */
export default function StepDishes({ data, update, onNext, onBack }) {
  const [platos, setPlatos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState(() => new Set())

  useEffect(() => {
    let active = true
    getPlatos(data.servicio)
      .then((lista) => active && setPlatos(lista))
      .catch(() => active && setError('No pudimos cargar los platos. Intenta más tarde.'))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.servicio])

  // Principales (cuentan para los 5) vs. acompañamientos (guarnición a elección).
  // Las ensaladas se excluyen: van como adicional (se cobran aparte).
  const principales = useMemo(
    () => platos.filter((p) => (p.categoria || '') !== ACOMP_CAT && (p.categoria || '') !== ENSALADA_CAT),
    [platos]
  )
  const acompanamientos = useMemo(() => platos.filter((p) => (p.categoria || '') === ACOMP_CAT), [platos])
  const grupos = useMemo(() => agrupar(principales), [principales])

  const seleccionados = data.platos || []
  const acompSel = data.acompSel || {} // { [platoId]: acompanamientoId }
  const count = seleccionados.length
  const completo = count === MAX

  const q = norm(query.trim())
  const buscando = q.length > 0

  // Recalcula platosDetalle (con su acompañamiento) + ids de guarniciones elegidas.
  const rebuild = (nextIds, nextAcompSel) => {
    const detalle = principales
      .filter((x) => nextIds.includes(x.id))
      .map((x) => {
        const sideId = llevaAcomp(x) ? nextAcompSel[x.id] : null
        const side = sideId ? acompanamientos.find((a) => a.id === sideId) : null
        return {
          id: x.id,
          nombre: x.nombre,
          descripcion: x.descripcion,
          lleva_acompanamiento: llevaAcomp(x),
          acompanamiento: side ? { id: side.id, nombre: side.nombre } : null,
        }
      })
    const acompanamientoIds = [...new Set(detalle.map((d) => d.acompanamiento?.id).filter(Boolean))]
    update({ platos: nextIds, platosDetalle: detalle, acompSel: nextAcompSel, acompanamientoIds })
  }

  const toggle = (p) => {
    const isSel = seleccionados.includes(p.id)
    let nextIds
    const nextAcompSel = { ...acompSel }
    if (isSel) {
      nextIds = seleccionados.filter((id) => id !== p.id)
      delete nextAcompSel[p.id]
    } else if (count >= MAX) {
      return
    } else {
      nextIds = [...seleccionados, p.id]
      // Autoselecciona la primera guarnición si el plato la lleva.
      if (llevaAcomp(p) && acompanamientos.length && !nextAcompSel[p.id]) {
        nextAcompSel[p.id] = acompanamientos[0].id
      }
    }
    rebuild(nextIds, nextAcompSel)
  }

  const setAcomp = (platoId, sideId) => rebuild(seleccionados, { ...acompSel, [platoId]: sideId })

  // Platos elegidos que llevan acompañamiento (para el selector de guarnición).
  const platosConAcomp = principales.filter((p) => seleccionados.includes(p.id) && llevaAcomp(p))

  const toggleCat = (cat) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(cat) ? next.delete(cat) : next.add(cat)
      return next
    })

  // Al buscar, se filtran los platos por nombre y se ocultan las categorías sin
  // coincidencias; sin búsqueda se muestran todas las categorías (colapsables).
  const gruposVisibles = useMemo(() => {
    if (!buscando) return grupos
    return grupos
      .map(({ cat, items }) => ({ cat, items: items.filter((p) => norm(p.nombre).includes(q)) }))
      .filter((g) => g.items.length > 0)
  }, [grupos, buscando, q])

  // Durante una búsqueda las categorías con resultados quedan siempre abiertas.
  const isOpen = (cat) => buscando || expanded.has(cat)

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

      {/* Buscador */}
      <div className="relative mb-4">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray text-sm" aria-hidden="true">
          🔍
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar plato por nombre…"
          aria-label="Buscar plato por nombre"
          className="w-full rounded-xl border border-espresso/15 bg-background pl-9 pr-3.5 py-2.5 text-sm text-espresso focus:outline-none focus:border-terracotta/60"
        />
      </div>

      {loading ? (
        <p className="text-warm-gray text-sm py-8 text-center">Cargando platos…</p>
      ) : error ? (
        <p className="text-primary-600 text-sm py-6">{error}</p>
      ) : (
        <div className="space-y-2.5 mb-6">
          {gruposVisibles.map(({ cat, items }) => {
            const abierto = isOpen(cat)
            const nSel = items.filter((p) => seleccionados.includes(p.id)).length
            return (
              <div key={cat}>
                <button
                  type="button"
                  onClick={() => toggleCat(cat)}
                  aria-expanded={abierto}
                  className="w-full flex items-center justify-between gap-3 rounded-xl border border-espresso/15 bg-background-surface px-4 py-3 text-left transition-colors hover:border-terracotta/40"
                >
                  <span className="font-display text-sm font-bold text-espresso">
                    {cat}
                    <span className="ml-2 text-xs font-normal text-warm-gray">({items.length})</span>
                  </span>
                  <span className="flex items-center gap-3">
                    {nSel > 0 && (
                      <span className="text-xs font-semibold text-terracotta whitespace-nowrap">
                        {nSel} elegido{nSel > 1 ? 's' : ''}
                      </span>
                    )}
                    <span
                      className={`text-warm-gray transition-transform duration-200 ${abierto ? 'rotate-90' : ''}`}
                      aria-hidden="true"
                    >
                      ▸
                    </span>
                  </span>
                </button>

                {abierto && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2.5">
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
                              {p.descripcion && <p className="text-xs text-warm-gray mt-0.5">{p.descripcion}</p>}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}

          {buscando && gruposVisibles.length === 0 && (
            <p className="text-warm-gray text-sm py-6 text-center">
              No encontramos platos con “{query.trim()}”.
            </p>
          )}
        </div>
      )}

      {!loading && !error && platosConAcomp.length > 0 && acompanamientos.length > 0 && (
        <div className="mb-6 rounded-2xl border border-amber/30 bg-amber/[0.05] p-4">
          <h3 className="font-display text-base font-bold text-espresso mb-1">Elige el acompañamiento</h3>
          <p className="text-xs text-warm-gray mb-3">Estos platos vienen con una guarnición a elección.</p>
          <div className="space-y-2">
            {platosConAcomp.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3">
                <span className="text-sm text-espresso min-w-0 truncate">{p.nombre}</span>
                <select
                  value={acompSel[p.id] || ''}
                  onChange={(e) => setAcomp(p.id, Number(e.target.value))}
                  aria-label={`Acompañamiento para ${p.nombre}`}
                  className="rounded-lg border border-espresso/15 bg-background px-2 py-1.5 text-sm text-espresso shrink-0"
                >
                  {acompanamientos.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nombre}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
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
