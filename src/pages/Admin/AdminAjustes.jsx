import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import { fmtCLP } from '../../components/admin/adminHelpers'
import { getServiciosConfig, editarServicioConfig, recargarCatalogo, ApiError } from '../../lib/adminApi'

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
  const esMealPrep = servicio === 'meal_prep'
  const [precio, setPrecio] = useState('')
  const [ingredientes, setIngredientes] = useState('')
  const [porcionado, setPorcionado] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  // Recarga del catálogo completo (acción destructiva con confirmación).
  const [confirmCat, setConfirmCat] = useState('')
  const [recargando, setRecargando] = useState(false)
  const [catMsg, setCatMsg] = useState('')
  const [catError, setCatError] = useState('')

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
      setIngredientes(actual?.costo_ingredientes != null ? String(actual.costo_ingredientes) : '')
      setPorcionado(actual?.costo_porcionado != null ? String(actual.costo_porcionado) : '')
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
      const payload = { precio_base: Number(precio) }
      if (esMealPrep) {
        payload.costo_ingredientes = Number(ingredientes)
        payload.costo_porcionado = Number(porcionado)
      }
      await editarServicioConfig(servicio, payload)
      setMsg(esMealPrep ? 'Ajustes actualizados.' : 'Precio base actualizado.')
    } catch (err) {
      if (!handle401(err)) setError(err.message || 'No se pudieron guardar los ajustes.')
    } finally {
      setSaving(false)
    }
  }

  const onRecargar = async () => {
    setRecargando(true)
    setCatMsg('')
    setCatError('')
    try {
      const { resumen } = await recargarCatalogo(confirmCat)
      setConfirmCat('')
      const cats = Object.entries(resumen.porCategoria || {})
        .map(([c, n]) => `${c}: ${n}`)
        .join(' · ')
      setCatMsg(
        `Catálogo recargado: ${resumen.totalPlatos} platos ` +
          `(Meal Prep ${resumen.porServicio.meal_prep} · Cocinera ${resumen.porServicio.cocinera}). ${cats}`
      )
    } catch (err) {
      if (!handle401(err)) setCatError(err.message || 'No se pudo recargar el catálogo.')
    } finally {
      setRecargando(false)
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
          className="bg-background-surface border border-espresso/10 rounded-2xl p-5 max-w-xl"
        >
          <div className="flex flex-wrap items-end gap-4">
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
          </div>

          {esMealPrep && (
            <>
              <p className="text-sm font-medium text-espresso mt-6 mb-2">Servicios adicionales</p>
              <p className="text-xs text-warm-gray mb-3">
                Costos opcionales que el cliente puede sumar en el flujo de pedido.
              </p>
              <div className="flex flex-wrap items-end gap-4">
                <label className="text-sm flex-1 min-w-[200px]">
                  <span className="block text-espresso font-medium mb-1">
                    Compra de ingredientes ($)
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    className={inputCls + ' w-full'}
                    value={ingredientes}
                    onChange={(e) => setIngredientes(e.target.value)}
                    required
                  />
                  <span className="block text-xs text-warm-gray mt-1">{fmtCLP(ingredientes)}</span>
                </label>
                <label className="text-sm flex-1 min-w-[200px]">
                  <span className="block text-espresso font-medium mb-1">Platos porcionados ($)</span>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    className={inputCls + ' w-full'}
                    value={porcionado}
                    onChange={(e) => setPorcionado(e.target.value)}
                    required
                  />
                  <span className="block text-xs text-warm-gray mt-1">{fmtCLP(porcionado)}</span>
                </label>
              </div>
            </>
          )}

          <div className="mt-6">
            <button
              type="submit"
              disabled={saving}
              className="bg-terracotta text-ivory font-semibold rounded-full px-5 py-2.5 text-sm hover:bg-ember transition-colors disabled:opacity-50"
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      )}

      {/* Zona de recarga del catálogo completo (destructivo). */}
      <div className="mt-10 max-w-xl bg-primary-50 border border-primary-200 rounded-2xl p-5">
        <h2 className="font-display text-base font-bold text-primary-700 mb-1">
          Recargar catálogo de platos
        </h2>
        <p className="text-sm text-warm-gray mb-3">
          Reemplaza <strong>todos los platos</strong> (Meal Prep y Cocinera) por el catálogo
          oficial del documento. No afecta pedidos ni cupos. Esta acción no se puede deshacer:
          escribe <strong>REEMPLAZAR</strong> para habilitar el botón.
        </p>

        {catMsg && (
          <div className="mb-3 text-sm text-[#15803D] bg-[#15803D]/10 border border-[#15803D]/30 rounded-lg px-4 py-2">
            {catMsg}
          </div>
        )}
        {catError && (
          <div className="mb-3 text-sm text-primary-700 bg-primary-100 border border-primary-200 rounded-lg px-4 py-2">
            {catError}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <input
            className={inputCls + ' w-44'}
            value={confirmCat}
            onChange={(e) => setConfirmCat(e.target.value)}
            placeholder="Escribe REEMPLAZAR"
            aria-label="Confirmación para recargar el catálogo"
          />
          <button
            type="button"
            onClick={onRecargar}
            disabled={recargando || confirmCat.trim().toUpperCase() !== 'REEMPLAZAR'}
            className="bg-primary-600 text-ivory font-semibold rounded-full px-5 py-2.5 text-sm hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {recargando ? 'Recargando…' : 'Recargar catálogo'}
          </button>
        </div>
      </div>
    </AdminLayout>
  )
}
