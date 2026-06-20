import { useEffect, useState } from 'react'
import { getIngredientesDePlatos } from '../../lib/publicApi'

function escHtml(s) {
  return String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
}

/**
 * Paso exclusivo de Cocinera a Domicilio.
 * Genera AUTOMÁTICAMENTE una lista de compras consolidada a partir de los platos
 * elegidos (GET /api/platos/ingredientes). Es EDITABLE en cantidades (no se
 * pueden eliminar ingredientes) y se guarda en el estado del flujo.
 */
export default function ShoppingList({ data, update, onNext, onBack, platosSeleccionados }) {
  const ids = platosSeleccionados ?? data?.platos ?? []
  const [lista, setLista] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    getIngredientesDePlatos(ids)
      .then((ingredientes) => {
        if (!active) return
        // Preservar ediciones previas (match por nombre+unidad) si existen.
        const previas = data?.lista_compras || []
        const merged = ingredientes.map((ing) => {
          const prev = previas.find(
            (p) => p.nombre === ing.nombre && (p.unidad || '') === (ing.unidad || '')
          )
          return {
            nombre: ing.nombre,
            cantidad: prev ? prev.cantidad : ing.cantidad_total,
            unidad: ing.unidad || '',
          }
        })
        setLista(merged)
        update({ lista_compras: merged })
      })
      .catch(() => active && setError('No pudimos generar la lista de compras. Intenta más tarde.'))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
    // Regenerar si cambia el conjunto de platos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(',')])

  const setCantidad = (i, value) => {
    const next = lista.map((row, idx) => (idx === i ? { ...row, cantidad: value } : row))
    setLista(next)
    update({ lista_compras: next })
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
      <p>Ingredientes para tus 5 preparaciones</p>
      <table>${filas}</table>
      <script>window.onload=function(){window.print()}</script>
      </body></html>`
    )
    win.document.close()
  }

  return (
    <div>
      <h2 className="font-display text-2xl font-bold text-espresso mb-1">Tu lista de compras</h2>
      <p className="text-warm-gray text-sm mb-5">
        Generada de tus platos. Ajusta las cantidades que necesites; la usaremos al cocinar en tu hogar.
      </p>

      {loading ? (
        <p className="text-warm-gray text-sm py-8 text-center">Generando lista…</p>
      ) : error ? (
        <p className="text-primary-600 text-sm py-6">{error}</p>
      ) : lista.length === 0 ? (
        <p className="text-warm-gray text-sm py-6">
          Los platos elegidos aún no tienen ingredientes registrados. Puedes continuar y los coordinamos contigo.
        </p>
      ) : (
        <>
          <div className="rounded-2xl border border-espresso/10 overflow-hidden mb-4">
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
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={row.cantidad}
                        onChange={(e) => setCantidad(i, e.target.value)}
                        aria-label={`Cantidad de ${row.nombre}`}
                        className="w-24 rounded-lg border border-espresso/15 bg-background px-2 py-1.5 text-sm text-espresso focus:outline-none focus:border-terracotta/60"
                      />
                    </td>
                    <td className="px-4 py-2 text-warm-gray">{row.unidad || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button onClick={descargarLista} className="text-sm text-terracotta hover:underline mb-2">
            ⬇ Descargar lista
          </button>
        </>
      )}

      <div className="flex justify-between mt-4">
        <button onClick={onBack} className="text-warm-gray hover:text-espresso px-4 py-3">
          ← Atrás
        </button>
        <button
          onClick={onNext}
          className="bg-terracotta text-ivory font-semibold rounded-full px-6 py-3 hover:bg-ember transition-colors"
        >
          Continuar
        </button>
      </div>
    </div>
  )
}
