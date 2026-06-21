import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SectionLabel from '../components/ui/SectionLabel'
import { consultarPedido, ApiError } from '../lib/publicApi'
import { fmtCLP } from '../lib/flowConfig'

const ESTADOS = {
  solicitud_recibida: { label: 'Solicitud recibida', sub: 'Esperando la transferencia para confirmar.', ok: false },
  pagado: { label: 'Pago confirmado', sub: '¡Listo! Tu pedido está confirmado.', ok: true },
  en_preparacion: { label: 'En preparación', sub: 'Mamá está manos a la obra. 👩‍🍳', ok: true },
  entregado: { label: 'Entregado', sub: '¡Que lo disfrutes! ❤️', ok: true },
}

const SERVICIOS = { meal_prep: 'Meal Prep', cocinera: 'Cocinera a Domicilio' }

function fmtFecha(fecha) {
  if (!fecha) return '—'
  try {
    return new Date(String(fecha).slice(0, 10) + 'T00:00:00').toLocaleDateString('es-CL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
  } catch {
    return String(fecha)
  }
}

const platoNombre = (p) => (typeof p === 'string' ? p : p?.nombre || '')
const inputCls =
  'w-full rounded-xl border border-espresso/15 bg-background px-3.5 py-2.5 text-sm text-espresso focus:outline-none focus:border-terracotta/60'

function Bloque({ titulo, children }) {
  return (
    <div className="mt-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-accent-600 mb-2">{titulo}</p>
      {children}
    </div>
  )
}

export default function ConsultarPedido() {
  const [id, setId] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pedido, setPedido] = useState(null)

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setPedido(null)
    try {
      const data = await consultarPedido({ id: id.trim(), email: email.trim() })
      setPedido(data)
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setError('No encontramos un pedido con ese número y email. Revisa los datos.')
      } else if (err instanceof ApiError && err.status === 0) {
        setError('No pudimos conectar con el servidor. Intenta nuevamente.')
      } else {
        setError(err.message || 'No se pudo consultar el pedido.')
      }
    } finally {
      setLoading(false)
    }
  }

  const estado = pedido ? ESTADOS[pedido.estado] || { label: pedido.estado, sub: '', ok: false } : null
  const platos = Array.isArray(pedido?.platos) ? pedido.platos : []
  const lista = Array.isArray(pedido?.lista_compras) ? pedido.lista_compras : []
  const baking = Array.isArray(pedido?.productos_hornear) ? pedido.productos_hornear : []

  return (
    <>
      <Helmet>
        <title>Consultar pedido | Sabores de Mamá</title>
        <meta name="description" content="Consulta el estado de tu pedido y tu lista de ingredientes con tu número de pedido y email." />
        <meta name="robots" content="noindex" />
      </Helmet>

      <Navbar />

      <main className="min-h-screen bg-background pt-28 pb-20">
        <div className="container-site max-w-xl">
          <div className="text-center mb-8">
            <SectionLabel>Tu pedido</SectionLabel>
            <h1 className="section-title text-espresso mt-3">Consulta tu pedido</h1>
            <p className="font-body text-warm-gray text-sm mt-3">
              Ingresa tu número de pedido y el email con el que pediste para ver su estado y tu lista de ingredientes.
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={onSubmit} className="bg-background-surface border border-espresso/10 rounded-2xl p-5 sm:p-6">
            <div className="grid sm:grid-cols-[120px_1fr] gap-3">
              <label className="text-sm">
                <span className="block text-espresso font-medium mb-1.5">N° de pedido</span>
                <input
                  className={inputCls}
                  inputMode="numeric"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  placeholder="123"
                  required
                />
              </label>
              <label className="text-sm">
                <span className="block text-espresso font-medium mb-1.5">Email</span>
                <input
                  type="email"
                  className={inputCls}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full bg-terracotta text-ivory font-semibold rounded-full px-5 py-3 text-sm hover:bg-ember transition-colors disabled:opacity-50"
            >
              {loading ? 'Consultando…' : 'Consultar pedido'}
            </button>
            {error && (
              <p className="mt-3 text-sm text-primary-700 bg-primary-50 border border-primary-200 rounded-lg px-4 py-2">
                {error}
              </p>
            )}
          </form>

          {/* Resultado */}
          {pedido && (
            <div className="bg-background-surface border border-espresso/10 rounded-2xl p-5 sm:p-6 mt-5">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h2 className="font-display text-xl font-bold text-espresso">Pedido #{pedido.id}</h2>
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                    estado.ok
                      ? 'text-[#15803D] bg-[#15803D]/10 border-[#15803D]/30'
                      : 'text-accent-600 bg-amber/10 border-amber/30'
                  }`}
                >
                  {estado.label}
                </span>
              </div>
              {estado.sub && <p className="text-sm text-warm-gray mt-1">{estado.sub}</p>}

              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 mt-4 text-sm">
                <div className="flex justify-between border-b border-espresso/5 py-1.5">
                  <span className="text-warm-gray">Servicio</span>
                  <span className="text-espresso font-medium">{SERVICIOS[pedido.servicio] || pedido.servicio}</span>
                </div>
                <div className="flex justify-between border-b border-espresso/5 py-1.5">
                  <span className="text-warm-gray">Entrega</span>
                  <span className="text-espresso font-medium capitalize">{fmtFecha(pedido.fecha_entrega)}</span>
                </div>
                <div className="flex justify-between border-b border-espresso/5 py-1.5">
                  <span className="text-warm-gray">Tipo</span>
                  <span className="text-espresso font-medium">
                    {pedido.tipo_entrega || '—'}{pedido.comuna ? ` · ${pedido.comuna}` : ''}
                  </span>
                </div>
                <div className="flex justify-between border-b border-espresso/5 py-1.5">
                  <span className="text-warm-gray">Total</span>
                  <span className="text-terracotta font-bold">{fmtCLP(pedido.total)}</span>
                </div>
              </div>

              {platos.length > 0 && (
                <Bloque titulo="Platos">
                  <ul className="list-disc pl-5 text-espresso text-sm space-y-0.5">
                    {platos.map((p, i) => <li key={i}>{platoNombre(p)}</li>)}
                  </ul>
                </Bloque>
              )}

              {lista.length > 0 && (
                <Bloque titulo="Lista de ingredientes">
                  <table className="w-full text-sm">
                    <tbody>
                      {lista.map((i, idx) => (
                        <tr key={idx} className="border-b border-espresso/5 last:border-0">
                          <td className="py-1.5 text-espresso">{i.nombre}</td>
                          <td className="py-1.5 text-right text-warm-gray whitespace-nowrap">
                            {i.cantidad} {i.unidad || ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Bloque>
              )}

              {baking.length > 0 && (
                <Bloque titulo="Para hornear en casa">
                  <ul className="list-disc pl-5 text-espresso text-sm space-y-0.5">
                    {baking.map((p, i) => (
                      <li key={i}>{platoNombre(p)}{p?.precio ? ` — ${fmtCLP(p.precio)}` : ''}</li>
                    ))}
                  </ul>
                </Bloque>
              )}

              {pedido.observaciones && (
                <Bloque titulo="Observaciones">
                  <p className="text-espresso text-sm">{pedido.observaciones}</p>
                </Bloque>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  )
}
