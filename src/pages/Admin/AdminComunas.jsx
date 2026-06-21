import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import { fmtCLP } from '../../components/admin/adminHelpers'
import {
  getComunas,
  crearComuna,
  editarComuna,
  eliminarComuna,
  ApiError,
} from '../../lib/adminApi'

/**
 * AdminComunas · gestiona la cobertura y el costo de despacho POR comuna.
 * El flujo de pedido lee estas comunas y cobra el despacho según la elegida.
 */
export default function AdminComunas() {
  const navigate = useNavigate()
  const [comunas, setComunas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)

  // Formulario de alta
  const [nombre, setNombre] = useState('')
  const [costo, setCosto] = useState(3000)
  const [mealPrep, setMealPrep] = useState(true)
  const [cocinera, setCocinera] = useState(true)

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
      const data = await getComunas({ todos: true })
      setComunas((data.comunas || []).map((c) => ({ ...c, _dirty: false })))
    } catch (err) {
      if (!handle401(err)) setError(err.message || 'No se pudieron cargar las comunas.')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate])

  useEffect(() => {
    cargar()
  }, [cargar])

  const onAgregar = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setMsg('')
    try {
      await crearComuna({
        nombre,
        costo_despacho: Number(costo),
        activo: true,
        meal_prep: mealPrep,
        cocinera: cocinera,
      })
      setMsg(`Comuna "${nombre.trim()}" guardada.`)
      setNombre('')
      setCosto(3000)
      setMealPrep(true)
      setCocinera(true)
      await cargar()
    } catch (err) {
      if (!handle401(err)) setError(err.message || 'No se pudo guardar la comuna.')
    } finally {
      setSaving(false)
    }
  }

  // Edición inline de una fila
  const setCampo = (id, campo, valor) => {
    setComunas((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [campo]: valor, _dirty: true } : c))
    )
  }

  const onGuardarFila = async (c) => {
    setError('')
    setMsg('')
    try {
      await editarComuna(c.id, {
        nombre: c.nombre,
        costo_despacho: Number(c.costo_despacho),
        activo: c.activo,
        meal_prep: c.meal_prep,
        cocinera: c.cocinera,
      })
      setComunas((prev) => prev.map((x) => (x.id === c.id ? { ...x, _dirty: false } : x)))
      setMsg(`Comuna "${c.nombre}" actualizada.`)
    } catch (err) {
      if (!handle401(err)) setError(err.message || 'No se pudo actualizar la comuna.')
    }
  }

  const onEliminar = async (c) => {
    if (!window.confirm(`¿Eliminar la comuna "${c.nombre}"? Dejará de aparecer en el flujo de pedido.`)) return
    setError('')
    setMsg('')
    try {
      await eliminarComuna(c.id)
      setComunas((prev) => prev.filter((x) => x.id !== c.id))
      setMsg(`Comuna "${c.nombre}" eliminada.`)
    } catch (err) {
      if (!handle401(err)) setError(err.message || 'No se pudo eliminar la comuna.')
    }
  }

  const inputCls =
    'rounded-xl border border-espresso/15 bg-background px-3 py-2 text-sm text-espresso focus:outline-none focus:border-terracotta/60'

  return (
    <AdminLayout title="Comunas">
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

      {/* Alta */}
      <form
        onSubmit={onAgregar}
        className="bg-background-surface border border-espresso/10 rounded-2xl p-5 mb-6 flex flex-wrap items-end gap-4"
      >
        <label className="text-sm flex-1 min-w-[180px]">
          <span className="block text-espresso font-medium mb-1">Comuna</span>
          <input
            className={inputCls + ' w-full'}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Providencia"
            required
          />
        </label>
        <label className="text-sm">
          <span className="block text-espresso font-medium mb-1">Costo despacho ($)</span>
          <input
            type="number"
            min={0}
            step={500}
            className={inputCls + ' w-40'}
            value={costo}
            onChange={(e) => setCosto(e.target.value)}
            required
          />
        </label>
        <div className="text-sm">
          <span className="block text-espresso font-medium mb-1">Disponible en</span>
          <div className="flex items-center gap-4 h-[42px]">
            <label className="inline-flex items-center gap-2 text-warm-gray">
              <input type="checkbox" checked={mealPrep} onChange={(e) => setMealPrep(e.target.checked)} />
              Meal Prep
            </label>
            <label className="inline-flex items-center gap-2 text-warm-gray">
              <input type="checkbox" checked={cocinera} onChange={(e) => setCocinera(e.target.checked)} />
              Cocinera
            </label>
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="bg-terracotta text-ivory font-semibold rounded-full px-5 py-2.5 text-sm hover:bg-ember transition-colors disabled:opacity-50"
        >
          {saving ? 'Guardando…' : 'Agregar comuna'}
        </button>
      </form>

      {/* Tabla */}
      <div className="bg-background-surface border border-espresso/10 rounded-2xl overflow-hidden">
        {loading ? (
          <p className="px-5 py-8 text-center text-warm-gray text-sm">Cargando…</p>
        ) : comunas.length === 0 ? (
          <p className="px-5 py-8 text-center text-warm-gray text-sm">No hay comunas configuradas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-warm-gray border-b border-espresso/10">
                  <th className="px-5 py-3 font-medium">Comuna</th>
                  <th className="px-5 py-3 font-medium">Costo despacho</th>
                  <th className="px-5 py-3 font-medium">Meal Prep</th>
                  <th className="px-5 py-3 font-medium">Cocinera</th>
                  <th className="px-5 py-3 font-medium">Activa</th>
                  <th className="px-5 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {comunas.map((c) => (
                  <tr key={c.id} className="border-b border-espresso/5 last:border-0">
                    <td className="px-5 py-2.5">
                      <input
                        className={inputCls + ' w-full max-w-[220px]'}
                        value={c.nombre}
                        onChange={(e) => setCampo(c.id, 'nombre', e.target.value)}
                      />
                    </td>
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          step={500}
                          className={inputCls + ' w-28'}
                          value={c.costo_despacho}
                          onChange={(e) => setCampo(c.id, 'costo_despacho', e.target.value)}
                        />
                        <span className="text-xs text-warm-gray">{fmtCLP(c.costo_despacho)}</span>
                      </div>
                    </td>
                    <td className="px-5 py-2.5">
                      <input
                        type="checkbox"
                        checked={c.meal_prep}
                        onChange={(e) => setCampo(c.id, 'meal_prep', e.target.checked)}
                        aria-label={`${c.nombre} disponible en Meal Prep`}
                      />
                    </td>
                    <td className="px-5 py-2.5">
                      <input
                        type="checkbox"
                        checked={c.cocinera}
                        onChange={(e) => setCampo(c.id, 'cocinera', e.target.checked)}
                        aria-label={`${c.nombre} disponible en Cocinera`}
                      />
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
                          aria-label={`Eliminar ${c.nombre}`}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
