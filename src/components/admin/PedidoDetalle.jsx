import { useMemo, useState } from 'react'
import { fmtCLP, fmtFecha } from './adminHelpers'
import { editarPedido, ApiError } from '../../lib/adminApi'
import { imagenUrl } from '../../lib/publicApi'
import { fotosDePedido } from '../../lib/fotosPedido'

/**
 * Panel desplegable de un pedido: muestra TODO lo que pidió el cliente
 * (platos, dirección, restricciones, lista de compras, etc.) y permite
 * editarlo por completo, incluidos los platos.
 */
const inputCls =
  'w-full rounded-lg border border-espresso/15 bg-background px-3 py-2 text-sm text-espresso focus:outline-none focus:border-terracotta/60'

function platoNombre(p) {
  return typeof p === 'string' ? p : p?.nombre || ''
}

function Bloque({ titulo, children }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-warm-gray mb-1">{titulo}</p>
      {children}
    </div>
  )
}

export default function PedidoDetalle({ pedido, platosCatalogo = [], postresCatalogo = [], comunas = [], onSaved, onError, on401 }) {
  const [editando, setEditando] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(() => ({
    nombre: pedido.nombre || '',
    email: pedido.email || '',
    telefono: pedido.telefono || '',
    direccion: pedido.direccion || '',
    comuna: pedido.comuna || '',
    fecha_entrega: String(pedido.fecha_entrega || '').slice(0, 10),
    tipo_entrega: pedido.tipo_entrega || '',
    observaciones: pedido.observaciones || '',
    costo_despacho: Number(pedido.costo_despacho) || 0,
    total: Number(pedido.total) || 0,
    platosIds: new Set((pedido.platos || []).map((p) => (typeof p === 'object' ? p.id : null)).filter(Boolean)),
    postresIds: new Set(
      (pedido.productos_hornear || []).map((p) => (typeof p === 'object' ? p.id : null)).filter(Boolean)
    ),
  }))

  const platos = Array.isArray(pedido.platos) ? pedido.platos : []
  const restricciones = Array.isArray(pedido.restricciones) ? pedido.restricciones : []
  const baking = Array.isArray(pedido.productos_hornear) ? pedido.productos_hornear : []
  const adicionales = Array.isArray(pedido.adicionales) ? pedido.adicionales : []
  const lista = Array.isArray(pedido.lista_compras) ? pedido.lista_compras : []
  const fotosEntrega = fotosDePedido(pedido)

  const catalogoOrdenado = useMemo(
    () => [...platosCatalogo].sort((a, b) => (a.categoria || '').localeCompare(b.categoria || '') || a.nombre.localeCompare(b.nombre)),
    [platosCatalogo]
  )

  const setCampo = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const postresOrdenados = useMemo(
    () => [...postresCatalogo].sort((a, b) => a.nombre.localeCompare(b.nombre)),
    [postresCatalogo]
  )

  /**
   * Marca o desmarca un postre y AJUSTA el total con su precio.
   *
   * El total es un campo libre para la admin, pero si al agregar un postre no se
   * sumara, el pedido quedaría cobrado de menos sin ninguna señal — el mismo
   * problema que el flujo público ya evita calculando el total en el servidor.
   * Queda editable después, así que el ajuste orienta sin imponer.
   */
  const togglePostre = (postre) => {
    setForm((f) => {
      const next = new Set(f.postresIds)
      const precio = Number(postre.precio) || 0
      const estaba = next.has(postre.id)
      estaba ? next.delete(postre.id) : next.add(postre.id)
      const total = (Number(f.total) || 0) + (estaba ? -precio : precio)
      return { ...f, postresIds: next, total: Math.max(0, total) }
    })
  }

  const togglePlato = (id) => {
    setForm((f) => {
      const next = new Set(f.platosIds)
      next.has(id) ? next.delete(id) : next.add(id)
      return { ...f, platosIds: next }
    })
  }

  const onGuardar = async () => {
    setSaving(true)
    try {
      const platosSel = catalogoOrdenado
        .filter((p) => form.platosIds.has(p.id))
        .map((p) => ({ id: p.id, nombre: p.nombre }))
      const data = await editarPedido(pedido.id, {
        nombre: form.nombre,
        email: form.email,
        telefono: form.telefono,
        direccion: form.direccion,
        comuna: form.comuna,
        fecha_entrega: form.fecha_entrega,
        tipo_entrega: form.tipo_entrega,
        observaciones: form.observaciones,
        costo_despacho: Number(form.costo_despacho) || 0,
        total: Number(form.total) || 0,
        platos: platosSel,
        productos_hornear: postresOrdenados
          .filter((p) => form.postresIds.has(p.id))
          .map((p) => ({ id: p.id, nombre: p.nombre, precio: Number(p.precio) || 0 })),
      })
      setEditando(false)
      onSaved?.(data.pedido)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return on401?.()
      onError?.(err.message || 'No se pudo guardar el pedido.')
    } finally {
      setSaving(false)
    }
  }

  // ── Vista de sólo lectura ──
  if (!editando) {
    return (
      <div className="bg-background rounded-xl border border-espresso/10 p-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Bloque titulo="Platos">
            {platos.length ? (
              <ul className="list-disc pl-5 text-espresso space-y-0.5">
                {platos.map((p, i) => (
                  <li key={i}>
                    {platoNombre(p)}
                    {p?.acompanamiento?.nombre ? ` (con ${p.acompanamiento.nombre})` : ''}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-warm-gray">—</p>
            )}
          </Bloque>

          <Bloque titulo="Entrega">
            <p className="text-espresso">{pedido.tipo_entrega || '—'}</p>
            <p className="text-warm-gray">{pedido.direccion || '—'}{pedido.comuna ? `, ${pedido.comuna}` : ''}</p>
            <p className="text-warm-gray">Despacho: {fmtCLP(pedido.costo_despacho)}</p>
            <p className="text-warm-gray">Entrega: {fmtFecha(pedido.fecha_entrega)}</p>
            {pedido.personas > 0 && (
              <p className="text-warm-gray">
                Personas: {pedido.personas} {pedido.personas === 1 ? 'comensal' : 'comensales'}
              </p>
            )}
          </Bloque>

          {restricciones.length > 0 && (
            <Bloque titulo="Restricciones">
              <p className="text-espresso">{restricciones.join(', ')}</p>
            </Bloque>
          )}

          {baking.length > 0 && (
            <Bloque titulo="Para hornear">
              <ul className="list-disc pl-5 text-espresso space-y-0.5">
                {baking.map((p, i) => <li key={i}>{platoNombre(p)}{p?.precio ? ` — ${fmtCLP(p.precio)}` : ''}</li>)}
              </ul>
            </Bloque>
          )}

          {adicionales.length > 0 && (
            <Bloque titulo="Servicios adicionales">
              <ul className="list-disc pl-5 text-espresso space-y-0.5">
                {adicionales.map((a, i) => <li key={i}>{platoNombre(a)}{a?.precio ? ` — ${fmtCLP(a.precio)}` : ''}</li>)}
              </ul>
            </Bloque>
          )}

          {lista.length > 0 && (
            <Bloque titulo="Lista de compras">
              <ul className="text-espresso space-y-0.5">
                {lista.map((i, idx) => (
                  <li key={idx}>{i.nombre} — {i.cantidad} {i.unidad || ''}</li>
                ))}
              </ul>
            </Bloque>
          )}

          {pedido.observaciones && (
            <Bloque titulo="Observaciones">
              <p className="text-espresso">{pedido.observaciones}</p>
            </Bloque>
          )}

          {fotosEntrega.length > 0 && (
            <Bloque titulo={fotosEntrega.length > 1 ? `Fotos de entrega (${fotosEntrega.length})` : 'Foto de entrega'}>
              <div className="flex flex-wrap gap-2">
                {fotosEntrega.map((key, i) => (
                  <a key={key} href={imagenUrl(key)} target="_blank" rel="noopener noreferrer" title="Abrir en tamaño completo">
                    <img
                      src={imagenUrl(key)}
                      alt={`Foto ${i + 1} de entrega del pedido #${pedido.id}`}
                      className="w-32 h-32 rounded-xl border border-espresso/10 object-cover hover:opacity-90 transition-opacity"
                      loading="lazy"
                    />
                  </a>
                ))}
              </div>
            </Bloque>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={() => setEditando(true)}
            className="text-sm font-semibold text-terracotta hover:underline"
          >
            ✎ Editar pedido
          </button>
        </div>
      </div>
    )
  }

  // ── Formulario de edición ──
  return (
    <div className="bg-background rounded-xl border border-terracotta/30 p-4">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <label className="text-sm"><span className="block text-warm-gray mb-1">Nombre</span>
          <input className={inputCls} value={form.nombre} onChange={(e) => setCampo('nombre', e.target.value)} /></label>
        <label className="text-sm"><span className="block text-warm-gray mb-1">Email</span>
          <input className={inputCls} value={form.email} onChange={(e) => setCampo('email', e.target.value)} /></label>
        <label className="text-sm"><span className="block text-warm-gray mb-1">Teléfono</span>
          <input className={inputCls} value={form.telefono} onChange={(e) => setCampo('telefono', e.target.value)} /></label>
        <label className="text-sm"><span className="block text-warm-gray mb-1">Dirección</span>
          <input className={inputCls} value={form.direccion} onChange={(e) => setCampo('direccion', e.target.value)} /></label>
        <label className="text-sm"><span className="block text-warm-gray mb-1">Comuna</span>
          <input className={inputCls} list="comunas-list" value={form.comuna} onChange={(e) => setCampo('comuna', e.target.value)} />
          <datalist id="comunas-list">{comunas.map((c) => <option key={c.id} value={c.nombre} />)}</datalist>
        </label>
        <label className="text-sm"><span className="block text-warm-gray mb-1">Fecha de entrega</span>
          <input type="date" className={inputCls} value={form.fecha_entrega} onChange={(e) => setCampo('fecha_entrega', e.target.value)} /></label>
        <label className="text-sm"><span className="block text-warm-gray mb-1">Tipo de entrega</span>
          <select className={inputCls} value={form.tipo_entrega} onChange={(e) => setCampo('tipo_entrega', e.target.value)}>
            <option value="">—</option>
            <option value="delivery">Delivery</option>
            <option value="retiro">Retiro</option>
          </select></label>
        <label className="text-sm"><span className="block text-warm-gray mb-1">Costo despacho ($)</span>
          <input type="number" min={0} className={inputCls} value={form.costo_despacho} onChange={(e) => setCampo('costo_despacho', e.target.value)} /></label>
        <label className="text-sm"><span className="block text-warm-gray mb-1">Total ($)</span>
          <input type="number" min={0} className={inputCls} value={form.total} onChange={(e) => setCampo('total', e.target.value)} /></label>
      </div>

      <label className="text-sm block mt-3"><span className="block text-warm-gray mb-1">Observaciones</span>
        <textarea className={inputCls} rows={2} value={form.observaciones} onChange={(e) => setCampo('observaciones', e.target.value)} /></label>

      <div className="mt-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-warm-gray mb-1">
          Platos ({form.platosIds.size} seleccionados)
        </p>
        <div className="max-h-48 overflow-y-auto rounded-lg border border-espresso/10 p-2 grid sm:grid-cols-2 gap-1">
          {catalogoOrdenado.map((p) => (
            <label key={p.id} className="flex items-center gap-2 text-sm text-espresso px-1 py-0.5 rounded hover:bg-espresso/[0.04]">
              <input type="checkbox" checked={form.platosIds.has(p.id)} onChange={() => togglePlato(p.id)} />
              <span className="truncate">{p.nombre}</span>
              {p.categoria && <span className="text-[11px] text-warm-gray ml-auto">{p.categoria}</span>}
            </label>
          ))}
          {catalogoOrdenado.length === 0 && <p className="text-warm-gray text-sm">No hay platos en el catálogo.</p>}
        </div>
      </div>

      <div className="mt-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-warm-gray mb-1">
          Postres y Snacks ({form.postresIds.size} seleccionados)
        </p>
        <div className="max-h-48 overflow-y-auto rounded-lg border border-espresso/10 p-2 grid sm:grid-cols-2 gap-1">
          {postresOrdenados.map((p) => (
            <label key={p.id} className="flex items-center gap-2 text-sm text-espresso px-1 py-0.5 rounded hover:bg-espresso/[0.04]">
              <input type="checkbox" checked={form.postresIds.has(p.id)} onChange={() => togglePostre(p)} />
              <span className="truncate">{p.nombre}</span>
              {p.activo === false && <span className="text-[11px] text-warm-gray">(inactivo)</span>}
              <span className="text-[11px] text-warm-gray ml-auto">{fmtCLP(p.precio)}</span>
            </label>
          ))}
          {postresOrdenados.length === 0 && (
            <p className="text-warm-gray text-sm">No hay Postres y Snacks en el catálogo.</p>
          )}
        </div>
        <p className="text-[11px] text-warm-gray mt-1">
          Al marcar o desmarcar, el total se ajusta con el precio del producto. Puedes corregirlo a mano.
        </p>
      </div>

      <div className="mt-4 flex items-center justify-end gap-3">
        <button onClick={() => setEditando(false)} className="text-sm text-warm-gray hover:text-espresso px-3">
          Cancelar
        </button>
        <button
          onClick={onGuardar}
          disabled={saving}
          className="bg-terracotta text-ivory font-semibold rounded-full px-5 py-2 text-sm hover:bg-ember transition-colors disabled:opacity-50"
        >
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}
