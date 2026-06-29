import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import SectionLabel from '../../components/ui/SectionLabel'
import { cuentaInputCls } from '../../components/cuenta/CuentaShell'
import { getPerfil, editarPerfil, getMisReservas, logout, getCliente, ApiError } from '../../lib/clienteApi'
import { fmtCLP } from '../../lib/flowConfig'

const ESTADOS = {
  solicitud_recibida: { label: 'Solicitud recibida', ok: false },
  pagado: { label: 'Pago confirmado', ok: true },
  en_preparacion: { label: 'En preparación', ok: true },
  entregado: { label: 'Entregado', ok: true },
}
const SERVICIOS = { meal_prep: 'Meal Prep', cocinera: 'Cocinera a Domicilio' }

function fmtFecha(f) {
  if (!f) return '—'
  try {
    return new Date(String(f).slice(0, 10) + 'T00:00:00').toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })
  } catch {
    return String(f)
  }
}
const platoNombre = (p) => (typeof p === 'string' ? p : p?.nombre || '')
const hoyStr = () => new Date().toISOString().slice(0, 10)

function EstadoBadge({ estado }) {
  const e = ESTADOS[estado] || { label: estado, ok: false }
  return (
    <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${e.ok ? 'text-[#15803D] bg-[#15803D]/10 border-[#15803D]/30' : 'text-accent-600 bg-amber/10 border-amber/30'}`}>
      {e.label}
    </span>
  )
}

function ReservaCard({ r }) {
  const platos = Array.isArray(r.platos) ? r.platos : []
  const lista = Array.isArray(r.lista_compras) ? r.lista_compras : []
  return (
    <div className="bg-background-surface border border-espresso/10 rounded-2xl p-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="font-display text-espresso font-bold">Reserva #{r.id}</p>
          <p className="text-xs text-warm-gray capitalize">{fmtFecha(r.fecha_entrega)} · {SERVICIOS[r.servicio] || r.servicio}</p>
        </div>
        <EstadoBadge estado={r.estado} />
      </div>
      {platos.length > 0 && (
        <p className="text-sm text-warm-gray mt-2">
          <span className="text-espresso font-medium">Platos:</span> {platos.map(platoNombre).join(', ')}
        </p>
      )}
      {lista.length > 0 && <p className="text-xs text-warm-gray mt-1">{lista.length} ingredientes en tu lista de compras</p>}
      <p className="text-sm text-terracotta font-bold mt-2">{fmtCLP(r.total)}</p>
    </div>
  )
}

export default function ClienteCuenta() {
  const navigate = useNavigate()
  const cliente = getCliente()
  const [reservas, setReservas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [perfil, setPerfil] = useState({ nombre: '', telefono: '', direccion: '', password: '' })
  const [savingPerfil, setSavingPerfil] = useState(false)

  const salir = () => {
    logout()
    navigate('/cuenta/login', { replace: true })
  }

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const [p, rs] = await Promise.all([getPerfil(), getMisReservas()])
        if (!active) return
        setPerfil({ nombre: p.user?.nombre || '', telefono: p.user?.telefono || '', direccion: p.user?.direccion || '', password: '' })
        setReservas(rs.pedidos || [])
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) return salir()
        if (active) setError(err.message || 'No se pudieron cargar tus datos.')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onGuardarPerfil = async (e) => {
    e.preventDefault()
    setSavingPerfil(true)
    setError('')
    setMsg('')
    try {
      const body = {
        nombre: perfil.nombre.trim(),
        telefono: perfil.telefono.trim() || null,
        direccion: perfil.direccion.trim() || null,
      }
      if (perfil.password) body.password = perfil.password
      await editarPerfil(body)
      setPerfil((p) => ({ ...p, password: '' }))
      setMsg('Datos actualizados.')
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return salir()
      setError(err.message || 'No se pudieron guardar los datos.')
    } finally {
      setSavingPerfil(false)
    }
  }

  const hoy = hoyStr()
  const proximas = reservas.filter((r) => String(r.fecha_entrega).slice(0, 10) >= hoy && r.estado !== 'entregado')
  const historial = reservas.filter((r) => !(String(r.fecha_entrega).slice(0, 10) >= hoy && r.estado !== 'entregado'))

  return (
    <>
      <Helmet>
        <title>Mi cuenta | Sabores de Mamá</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <Navbar />
      <main className="min-h-screen bg-background pt-28 pb-20">
        <div className="container-site max-w-3xl">
          {/* Header */}
          <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
            <div>
              <SectionLabel>Mi cuenta</SectionLabel>
              <h1 className="font-display text-3xl font-bold text-espresso mt-2">Hola, {cliente?.nombre || ''} 👋</h1>
            </div>
            <button onClick={salir} className="text-sm font-medium text-espresso/80 hover:text-terracotta border border-espresso/15 hover:border-terracotta/50 rounded-full px-4 py-2 transition-colors">
              Cerrar sesión
            </button>
          </div>

          {msg && <div className="mb-4 text-sm text-[#15803D] bg-[#15803D]/10 border border-[#15803D]/30 rounded-lg px-4 py-2">{msg}</div>}
          {error && <div className="mb-4 text-sm text-primary-700 bg-primary-50 border border-primary-200 rounded-lg px-4 py-2">{error}</div>}

          {/* CTA consultar lista de compras */}
          <div className="bg-background-surface border border-espresso/10 rounded-2xl p-5 mb-8 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="font-display text-espresso font-bold">Planifica tus compras</p>
              <p className="text-sm text-warm-gray">Elige platos y cuántas personas; te generamos la lista de ingredientes.</p>
            </div>
            <button onClick={() => navigate('/cuenta/lista')} className="border border-terracotta text-terracotta font-semibold rounded-full px-5 py-2.5 text-sm hover:bg-amber/10 transition-colors whitespace-nowrap">
              Consultar lista
            </button>
          </div>

          {loading ? (
            <p className="text-center text-warm-gray text-sm py-8">Cargando…</p>
          ) : (
            <>
              {/* Próximas */}
              <section className="mb-8">
                <h2 className="font-display text-xl font-bold text-espresso mb-3">Próximas reservas</h2>
                {proximas.length ? (
                  <div className="space-y-3">{proximas.map((r) => <ReservaCard key={r.id} r={r} />)}</div>
                ) : (
                  <p className="text-sm text-warm-gray">No tienes reservas próximas.</p>
                )}
              </section>

              {/* Historial */}
              {historial.length > 0 && (
                <section className="mb-8">
                  <h2 className="font-display text-xl font-bold text-espresso mb-3">Historial</h2>
                  <div className="space-y-3">{historial.map((r) => <ReservaCard key={r.id} r={r} />)}</div>
                </section>
              )}

              {/* Perfil */}
              <section>
                <h2 className="font-display text-xl font-bold text-espresso mb-3">Mis datos</h2>
                <form onSubmit={onGuardarPerfil} className="bg-background-surface border border-espresso/10 rounded-2xl p-5">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <label className="text-sm">
                      <span className="block text-espresso font-medium mb-1.5">Nombre</span>
                      <input className={cuentaInputCls} value={perfil.nombre} onChange={(e) => setPerfil((p) => ({ ...p, nombre: e.target.value }))} />
                    </label>
                    <label className="text-sm">
                      <span className="block text-espresso font-medium mb-1.5">Teléfono</span>
                      <input className={cuentaInputCls} value={perfil.telefono} onChange={(e) => setPerfil((p) => ({ ...p, telefono: e.target.value }))} />
                    </label>
                    <label className="text-sm sm:col-span-2">
                      <span className="block text-espresso font-medium mb-1.5">Dirección</span>
                      <input className={cuentaInputCls} value={perfil.direccion} onChange={(e) => setPerfil((p) => ({ ...p, direccion: e.target.value }))} placeholder="Calle, número, comuna" />
                    </label>
                    <label className="text-sm">
                      <span className="block text-espresso font-medium mb-1.5">Email</span>
                      <input className={cuentaInputCls + ' opacity-60'} value={cliente?.email || ''} disabled />
                    </label>
                    <label className="text-sm">
                      <span className="block text-espresso font-medium mb-1.5">Nueva contraseña <span className="text-warm-gray font-normal">(opcional)</span></span>
                      <input type="password" className={cuentaInputCls} value={perfil.password} onChange={(e) => setPerfil((p) => ({ ...p, password: e.target.value }))} placeholder="Dejar en blanco para no cambiar" />
                    </label>
                  </div>
                  <button type="submit" disabled={savingPerfil} className="mt-4 bg-terracotta text-ivory font-semibold rounded-full px-5 py-2.5 text-sm hover:bg-ember transition-colors disabled:opacity-50">
                    {savingPerfil ? 'Guardando…' : 'Guardar datos'}
                  </button>
                </form>
              </section>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
