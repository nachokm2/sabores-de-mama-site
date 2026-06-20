import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import { fmtFecha, todayStr } from '../../components/admin/adminHelpers'
import { getCupos, guardarCupo, ApiError } from '../../lib/adminApi'

/**
 * AdminCupos · configurar fechas y capacidades máximas.
 * Formulario de alta/edición (upsert por fecha) + tabla de todas las fechas con
 * su ocupación. Hacer clic en una fila la carga en el formulario para editarla.
 */
export default function AdminCupos() {
  const navigate = useNavigate()
  const [cupos, setCupos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)
  const [fecha, setFecha] = useState('')
  const [capacidad, setCapacidad] = useState(5)
  const [activo, setActivo] = useState(true)

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
      const data = await getCupos({ todos: true })
      setCupos(data.cupos || [])
    } catch (err) {
      if (!handle401(err)) setError(err.message || 'No se pudieron cargar los cupos.')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate])

  useEffect(() => {
    cargar()
  }, [cargar])

  const onGuardar = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setMsg('')
    try {
      await guardarCupo({
        fecha,
        capacidad_maxima: Number(capacidad),
        activo,
      })
      setMsg(`Cupo del ${fmtFecha(fecha)} guardado.`)
      setFecha('')
      setCapacidad(5)
      setActivo(true)
      await cargar()
    } catch (err) {
      if (!handle401(err)) setError(err.message || 'No se pudo guardar el cupo.')
    } finally {
      setSaving(false)
    }
  }

  const onEditar = (c) => {
    setFecha(String(c.fecha).slice(0, 10))
    setCapacidad(c.capacidad_maxima)
    setActivo(c.activo)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const inputCls =
    'rounded-xl border border-espresso/15 bg-background px-3 py-2 text-sm text-espresso focus:outline-none focus:border-terracotta/60'

  const hoy = todayStr()

  return (
    <AdminLayout title="Cupos">
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

      {/* Formulario */}
      <form
        onSubmit={onGuardar}
        className="bg-background-surface border border-espresso/10 rounded-2xl p-5 mb-6 flex flex-wrap items-end gap-4"
      >
        <label className="text-sm">
          <span className="block text-espresso font-medium mb-1">Fecha</span>
          <input type="date" className={inputCls} value={fecha} onChange={(e) => setFecha(e.target.value)} required />
        </label>
        <label className="text-sm">
          <span className="block text-espresso font-medium mb-1">Capacidad máxima</span>
          <input
            type="number"
            min={0}
            className={inputCls + ' w-32'}
            value={capacidad}
            onChange={(e) => setCapacidad(e.target.value)}
            required
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-espresso pb-2">
          <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
          Activo
        </label>
        <button
          type="submit"
          disabled={saving}
          className="bg-terracotta text-ivory font-semibold rounded-full px-5 py-2.5 text-sm hover:bg-ember transition-colors disabled:opacity-50"
        >
          {saving ? 'Guardando…' : 'Guardar cupo'}
        </button>
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
                  <th className="px-5 py-3 font-medium">Estado</th>
                  <th className="px-5 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {cupos.map((c) => {
                  const fechaStr = String(c.fecha).slice(0, 10)
                  const pasada = fechaStr <= hoy
                  const lleno = c.disponibles <= 0
                  return (
                    <tr key={c.id} className="border-b border-espresso/5 last:border-0">
                      <td className="px-5 py-3 text-espresso font-medium">
                        {fmtFecha(c.fecha)}
                        {pasada && <span className="ml-2 text-xs text-warm-gray">(pasada)</span>}
                      </td>
                      <td className="px-5 py-3 text-warm-gray">{c.capacidad_maxima}</td>
                      <td className="px-5 py-3 text-warm-gray">{c.pedidos_confirmados}</td>
                      <td className={`px-5 py-3 font-semibold ${lleno ? 'text-primary-600' : 'text-[#15803D]'}`}>
                        {c.disponibles}
                      </td>
                      <td className="px-5 py-3">
                        {c.activo ? (
                          <span className="text-xs text-[#15803D] bg-[#15803D]/10 border border-[#15803D]/30 px-2 py-0.5 rounded-full">
                            Activo
                          </span>
                        ) : (
                          <span className="text-xs text-warm-gray bg-espresso/[0.06] px-2 py-0.5 rounded-full">
                            Inactivo
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <button onClick={() => onEditar(c)} className="text-sm text-terracotta hover:underline">
                          Editar
                        </button>
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
