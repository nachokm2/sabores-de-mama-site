import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import { EstadoBadge, fmtCLP, fmtFecha, toDateStr, todayStr } from '../../components/admin/adminHelpers'
import { getPedidos, ApiError, SERVICIOS } from '../../lib/adminApi'

function StatCard({ label, value, accent }) {
  return (
    <div className="bg-background-surface border border-espresso/10 rounded-2xl p-5 shadow-[0_8px_30px_rgba(42,28,18,0.05)]">
      <p className="text-sm text-warm-gray">{label}</p>
      <p className={`font-display text-3xl font-bold mt-1 ${accent || 'text-espresso'}`}>{value}</p>
    </div>
  )
}

/**
 * AdminDashboard · resumen: entregas de hoy, pendientes de pago, en preparación
 * y total, más los pedidos recientes.
 */
export default function AdminDashboard() {
  const navigate = useNavigate()
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const data = await getPedidos({ limit: 500 })
        if (active) setPedidos(data.pedidos || [])
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          navigate('/admin/login', { replace: true })
          return
        }
        if (active) setError(err.message || 'No se pudieron cargar los pedidos.')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [navigate])

  const hoy = todayStr()
  const entregasHoy = pedidos.filter((p) => toDateStr(p.fecha_entrega) === hoy).length
  const pendientesPago = pedidos.filter((p) => p.estado === 'solicitud_recibida').length
  const enPreparacion = pedidos.filter((p) => p.estado === 'en_preparacion').length
  const recientes = pedidos.slice(0, 8)

  return (
    <AdminLayout title="Dashboard">
      {error && (
        <div className="mb-6 text-sm text-primary-700 bg-primary-50 border border-primary-200 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Entregas de hoy" value={loading ? '—' : entregasHoy} accent="text-terracotta" />
        <StatCard label="Pendientes de pago" value={loading ? '—' : pendientesPago} accent="text-accent-600" />
        <StatCard label="En preparación" value={loading ? '—' : enPreparacion} accent="text-primary-700" />
        <StatCard label="Total de pedidos" value={loading ? '—' : pedidos.length} />
      </div>

      <div className="bg-background-surface border border-espresso/10 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-espresso/10">
          <h2 className="font-display text-lg font-bold text-espresso">Pedidos recientes</h2>
          <Link to="/admin/pedidos" className="text-sm font-medium text-terracotta hover:underline">
            Ver todos →
          </Link>
        </div>

        {loading ? (
          <p className="px-5 py-8 text-center text-warm-gray text-sm">Cargando…</p>
        ) : recientes.length === 0 ? (
          <p className="px-5 py-8 text-center text-warm-gray text-sm">Aún no hay pedidos.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-warm-gray border-b border-espresso/10">
                  <th className="px-5 py-3 font-medium">#</th>
                  <th className="px-5 py-3 font-medium">Cliente</th>
                  <th className="px-5 py-3 font-medium">Servicio</th>
                  <th className="px-5 py-3 font-medium">Entrega</th>
                  <th className="px-5 py-3 font-medium">Total</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {recientes.map((p) => (
                  <tr key={p.id} className="border-b border-espresso/5 last:border-0">
                    <td className="px-5 py-3 text-warm-gray">{p.id}</td>
                    <td className="px-5 py-3 text-espresso font-medium">{p.nombre}</td>
                    <td className="px-5 py-3 text-warm-gray">{SERVICIOS[p.servicio] || p.servicio}</td>
                    <td className="px-5 py-3 text-warm-gray">{fmtFecha(p.fecha_entrega)}</td>
                    <td className="px-5 py-3 text-espresso">{fmtCLP(p.total)}</td>
                    <td className="px-5 py-3"><EstadoBadge estado={p.estado} /></td>
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
