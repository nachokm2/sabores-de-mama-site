import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import { fmtFecha, todayStr } from '../../components/admin/adminHelpers'
import {
  getCupos,
  guardarCupo,
  guardarCuposBulk,
  eliminarCupo,
  ApiError,
} from '../../lib/adminApi'

const DIAS = [
  { dow: 1, label: 'Lun' }, { dow: 2, label: 'Mar' }, { dow: 3, label: 'Mié' },
  { dow: 4, label: 'Jue' }, { dow: 5, label: 'Vie' }, { dow: 6, label: 'Sáb' }, { dow: 0, label: 'Dom' },
]

function ymd(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Genera las fechas entre desde y hasta (inclusive), filtradas por días de semana.
function generarFechas(desde, hasta, dias) {
  if (!desde) return []
  const out = []
  const d = new Date(desde + 'T00:00:00')
  const end = new Date((hasta || desde) + 'T00:00:00')
  let guard = 0
  while (d <= end && guard < 366) {
    if (!dias.size || dias.has(d.getDay())) out.push(ymd(d))
    d.setDate(d.getDate() + 1)
    guard++
  }
  return out
}

/**
 * AdminCupos · crea fechas (una o en lote por rango + días de semana), edita la
 * capacidad/estado en la misma fila y permite eliminar fechas.
 */
export default function AdminCupos() {
  const navigate = useNavigate()
  const { servicio } = useParams()
  const [cupos, setCupos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)

  // Formulario de creación
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [capacidad, setCapacidad] = useState(5)
  const [dias, setDias] = useState(new Set())

  const handle401 = (err) => {
    if (err instanceof ApiError && err.status === 401) {
      navigate('/admin/login', { replace: true })
      return true
    }
    return false
  }

  const cargar = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getCupos({ todos: true, servicio })
      setCupos((data.cupos || []).map((c) => ({ ...c, _dirty: false })))
    } catch (err) {
      if (!handle401(err)) setError(err.message || 'No se pudieron cargar los cupos.')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, servicio])

  useEffect(() => {
    cargar()
  }, [cargar])

  const toggleDia = (dow) => {
    setDias((prev) => {
      const next = new Set(prev)
      next.has(dow) ? next.delete(dow) : next.add(dow)
      return next
    })
  }

  const onCrear = async (e) => {
    e.preventDefault()
    setError('')
    setMsg('')
    const fechas = generarFechas(desde, hasta, dias)
    if (!fechas.length) {
      setError('Selecciona al menos una fecha válida.')
      return
    }
    setSaving(true)
    try {
      if (fechas.length === 1) {
        await guardarCupo({ fecha: fechas[0], capacidad_maxima: Number(capacidad), activo: true, servicio })
        setMsg(`Cupo del ${fmtFecha(fechas[0])} guardado.`)
      } else {
        await guardarCuposBulk({ fechas, capacidad_maxima: Number(capacidad), activo: true, servicio })
        setMsg(`${fechas.length} fechas creadas/actualizadas.`)
      }
      setDesde('')
      setHasta('')
      setCapacidad(5)
      setDias(new Set())
      await cargar()
    } catch (err) {
      if (!handle401(err)) setError(err.message || 'No se pudieron crear los cupos.')
    } finally {
      setSaving(false)
    }
  }

  const setCampo = (id, campo, valor) => {
    setCupos((prev) => prev.map((c) => (c.id === id ? { ...c, [campo]: valor, _dirty: true } : c)))
  }

  const onGuardarFila = async (c) => {
    setError('')
    setMsg('')
    try {
      await guardarCupo({
        fecha: String(c.fecha).slice(0, 10),
        capacidad_maxima: Number(c.capacidad_maxima),
        activo: c.activo,
        servicio,
      })
      setCupos((prev) => prev.map((x) => (x.id === c.id ? { ...x, _dirty: false } : x)))
      setMsg(`Cupo del ${fmtFecha(c.fecha)} actualizado.`)
    } catch (err) {
      if (!handle401(err)) setError(err.message || 'No se pudo actualizar el cupo.')
    }
  }

  const onEliminar = async (c) => {
    if (!window.confirm(`¿Eliminar la fecha ${fmtFecha(c.fecha)}?`)) return
    setError('')
    setMsg('')
    try {
      await eliminarCupo(c.id, servicio)
      setCupos((prev) => prev.filter((x) => x.id !== c.id))
      setMsg(`Fecha ${fmtFecha(c.fecha)} quitada de este servicio.`)
    } catch (err) {
      if (!handle401(err)) setError(err.message || 'No se pudo eliminar el cupo.')
    }
  }

  const inputCls =
    'rounded-xl border border-espresso/15 bg-background px-3 py-2 text-sm text-espresso focus:outline-none focus:border-terracotta/60'

  const hoy = todayStr()
  const previstas = generarFechas(desde, hasta, dias).length

  return (
    <AdminLayout title="Cupos">
      <p className="text-sm text-warm-gray -mt-3 mb-5">
        Capacidad por fecha de este servicio. Es independiente del otro servicio.
      </p>
      {msg && (
        <div className="mb-4 text-sm text-[#15803D] bg-[#15803D]/10 border border-[#15803D]/30 rounded-lg px-4 py-2">
          {msg}
        </div>
      )}
      {error && (
        <div className="mb-4 text-sm text-primary-700 bg-primary-50 border border-primary-200 rounded-lg px-4 py-2">
          {error}
        </div>
      )}

      {/* Crear (una o varias fechas) */}
      <form onSubmit={onCrear} className="bg-background-surface border border-espresso/10 rounded-2xl p-5 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <label className="text-sm">
            <span className="block text-espresso font-medium mb-1">Desde</span>
            <input type="date" className={inputCls} value={desde} onChange={(e) => setDesde(e.target.value)} required />
          </label>
          <label className="text-sm">
            <span className="block text-espresso font-medium mb-1">Hasta (opcional)</span>
            <input type="date" className={inputCls} value={hasta} min={desde} onChange={(e) => setHasta(e.target.value)} />
          </label>
          <label className="text-sm">
            <span className="block text-espresso font-medium mb-1">Capacidad</span>
            <input type="number" min={0} className={inputCls + ' w-28'} value={capacidad} onChange={(e) => setCapacidad(e.target.value)} required />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="bg-terracotta text-ivory font-semibold rounded-full px-5 py-2.5 text-sm hover:bg-ember transition-colors disabled:opacity-50"
          >
            {saving ? 'Guardando…' : previstas > 1 ? `Crear ${previstas} fechas` : 'Crear fecha'}
          </button>
        </div>

        {/* Días de la semana (sólo aplica si hay un rango "hasta") */}
        {hasta && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-sm text-warm-gray mr-1">Días:</span>
            {DIAS.map((d) => (
              <button
                key={d.dow}
                type="button"
                onClick={() => toggleDia(d.dow)}
                className={`text-xs font-medium rounded-full px-3 py-1.5 border transition-colors ${
                  dias.has(d.dow)
                    ? 'bg-terracotta text-ivory border-terracotta'
                    : 'border-espresso/15 text-warm-gray hover:border-terracotta/40'
                }`}
              >
                {d.label}
              </button>
            ))}
            <span className="text-xs text-warm-gray ml-1">
              {dias.size ? '' : '(todos los días si no eliges ninguno)'}
            </span>
          </div>
        )}
      </form>

      {/* Tabla */}
      <div className="bg-background-surface border border-espresso/10 rounded-2xl overflow-hidden">
        {loading ? (
          <p className="px-5 py-8 text-center text-warm-gray text-sm">Cargando…</p>
        ) : cupos.length === 0 ? (
          <p className="px-5 py-8 text-center text-warm-gray text-sm">No hay fechas configuradas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-warm-gray border-b border-espresso/10">
                  <th className="px-5 py-3 font-medium">Fecha</th>
                  <th className="px-5 py-3 font-medium">Capacidad</th>
                  <th className="px-5 py-3 font-medium">Confirmados</th>
                  <th className="px-5 py-3 font-medium">Disponibles</th>
                  <th className="px-5 py-3 font-medium">Activo</th>
                  <th className="px-5 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {cupos.map((c) => {
                  const fechaStr = String(c.fecha).slice(0, 10)
                  const pasada = fechaStr <= hoy
                  const disponibles = Number(c.capacidad_maxima) - Number(c.pedidos_confirmados)
                  const lleno = disponibles <= 0
                  return (
                    <tr key={c.id} className="border-b border-espresso/5 last:border-0">
                      <td className="px-5 py-2.5 text-espresso font-medium">
                        {fmtFecha(c.fecha)}
                        {pasada && <span className="ml-2 text-xs text-warm-gray">(pasada)</span>}
                      </td>
                      <td className="px-5 py-2.5">
                        <input
                          type="number"
                          min={0}
                          className={inputCls + ' w-24'}
                          value={c.capacidad_maxima}
                          onChange={(e) => setCampo(c.id, 'capacidad_maxima', e.target.value)}
                        />
                      </td>
                      <td className="px-5 py-2.5 text-warm-gray">{c.pedidos_confirmados}</td>
                      <td className={`px-5 py-2.5 font-semibold ${lleno ? 'text-primary-600' : 'text-[#15803D]'}`}>
                        {disponibles}
                      </td>
                      <td className="px-5 py-2.5">
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={c.activo}
                            onChange={(e) => setCampo(c.id, 'activo', e.target.checked)}
                          />
                          <span className="text-xs text-warm-gray">{c.activo ? 'Sí' : 'No'}</span>
                        </label>
                      </td>
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-3 justify-end">
                          <button
                            onClick={() => onGuardarFila(c)}
                            disabled={!c._dirty}
                            className="text-sm font-medium text-terracotta hover:underline disabled:text-warm-gray disabled:no-underline disabled:cursor-default"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={() => onEliminar(c)}
                            className="text-sm text-warm-gray hover:text-primary-600"
                            aria-label={`Eliminar ${fmtFecha(c.fecha)}`}
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
