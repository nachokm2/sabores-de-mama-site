import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import { fmtCLP } from '../../components/admin/adminHelpers'
import { getServiciosConfig, editarServicioConfig, ApiError } from '../../lib/adminApi'

const SERVICIO_LABEL = { meal_prep: 'Meal Prep', cocinera: 'Cocinera a Domicilio' }

/**
 * AdminAjustes · precio base del servicio (independiente por servicio).
 * Para Meal Prep es el valor del pack; para Cocinera a Domicilio es el valor
 * del servicio de la cocinera (los ingredientes los compra el cliente según la
 * lista). Lo que se cambie aquí sólo afecta a ESTE servicio.
 */
export default function AdminAjustes() {
  const navigate = useNavigate()
  const { servicio } = useParams()
  const [precio, setPrecio] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')

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
      const data = await getServiciosConfig()
      const actual = data?.config?.[servicio]
      setPrecio(actual ? String(actual.precio_base) : '')
    } catch (err) {
      if (!handle401(err)) setError(err.message || 'No se pudo cargar la configuración.')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, servicio])

  useEffect(() => {
    cargar()
  }, [cargar])

  const onGuardar = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setMsg('')
    try {
      await editarServicioConfig(servicio, { precio_base: Number(precio) })
      setMsg('Precio base actualizado.')
    } catch (err) {
      if (!handle401(err)) setError(err.message || 'No se pudo guardar el precio base.')
    } finally {
      setSaving(false)
    }
  }

  const inputCls =
    'rounded-xl border border-espresso/15 bg-background px-3 py-2 text-sm text-espresso focus:outline-none focus:border-terracotta/60'

  return (
    <AdminLayout title="Ajustes">
      <p className="text-sm text-warm-gray -mt-3 mb-5">
        Precio base de <strong>{SERVICIO_LABEL[servicio] || 'este servicio'}</strong>. Es
        independiente del otro servicio.
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

      {loading ? (
        <p className="text-warm-gray text-sm">Cargando…</p>
      ) : (
        <form
          onSubmit={onGuardar}
          className="bg-background-surface border border-espresso/10 rounded-2xl p-5 max-w-md flex flex-wrap items-end gap-4"
        >
          <label className="text-sm flex-1 min-w-[200px]">
            <span className="block text-espresso font-medium mb-1">Precio base ($)</span>
            <input
              type="number"
              min={0}
              step={500}
              className={inputCls + ' w-full'}
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              required
            />
            <span className="block text-xs text-warm-gray mt-1">{fmtCLP(precio)}</span>
          </label>
          <button
            type="submit"
            disabled={saving}
            className="bg-terracotta text-ivory font-semibold rounded-full px-5 py-2.5 text-sm hover:bg-ember transition-colors disabled:opacity-50"
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </form>
      )}
    </AdminLayout>
  )
}
