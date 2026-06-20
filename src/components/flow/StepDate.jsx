import { useEffect, useState } from 'react'
import { getCupos } from '../../lib/publicApi'

function fmtFechaLarga(fecha) {
  const d = new Date(String(fecha).slice(0, 10) + 'T00:00:00')
  return {
    dia: d.toLocaleDateString('es-CL', { weekday: 'long' }),
    fecha: d.toLocaleDateString('es-CL', { day: 'numeric', month: 'long' }),
  }
}

/**
 * Paso 2 · Fecha de entrega. Carga los cupos disponibles desde la API y muestra
 * sólo las fechas con cupo. Las fechas sin cupo se muestran deshabilitadas.
 */
export default function StepDate({ data, update, onNext, onBack }) {
  const [cupos, setCupos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    getCupos()
      .then((lista) => {
        if (active) setCupos(lista)
      })
      .catch(() => {
        if (active) setError('No pudimos cargar las fechas disponibles. Intenta más tarde.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const seleccionar = (cupo) => {
    if (cupo.disponibles <= 0) return
    update({ fecha_entrega: String(cupo.fecha).slice(0, 10) })
  }

  return (
    <div>
      <h2 className="font-display text-2xl font-bold text-espresso mb-1">Elige la fecha de entrega</h2>
      <p className="text-warm-gray text-sm mb-6">Sólo mostramos las fechas con cupo disponible.</p>

      {loading ? (
        <p className="text-warm-gray text-sm py-8 text-center">Cargando fechas…</p>
      ) : error ? (
        <p className="text-primary-600 text-sm py-6">{error}</p>
      ) : cupos.length === 0 ? (
        <p className="text-warm-gray text-sm py-6">
          No hay fechas disponibles por ahora. Vuelve a intentarlo más tarde.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {cupos.map((c) => {
            const value = String(c.fecha).slice(0, 10)
            const disabled = c.disponibles <= 0
            const selected = data.fecha_entrega === value
            const { dia, fecha } = fmtFechaLarga(c.fecha)
            return (
              <button
                key={c.id}
                onClick={() => seleccionar(c)}
                disabled={disabled}
                aria-pressed={selected}
                className={`rounded-2xl border p-3 text-left transition-all ${
                  disabled
                    ? 'border-espresso/10 bg-espresso/[0.03] opacity-50 cursor-not-allowed'
                    : selected
                      ? 'border-terracotta bg-amber/10 ring-1 ring-terracotta'
                      : 'border-espresso/15 bg-background-surface hover:border-terracotta/50'
                }`}
              >
                <span className="block text-xs text-warm-gray capitalize">{dia}</span>
                <span className="block text-sm font-semibold text-espresso capitalize">{fecha}</span>
                <span className={`block text-2xs mt-1 ${disabled ? 'text-warm-gray' : 'text-[#15803D]'}`}>
                  {disabled ? 'Sin cupo' : `${c.disponibles} cupos`}
                </span>
              </button>
            )
          })}
        </div>
      )}

      <div className="flex justify-between">
        <button onClick={onBack} className="text-warm-gray hover:text-espresso px-4 py-3">
          ← Atrás
        </button>
        <button
          onClick={onNext}
          disabled={!data.fecha_entrega}
          className="bg-terracotta text-ivory font-semibold rounded-full px-6 py-3 hover:bg-ember transition-colors disabled:opacity-50"
        >
          Continuar
        </button>
      </div>
    </div>
  )
}
