import { Fragment, useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import { EstadoBadge, fmtCLP, fmtFecha } from '../../components/admin/adminHelpers'
import PedidoDetalle from '../../components/admin/PedidoDetalle'
import PedidoNuevo from '../../components/admin/PedidoNuevo'
import FotoEntregaModal from '../../components/admin/FotoEntregaModal'
import PlazoIngredientesModal from '../../components/admin/PlazoIngredientesModal'
import {
  getPedidos,
  cambiarEstadoPedido,
  reenviarCorreo,
  getPlatos,
  getComunas,
  estadosDeServicio,
  ESTADOS_LABELS,
  SERVICIOS,
  ApiError,
} from '../../lib/adminApi'

/**
 * AdminPedidos · tabla de pedidos con filtros por estado y fecha de entrega,
 * y acción para cambiar el estado (que dispara el correo correspondiente).
 */
export default function AdminPedidos() {
  const navigate = useNavigate()
  const { servicio } = useParams()
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroFecha, setFiltroFecha] = useState('')
  const [savingId, setSavingId] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [catalogo, setCatalogo] = useState([])
  const [comunas, setComunas] = useState([])
  const [creando, setCreando] = useState(false)
  // Pedido a la espera de foto para pasar a "En delivery" (abre el modal).
  const [fotoPedido, setFotoPedido] = useState(null)
  // Pedido a la espera del plazo de ingredientes para marcar "Pagado" (modal).
  const [plazoPedido, setPlazoPedido] = useState(null)

  const goLogin = useCallback(() => navigate('/admin/login', { replace: true }), [navigate])

  const cargar = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getPedidos({ estado: filtroEstado, fecha: filtroFecha, servicio })
      setPedidos(data.pedidos || [])
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        navigate('/admin/login', { replace: true })
        return
      }
      setError(err.message || 'No se pudieron cargar los pedidos.')
    } finally {
      setLoading(false)
    }
  }, [filtroEstado, filtroFecha, servicio, navigate])

  useEffect(() => {
    cargar()
  }, [cargar])

  // Catálogo de platos + comunas (del servicio) para los formularios.
  useEffect(() => {
    getPlatos({ incluirInactivos: true })
      .then((d) => setCatalogo(d.platos || []))
      .catch(() => {})
    getComunas({ todos: true, servicio })
      .then((d) => setComunas(d.comunas || []))
      .catch(() => {})
  }, [servicio])

  const onPedidoEditado = (actualizado) => {
    setPedidos((prev) => prev.map((p) => (p.id === actualizado.id ? actualizado : p)))
    setMsg(`Pedido #${actualizado.id} actualizado.`)
  }

  const onPedidoCreado = (nuevo) => {
    setPedidos((prev) => [nuevo, ...prev])
    setCreando(false)
    setError('')
    setMsg(`Reserva #${nuevo.id} creada.`)
  }

  // Aplica el cambio de estado (con foto opcional). Lanza el error para que el
  // llamador decida dónde mostrarlo (fila vs. modal); el 401 navega al login.
  const aplicarEstado = async (pedido, estado, fotoKey, plazoIngredientes) => {
    setSavingId(pedido.id)
    try {
      const res = await cambiarEstadoPedido(pedido.id, estado, fotoKey, plazoIngredientes)
      setPedidos((prev) => prev.map((p) => (p.id === pedido.id ? res.pedido : p)))
      const correo = res.email?.ok
        ? 'correo enviado.'
        : res.email?.skipped
          ? 'correo omitido (SMTP no configurado).'
          : 'pero el correo falló.'
      setMsg(`Pedido #${pedido.id} → ${estado}; ${correo}`)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        navigate('/admin/login', { replace: true })
      }
      throw err
    } finally {
      setSavingId(null)
    }
  }

  const onCambiarEstado = async (pedido, estado) => {
    if (estado === pedido.estado) return
    setMsg('')
    setError('')
    // Regla: "En delivery" exige una foto del pedido. Si aún no hay, pedirla.
    if (estado === 'en_delivery' && !pedido.foto_entrega) {
      setFotoPedido(pedido)
      return
    }
    // Regla: al marcar "Pagado" un Meal Prep, primero pedir el plazo de envío de
    // ingredientes (va en el correo de pago).
    if (estado === 'pagado' && (pedido.servicio || 'meal_prep') === 'meal_prep') {
      setPlazoPedido(pedido)
      return
    }
    try {
      await aplicarEstado(pedido, estado)
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 401)) {
        setError(err.message || 'No se pudo cambiar el estado.')
      }
    }
  }

  // Confirmación del modal: la foto ya se subió (key); aplica "En delivery".
  // Si falla, se relanza para que el modal muestre el error y no se cierre.
  const onFotoConfirmada = async (key) => {
    setMsg('')
    setError('')
    await aplicarEstado(fotoPedido, 'en_delivery', key)
    setFotoPedido(null)
  }

  // Confirmación del modal de plazo: aplica "Pagado" con la fecha/hora límite,
  // que viaja al correo. Si falla, se relanza para que el modal muestre el error.
  const onPlazoConfirmado = async (plazo) => {
    setMsg('')
    setError('')
    await aplicarEstado(plazoPedido, 'pagado', undefined, plazo)
    setPlazoPedido(null)
  }

  // Estados disponibles para este servicio (Meal Prep / Cocinera).
  const estadosServicio = estadosDeServicio(servicio)
  // Opciones del selector de una fila: incluye el estado actual aunque ya no
  // pertenezca al servicio (p. ej. pedidos antiguos en "en_preparacion").
  const opcionesEstado = (estadoActual) =>
    estadosServicio.some((e) => e.value === estadoActual)
      ? estadosServicio
      : [{ value: estadoActual, label: ESTADOS_LABELS[estadoActual] || estadoActual }, ...estadosServicio]

  const onReenviar = async (pedido) => {
    setMsg('')
    setError('')
    try {
      const res = await reenviarCorreo(pedido.id, pedido.estado)
      setMsg(
        res.email?.ok
          ? `Correo reenviado al cliente del pedido #${pedido.id}.`
          : `No se reenvió el correo (${res.email?.reason || 'error'}).`
      )
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        navigate('/admin/login', { replace: true })
        return
      }
      setError(err.message || 'No se pudo reenviar el correo.')
    }
  }

  return (
    <AdminLayout
      title="Pedidos"
      actions={
        !creando && (
          <button
            onClick={() => {
              setCreando(true)
              setMsg('')
              setError('')
            }}
            className="bg-terracotta text-ivory font-semibold rounded-full px-5 py-2.5 text-sm hover:bg-ember transition-colors"
          >
            + Nueva reserva
          </button>
        )
      }
    >
      {creando && (
        <PedidoNuevo
          servicio={servicio}
          platosCatalogo={catalogo}
          comunas={comunas}
          onCreated={onPedidoCreado}
          onCancel={() => setCreando(false)}
          onError={setError}
          on401={goLogin}
        />
      )}

      {fotoPedido && (
        <FotoEntregaModal
          pedido={fotoPedido}
          onConfirm={onFotoConfirmada}
          onClose={() => setFotoPedido(null)}
        />
      )}

      {plazoPedido && (
        <PlazoIngredientesModal
          pedido={plazoPedido}
          onConfirm={onPlazoConfirmado}
          onClose={() => setPlazoPedido(null)}
        />
      )}

      {/* Filtros */}
      <div className="flex flex-wrap items-end gap-3 mb-5">
        <label className="text-sm">
          <span className="block text-warm-gray mb-1">Estado</span>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="rounded-xl border border-espresso/15 bg-background-surface px-3 py-2 text-espresso"
          >
            <option value="">Todos</option>
            {estadosServicio.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="block text-warm-gray mb-1">Fecha de entrega</span>
          <input
            type="date"
            value={filtroFecha}
            onChange={(e) => setFiltroFecha(e.target.value)}
            className="rounded-xl border border-espresso/15 bg-background-surface px-3 py-2 text-espresso"
          />
        </label>
        {(filtroEstado || filtroFecha) && (
          <button
            onClick={() => {
              setFiltroEstado('')
              setFiltroFecha('')
            }}
            className="text-sm text-terracotta hover:underline pb-2"
          >
            Limpiar filtros
          </button>
        )}
      </div>

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

      <div className="bg-background-surface border border-espresso/10 rounded-2xl overflow-hidden">
        {loading ? (
          <p className="px-5 py-8 text-center text-warm-gray text-sm">Cargando…</p>
        ) : pedidos.length === 0 ? (
          <p className="px-5 py-8 text-center text-warm-gray text-sm">No hay pedidos con esos filtros.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-warm-gray border-b border-espresso/10">
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Contacto</th>
                  <th className="px-4 py-3 font-medium">Servicio</th>
                  <th className="px-4 py-3 font-medium">Entrega</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Cambiar a</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {pedidos.map((p) => (
                  <Fragment key={p.id}>
                  <tr className="border-b border-espresso/5 last:border-0 align-top">
                    <td className="px-4 py-3 text-warm-gray">{p.id}</td>
                    <td className="px-4 py-3">
                      <p className="text-espresso font-medium">{p.nombre}</p>
                      <p className="text-warm-gray text-xs">{p.comuna || '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-warm-gray text-xs">
                      <p>{p.email}</p>
                      <p>{p.telefono || '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-warm-gray">{SERVICIOS[p.servicio] || p.servicio}</td>
                    <td className="px-4 py-3 text-warm-gray">{fmtFecha(p.fecha_entrega)}</td>
                    <td className="px-4 py-3 text-espresso">{fmtCLP(p.total)}</td>
                    <td className="px-4 py-3"><EstadoBadge estado={p.estado} /></td>
                    <td className="px-4 py-3">
                      <select
                        value={p.estado}
                        disabled={savingId === p.id}
                        onChange={(e) => onCambiarEstado(p, e.target.value)}
                        className="rounded-lg border border-espresso/15 bg-background px-2 py-1.5 text-espresso text-xs disabled:opacity-50"
                      >
                        {opcionesEstado(p.estado).map((e) => (
                          <option key={e.value} value={e.value}>
                            {e.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1.5 items-start">
                        <button
                          onClick={() => setExpandedId((id) => (id === p.id ? null : p.id))}
                          className="text-xs text-espresso hover:text-terracotta hover:underline whitespace-nowrap"
                        >
                          {expandedId === p.id ? '▾ Ocultar' : '▸ Detalle'}
                        </button>
                        <button
                          onClick={() => onReenviar(p)}
                          className="text-xs text-terracotta hover:underline whitespace-nowrap"
                          title="Reenviar el correo del estado actual"
                        >
                          ✉ Reenviar
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedId === p.id && (
                    <tr className="border-b border-espresso/5">
                      <td colSpan={9} className="px-4 pb-4 bg-background-warm/40">
                        <PedidoDetalle
                          pedido={p}
                          platosCatalogo={catalogo}
                          comunas={comunas}
                          onSaved={onPedidoEditado}
                          onError={setError}
                          on401={goLogin}
                        />
                      </td>
                    </tr>
                  )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
