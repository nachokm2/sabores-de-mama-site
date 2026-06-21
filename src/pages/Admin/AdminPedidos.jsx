import { Fragment, useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import { EstadoBadge, fmtCLP, fmtFecha } from '../../components/admin/adminHelpers'
import PedidoDetalle from '../../components/admin/PedidoDetalle'
import {
  getPedidos,
  cambiarEstadoPedido,
  reenviarCorreo,
  getPlatos,
  getComunas,
  ESTADOS,
  SERVICIOS,
  ApiError,
} from '../../lib/adminApi'

/**
 * AdminPedidos · tabla de pedidos con filtros por estado y fecha de entrega,
 * y acción para cambiar el estado (que dispara el correo correspondiente).
 */
export default function AdminPedidos() {
  const navigate = useNavigate()
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

  const goLogin = useCallback(() => navigate('/admin/login', { replace: true }), [navigate])

  const cargar = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getPedidos({ estado: filtroEstado, fecha: filtroFecha })
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
  }, [filtroEstado, filtroFecha, navigate])

  useEffect(() => {
    cargar()
  }, [cargar])

  // Catálogo de platos + comunas para el formulario de edición (una sola vez).
  useEffect(() => {
    getPlatos({ incluirInactivos: true })
      .then((d) => setCatalogo(d.platos || []))
      .catch(() => {})
    getComunas({ todos: true })
      .then((d) => setComunas(d.comunas || []))
      .catch(() => {})
  }, [])

  const onPedidoEditado = (actualizado) => {
    setPedidos((prev) => prev.map((p) => (p.id === actualizado.id ? actualizado : p)))
    setMsg(`Pedido #${actualizado.id} actualizado.`)
  }

  const onCambiarEstado = async (pedido, estado) => {
    if (estado === pedido.estado) return
    setSavingId(pedido.id)
    setMsg('')
    setError('')
    try {
      const res = await cambiarEstadoPedido(pedido.id, estado)
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
        return
      }
      setError(err.message || 'No se pudo cambiar el estado.')
    } finally {
      setSavingId(null)
    }
  }

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
    <AdminLayout title="Pedidos">
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
            {ESTADOS.map((e) => (
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
                        {ESTADOS.map((e) => (
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
