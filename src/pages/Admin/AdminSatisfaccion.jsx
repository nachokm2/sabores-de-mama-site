import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import { getEncuestas, getEncuestasStats, ApiError } from '../../lib/adminApi'

function Estrellas({ n }) {
  const v = Math.max(0, Math.min(5, Math.round(n || 0)))
  return (
    <span className="whitespace-nowrap" aria-label={`${v} de 5`}>
      <span className="text-amber">{'★'.repeat(v)}</span>
      <span className="text-espresso/20">{'★'.repeat(5 - v)}</span>
    </span>
  )
}

function Card({ label, value, sub }) {
  return (
    <div className="bg-background-surface border border-espresso/10 rounded-2xl p-5">
      <p className="text-warm-gray text-xs uppercase tracking-wide mb-1">{label}</p>
      <p className="font-display text-3xl font-bold text-espresso">{value}</p>
      {sub != null && <p className="text-sm text-warm-gray mt-1">{sub}</p>}
    </div>
  )
}

function fmtFechaHora(v) {
  if (!v) return '—'
  try {
    return new Date(v).toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return String(v)
  }
}

export default function AdminSatisfaccion() {
  const navigate = useNavigate()
  const { servicio } = useParams()
  const [rows, setRows] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [f, setF] = useState({ desde: '', hasta: '', rating: '', recomienda: '', q: '' })

  const cargar = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [list, st] = await Promise.all([
        getEncuestas({ servicio, ...f }),
        getEncuestasStats({ servicio, desde: f.desde, hasta: f.hasta }),
      ])
      setRows(list.encuestas || [])
      setStats(st)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) navigate('/admin/login', { replace: true })
      else setError(err.message || 'No se pudieron cargar las encuestas.')
    } finally {
      setLoading(false)
    }
  }, [servicio, f, navigate])

  useEffect(() => {
    cargar()
  }, [cargar])

  const set = (k, v) => setF((prev) => ({ ...prev, [k]: v }))

  const maxDist = stats ? Math.max(1, ...Object.values(stats.distribucion || { 1: 0 })) : 1
  const inputCls =
    'rounded-xl border border-espresso/15 bg-background px-3 py-2 text-sm text-espresso focus:outline-none focus:border-terracotta/60'

  return (
    <AdminLayout title="Satisfacción de Clientes">
      {/* Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card
          label="Promedio de satisfacción"
          value={stats ? `${stats.promedio.toFixed(2)} / 5` : '—'}
          sub={<Estrellas n={stats?.promedio} />}
        />
        <Card
          label="Recomiendan el servicio"
          value={stats ? `${stats.pct_recomienda}%` : '—'}
          sub={stats ? `${stats.recomiendan} de ${stats.total}` : ''}
        />
        <Card label="Respuestas" value={stats ? stats.total : '—'} sub="total recibidas" />
      </div>

      {/* Gráficos simples */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-background-surface border border-espresso/10 rounded-2xl p-5">
          <h3 className="font-display font-bold text-espresso mb-3 text-sm">Distribución por estrellas</h3>
          {[5, 4, 3, 2, 1].map((r) => {
            const c = stats?.distribucion?.[r] || 0
            return (
              <div key={r} className="flex items-center gap-2 mb-1.5 text-xs">
                <span className="w-8 text-warm-gray">{r}★</span>
                <div className="flex-1 h-3 rounded-full bg-espresso/[0.06] overflow-hidden">
                  <div className="h-full bg-amber rounded-full" style={{ width: `${(c / maxDist) * 100}%` }} />
                </div>
                <span className="w-8 text-right text-espresso">{c}</span>
              </div>
            )
          })}
        </div>

        <div className="bg-background-surface border border-espresso/10 rounded-2xl p-5">
          <h3 className="font-display font-bold text-espresso mb-3 text-sm">
            Evolución del promedio (mensual)
          </h3>
          {stats?.evolucion?.length ? (
            <div className="flex items-end gap-2 h-36">
              {stats.evolucion.map((e) => (
                <div key={e.periodo} className="flex-1 h-full flex flex-col items-center justify-end gap-1">
                  <div
                    className="w-full bg-terracotta rounded-t min-h-[2px]"
                    style={{ height: `${(e.promedio / 5) * 100}%` }}
                    title={`${e.promedio.toFixed(2)} / 5 · ${e.total} resp.`}
                  />
                  <span className="text-2xs text-warm-gray">{e.periodo.slice(5)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-warm-gray text-sm">Sin datos aún.</p>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <label className="text-xs text-warm-gray">
          Desde
          <input type="date" value={f.desde} onChange={(e) => set('desde', e.target.value)} className={`block mt-1 ${inputCls}`} />
        </label>
        <label className="text-xs text-warm-gray">
          Hasta
          <input type="date" value={f.hasta} onChange={(e) => set('hasta', e.target.value)} className={`block mt-1 ${inputCls}`} />
        </label>
        <label className="text-xs text-warm-gray">
          Calificación
          <select value={f.rating} onChange={(e) => set('rating', e.target.value)} className={`block mt-1 ${inputCls}`}>
            <option value="">Todas</option>
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>{r} estrellas</option>
            ))}
          </select>
        </label>
        <label className="text-xs text-warm-gray">
          Recomienda
          <select value={f.recomienda} onChange={(e) => set('recomienda', e.target.value)} className={`block mt-1 ${inputCls}`}>
            <option value="">Todos</option>
            <option value="si">Sí</option>
            <option value="no">No</option>
          </select>
        </label>
        <label className="text-xs text-warm-gray flex-1 min-w-[180px]">
          Buscar cliente o pedido
          <input
            type="search"
            value={f.q}
            onChange={(e) => set('q', e.target.value)}
            placeholder="Nombre, email o N° de pedido…"
            className={`block mt-1 w-full ${inputCls}`}
          />
        </label>
      </div>

      {error && (
        <div className="mb-4 text-sm text-primary-700 bg-primary-50 border border-primary-200 rounded-lg px-4 py-2.5">
          {error}
        </div>
      )}

      {/* Tabla */}
      <div className="bg-background-surface border border-espresso/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-warm-gray bg-background-warm border-b border-espresso/10">
                <th className="px-4 py-3 font-medium">Pedido</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Calificación</th>
                <th className="px-4 py-3 font-medium">Recomienda</th>
                <th className="px-4 py-3 font-medium">Comentario</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-warm-gray">Cargando…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-warm-gray">Aún no hay respuestas.</td></tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-b border-espresso/5 last:border-0 align-top">
                    <td className="px-4 py-3 font-medium text-espresso whitespace-nowrap">#{r.order_id}</td>
                    <td className="px-4 py-3 text-espresso">
                      {r.cliente || '—'}
                      {r.email && <span className="block text-2xs text-warm-gray">{r.email}</span>}
                    </td>
                    <td className="px-4 py-3"><Estrellas n={r.satisfaction_rating} /></td>
                    <td className="px-4 py-3">
                      {r.would_recommend ? (
                        <span className="text-[#15803D] font-medium">Sí</span>
                      ) : (
                        <span className="text-primary-600 font-medium">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-warm-gray max-w-xs">{r.improvement_comment || '—'}</td>
                    <td className="px-4 py-3 text-warm-gray whitespace-nowrap">{fmtFechaHora(r.responded_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}
