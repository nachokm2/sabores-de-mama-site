import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import SectionLabel from '../../components/ui/SectionLabel'
import { getPlatos, getIngredientesDePlatos, imagenUrl } from '../../lib/publicApi'

const OPCIONES_PERSONAS = [1, 2, 3, 4, 5]

// Redondea a 2 decimales evitando ruido de coma flotante.
function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100
}

function escHtml(s) {
  return String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
}

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
 * Consultar lista de compras (portal del cliente).
 * El cliente elige los platos que quiere preparar y para cuántas personas; el
 * sistema consulta el backend de Cocinera a Domicilio (GET /api/platos/ingredientes,
 * cantidades POR PERSONA), las escala por el nº de comensales y genera la lista
 * de compras consolidada. No agenda nada: es una herramienta de planificación.
 */
export default function ClienteListaCompras() {
  const [platos, setPlatos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [seleccionados, setSeleccionados] = useState([])
  const [personas, setPersonas] = useState(2)

  // Lista consolidada de la última consulta (null = sin generar). Las cantidades
  // vienen EXACTAS del backend para el nº de personas elegido.
  const [base, setBase] = useState(null)
  const [generando, setGenerando] = useState(false)

  useEffect(() => {
    let active = true
    getPlatos()
      .then((lista) => active && setPlatos(Array.isArray(lista) ? lista : []))
      .catch(() => active && setError('No pudimos cargar los platos. Intenta más tarde.'))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  const grupos = useMemo(() => agrupar(platos), [platos])

  // La lista ya viene con las cantidades exactas para el nº de personas consultado.
  const lista = base || []

  const toggle = (id) => {
    setSeleccionados((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
    setBase(null) // la selección cambió → la lista anterior queda obsoleta
  }

  const generarCon = async (pers) => {
    if (!seleccionados.length) return
    setGenerando(true)
    setError('')
    try {
      const ingredientes = await getIngredientesDePlatos(seleccionados, pers)
      setBase(
        ingredientes.map((i) => ({
          nombre: i.nombre,
          unidad: i.unidad || '',
          cantidad: typeof i.cantidad === 'number' ? round2(i.cantidad) : i.cantidad,
        }))
      )
    } catch {
      setError('No pudimos generar la lista de compras. Intenta más tarde.')
      setBase(null)
    } finally {
      setGenerando(false)
    }
  }

  const generar = () => generarCon(personas)

  // Al cambiar el nº de personas se re-consulta con las cantidades EXACTAS (no lineales)
  // si ya hay una lista generada.
  const onElegirPersonas = (n) => {
    setPersonas(n)
    if (base) generarCon(n)
  }

  const descargarLista = () => {
    const win = window.open('', '_blank', 'width=620,height=720')
    if (!win) return
    const filas = lista
      .map(
        (i) =>
          `<tr><td>${escHtml(i.nombre)}</td><td style="text-align:right">${escHtml(i.cantidad)} ${escHtml(i.unidad)}</td></tr>`
      )
      .join('')
    win.document.write(
      `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Lista de compras</title>
      <style>
        body{font-family:Arial,Helvetica,sans-serif;color:#2A1C12;padding:28px;}
        h1{color:#AE4C29;font-size:20px;margin:0 0 4px}
        p{color:#6B5D4E;margin:0 0 18px;font-size:13px}
        table{width:100%;border-collapse:collapse}
        td{padding:7px 0;border-bottom:1px solid #ECE1D2;font-size:14px}
      </style></head><body>
      <h1>Lista de compras — Sabores de Mamá</h1>
      <p>Ingredientes para ${personas} ${personas === 1 ? 'persona' : 'personas'}</p>
      <table>${filas}</table>
      <script>window.onload=function(){window.print()}</script>
      </body></html>`
    )
    win.document.close()
  }

  const platosElegidos = platos.filter((p) => seleccionados.includes(p.id))

  return (
    <>
      <Helmet>
        <title>Consultar lista de compras | Sabores de Mamá</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <Navbar />
      <main className="min-h-screen bg-background pt-28 pb-20">
        <div className="container-site max-w-3xl">
          {/* Header */}
          <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
            <div>
              <SectionLabel>Mi cuenta</SectionLabel>
              <h1 className="font-display text-3xl font-bold text-espresso mt-2">Consultar lista de compras</h1>
              <p className="text-sm text-warm-gray mt-1">
                Elige tus platos y para cuántas personas; generamos la lista de ingredientes.
              </p>
            </div>
            <Link
              to="/cuenta"
              className="text-sm font-medium text-espresso/80 hover:text-terracotta border border-espresso/15 hover:border-terracotta/50 rounded-full px-4 py-2 transition-colors whitespace-nowrap"
            >
              ← Volver a mi cuenta
            </Link>
          </div>

          {error && (
            <div className="mb-4 text-sm text-primary-700 bg-primary-50 border border-primary-200 rounded-lg px-4 py-2">
              {error}
            </div>
          )}

          {/* Paso 1 · Platos */}
          <section className="mb-6">
            <h2 className="font-display text-xl font-bold text-espresso mb-1">1. Elige tus platos</h2>
            <p className="text-sm text-warm-gray mb-3">
              {seleccionados.length} {seleccionados.length === 1 ? 'plato seleccionado' : 'platos seleccionados'}
            </p>

            {loading ? (
              <p className="text-warm-gray text-sm py-8 text-center">Cargando platos…</p>
            ) : platos.length === 0 ? (
              <p className="text-warm-gray text-sm py-6">No hay platos disponibles por ahora.</p>
            ) : (
              <div className="space-y-5">
                {grupos.map(({ cat, items }) => (
                  <div key={cat}>
                    <h3 className="font-display text-sm font-bold text-terracotta mb-2">{cat}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {items.map((p) => {
                        const sel = seleccionados.includes(p.id)
                        return (
                          <button
                            key={p.id}
                            onClick={() => toggle(p.id)}
                            aria-pressed={sel}
                            className={`text-left rounded-xl border p-3 transition-all ${
                              sel
                                ? 'border-terracotta bg-amber/10 ring-1 ring-terracotta'
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
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none'
                                  }}
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
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Paso 2 · Personas */}
          <section className="mb-6">
            <h2 className="font-display text-xl font-bold text-espresso mb-2">2. ¿Para cuántas personas?</h2>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Número de personas">
              {OPCIONES_PERSONAS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => onElegirPersonas(n)}
                  aria-pressed={personas === n}
                  className={`min-w-[3rem] rounded-full px-4 py-2 text-sm font-semibold border transition-colors ${
                    personas === n
                      ? 'bg-terracotta text-ivory border-terracotta'
                      : 'bg-background-surface text-espresso border-espresso/15 hover:border-terracotta/50'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </section>

          {/* Generar */}
          <button
            onClick={generar}
            disabled={!seleccionados.length || generando}
            className="bg-terracotta text-ivory font-semibold rounded-full px-6 py-3 text-sm hover:bg-ember transition-colors disabled:opacity-50"
          >
            {generando ? 'Generando…' : base ? 'Actualizar lista' : 'Generar lista de compras'}
          </button>

          {/* Resultado */}
          {base && (
            <section className="mt-8">
              <h2 className="font-display text-xl font-bold text-espresso mb-1">Tu lista de compras</h2>
              <p className="text-sm text-warm-gray mb-4">
                Ingredientes para {platosElegidos.length}{' '}
                {platosElegidos.length === 1 ? 'plato' : 'platos'}, ajustados a {personas}{' '}
                {personas === 1 ? 'persona' : 'personas'}.
              </p>

              {lista.length === 0 ? (
                <p className="text-warm-gray text-sm py-6">
                  Los platos elegidos aún no tienen ingredientes registrados.
                </p>
              ) : (
                <>
                  <div className="rounded-2xl border border-espresso/10 overflow-hidden mb-4 bg-background-surface">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-warm-gray bg-background-warm border-b border-espresso/10">
                          <th className="px-4 py-2.5 font-medium">Ingrediente</th>
                          <th className="px-4 py-2.5 font-medium w-28">Cantidad</th>
                          <th className="px-4 py-2.5 font-medium w-20">Unidad</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lista.map((row, i) => (
                          <tr key={`${row.nombre}-${row.unidad}-${i}`} className="border-b border-espresso/5 last:border-0">
                            <td className="px-4 py-2 text-espresso">{row.nombre}</td>
                            <td className="px-4 py-2 text-espresso font-medium">{row.cantidad}</td>
                            <td className="px-4 py-2 text-warm-gray">{row.unidad || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <button onClick={descargarLista} className="text-sm text-terracotta hover:underline">
                    ⬇ Descargar lista
                  </button>
                </>
              )}
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
