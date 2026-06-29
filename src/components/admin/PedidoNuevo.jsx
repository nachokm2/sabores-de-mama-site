import { useEffect, useMemo, useState } from 'react'
import { fmtCLP } from './adminHelpers'
import { crearPedidoAdmin, getServiciosConfig, ApiError } from '../../lib/adminApi'

const inputCls =
  'w-full rounded-lg border border-espresso/15 bg-background px-3 py-2 text-sm text-espresso focus:outline-none focus:border-terracotta/60'

const SERVICIO_LABEL = { meal_prep: 'Meal Prep', cocinera: 'Cocinera a Domicilio' }

/**
 * Alta MANUAL de una reserva desde el panel admin (todos los campos). El
 * servicio viene del contexto (/admin/:servicio/...). Sugiere el total
 * (precio base + despacho) pero el admin puede ajustarlo.
 */
export default function PedidoNuevo({ servicio, platosCatalogo = [], comunas = [], onCreated, onCancel, onError, on401 }) {
  const esCocinera = servicio === 'cocinera'
  const [saving, setSaving] = useState(false)
  const [basePrecio, setBasePrecio] = useState(0)
  const [totalManual, setTotalManual] = useState(false)
  const [platosIds, setPlatosIds] = useState(() => new Set())
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    telefono: '',
    direccion: '',
    comuna: '',
    fecha_entrega: '',
    tipo_entrega: 'delivery',
    personas: 2,
    restricciones: '',
    observaciones: '',
    costo_despacho: 0,
    total: 0,
    enviar_correo: false,
  })

  const setCampo = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  // Precio base del servicio (para sugerir el total).
  useEffect(() => {
    getServiciosConfig()
      .then((d) => setBasePrecio(Number(d?.config?.[servicio]?.precio_base) || 0))
      .catch(() => {})
  }, [servicio])

  // Sugerencia de total = base + despacho (mientras el admin no lo edite a mano).
  useEffect(() => {
    if (totalManual) return
    const despacho = form.tipo_entrega === 'delivery' ? Number(form.costo_despacho) || 0 : 0
    setForm((f) => ({ ...f, total: basePrecio + despacho }))
  }, [basePrecio, form.costo_despacho, form.tipo_entrega, totalManual])

  const onComuna = (nombre) => {
    const c = comunas.find((x) => x.nombre === nombre)
    const costo = c ? Number(c.costo_despacho) || 0 : 0
    setForm((f) => ({
      ...f,
      comuna: nombre,
      costo_despacho: f.tipo_entrega === 'delivery' ? costo : f.costo_despacho,
    }))
  }

  const onTipo = (t) => {
    setForm((f) => {
      if (t === 'retiro') return { ...f, tipo_entrega: t, costo_despacho: 0 }
      const c = comunas.find((x) => x.nombre === f.comuna)
      return { ...f, tipo_entrega: t, costo_despacho: c ? Number(c.costo_despacho) || 0 : f.costo_despacho }
    })
  }

  const catalogoOrdenado = useMemo(
    () =>
      [...platosCatalogo].sort(
        (a, b) => (a.categoria || '').localeCompare(b.categoria || '') || a.nombre.localeCompare(b.nombre)
      ),
    [platosCatalogo]
  )

  const togglePlato = (id) => {
    setPlatosIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const onGuardar = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const platosSel = catalogoOrdenado
        .filter((p) => platosIds.has(p.id))
        .map((p) => ({ id: p.id, nombre: p.nombre }))
      const restricciones = form.restricciones
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)

      const { pedido } = await crearPedidoAdmin({
        servicio,
        nombre: form.nombre.trim(),
        email: form.email.trim(),
        telefono: form.telefono.trim() || null,
        direccion: form.direccion.trim() || null,
        comuna: form.comuna || null,
        fecha_entrega: form.fecha_entrega,
        tipo_entrega: form.tipo_entrega,
        platos: platosSel,
        restricciones,
        observaciones: form.observaciones.trim() || null,
        costo_despacho: Number(form.costo_despacho) || 0,
        total: Number(form.total) || 0,
        personas: esCocinera ? Number(form.personas) || null : null,
        enviar_correo: form.enviar_correo,
      })
      onCreated?.(pedido)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return on401?.()
      onError?.(err.message || 'No se pudo crear la reserva.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={onGuardar} className="bg-background-surface border border-terracotta/30 rounded-2xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-bold text-espresso">
          Nueva reserva · {SERVICIO_LABEL[servicio] || servicio}
        </h2>
        <button type="button" onClick={onCancel} className="text-sm text-warm-gray hover:text-espresso">
          ✕ Cerrar
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <label className="text-sm">
          <span className="block text-warm-gray mb-1">Nombre *</span>
          <input className={inputCls} value={form.nombre} onChange={(e) => setCampo('nombre', e.target.value)} required />
        </label>
        <label className="text-sm">
          <span className="block text-warm-gray mb-1">Email *</span>
          <input type="email" className={inputCls} value={form.email} onChange={(e) => setCampo('email', e.target.value)} required />
        </label>
        <label className="text-sm">
          <span className="block text-warm-gray mb-1">Teléfono</span>
          <input className={inputCls} value={form.telefono} onChange={(e) => setCampo('telefono', e.target.value)} placeholder="+56 9 ..." />
        </label>
        <label className="text-sm lg:col-span-2">
          <span className="block text-warm-gray mb-1">Dirección</span>
          <input className={inputCls} value={form.direccion} onChange={(e) => setCampo('direccion', e.target.value)} placeholder="Calle, número, depto…" />
        </label>
        <label className="text-sm">
          <span className="block text-warm-gray mb-1">Comuna</span>
          <select className={inputCls} value={form.comuna} onChange={(e) => onComuna(e.target.value)}>
            <option value="">—</option>
            {comunas.map((c) => (
              <option key={c.id ?? c.nombre} value={c.nombre}>{c.nombre}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="block text-warm-gray mb-1">Fecha de entrega *</span>
          <input type="date" className={inputCls} value={form.fecha_entrega} onChange={(e) => setCampo('fecha_entrega', e.target.value)} required />
        </label>
        <label className="text-sm">
          <span className="block text-warm-gray mb-1">Tipo de entrega</span>
          <select className={inputCls} value={form.tipo_entrega} onChange={(e) => onTipo(e.target.value)}>
            <option value="delivery">Delivery</option>
            <option value="retiro">Retiro</option>
          </select>
        </label>
        {esCocinera && (
          <label className="text-sm">
            <span className="block text-warm-gray mb-1">Personas</span>
            <select className={inputCls} value={form.personas} onChange={(e) => setCampo('personas', Number(e.target.value))}>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
        )}
        <label className="text-sm">
          <span className="block text-warm-gray mb-1">Costo despacho ($)</span>
          <input
            type="number"
            min={0}
            className={inputCls}
            value={form.costo_despacho}
            onChange={(e) => setCampo('costo_despacho', e.target.value)}
          />
        </label>
        <label className="text-sm">
          <span className="block text-warm-gray mb-1">Total ($)</span>
          <input
            type="number"
            min={0}
            className={inputCls}
            value={form.total}
            onChange={(e) => {
              setTotalManual(true)
              setCampo('total', e.target.value)
            }}
          />
          <span className="block text-2xs text-warm-gray mt-1">Sugerido: {fmtCLP(form.total)}</span>
        </label>
      </div>

      {/* Platos */}
      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-warm-gray mb-1">
          Platos ({platosIds.size} seleccionados)
        </p>
        <div className="max-h-48 overflow-y-auto rounded-lg border border-espresso/10 p-2 grid sm:grid-cols-2 gap-1">
          {catalogoOrdenado.map((p) => (
            <label key={p.id} className="flex items-center gap-2 text-sm text-espresso px-1 py-0.5 rounded hover:bg-espresso/[0.04]">
              <input type="checkbox" checked={platosIds.has(p.id)} onChange={() => togglePlato(p.id)} />
              <span className="truncate">{p.nombre}</span>
              {p.categoria && <span className="text-[11px] text-warm-gray ml-auto">{p.categoria}</span>}
            </label>
          ))}
          {catalogoOrdenado.length === 0 && <p className="text-warm-gray text-sm">No hay platos en el catálogo.</p>}
        </div>
      </div>

      {/* Restricciones + observaciones */}
      <div className="grid sm:grid-cols-2 gap-3 mt-3">
        <label className="text-sm">
          <span className="block text-warm-gray mb-1">Restricciones <span className="font-normal">(separadas por coma)</span></span>
          <input className={inputCls} value={form.restricciones} onChange={(e) => setCampo('restricciones', e.target.value)} placeholder="Sin gluten, sin lactosa…" />
        </label>
        <label className="text-sm">
          <span className="block text-warm-gray mb-1">Observaciones</span>
          <input className={inputCls} value={form.observaciones} onChange={(e) => setCampo('observaciones', e.target.value)} />
        </label>
      </div>

      <label className="flex items-center gap-2 mt-4 text-sm text-espresso">
        <input type="checkbox" checked={form.enviar_correo} onChange={(e) => setCampo('enviar_correo', e.target.checked)} />
        Enviar correo de confirmación al cliente
      </label>

      <div className="mt-4 flex items-center justify-end gap-3">
        <button type="button" onClick={onCancel} className="text-sm text-warm-gray hover:text-espresso px-3">
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="bg-terracotta text-ivory font-semibold rounded-full px-5 py-2.5 text-sm hover:bg-ember transition-colors disabled:opacity-50"
        >
          {saving ? 'Creando…' : 'Crear reserva'}
        </button>
      </div>
    </form>
  )
}
