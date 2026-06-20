import { useEffect, useState } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { BANK, fmtCLP } from '../lib/flowConfig'
import { getPedidoResumen } from '../lib/publicApi'

/**
 * Página de pago (/pago/:pedidoId).
 * Muestra los datos bancarios, el monto exacto a transferir y las instrucciones.
 * El monto llega por el state de navegación; si se recarga, se obtiene del
 * endpoint público de resumen.
 */
export default function StepPayment() {
  const { pedidoId } = useParams()
  const location = useLocation()
  const [total, setTotal] = useState(location.state?.total ?? null)

  useEffect(() => {
    if (total != null) return
    let active = true
    getPedidoResumen(pedidoId)
      .then((p) => active && p && setTotal(p.total))
      .catch(() => {})
    return () => {
      active = false
    }
  }, [pedidoId, total])

  const filas = [
    ['Titular', BANK.titular],
    ['Banco', BANK.banco],
    ['Tipo de cuenta', BANK.tipoCuenta],
    ['N° de cuenta', BANK.numero],
    ['RUT', BANK.rut],
    ['Email', BANK.email],
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>Pago de tu pedido · Sabores de Mamá</title>
      </Helmet>

      <header className="border-b border-espresso/10 bg-background-warm/80 backdrop-blur">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center">
          <Link to="/" className="font-display text-lg font-bold text-terracotta">
            Sabores de Mamá
          </Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-10 w-full">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-full bg-amber/15 text-2xl flex items-center justify-center mx-auto mb-3">
            🧾
          </div>
          <h1 className="font-display text-2xl font-bold text-espresso">¡Casi listo!</h1>
          <p className="text-warm-gray text-sm mt-1">
            Pedido <span className="font-semibold text-espresso">#{pedidoId}</span> recibido. Realiza la
            transferencia para confirmarlo.
          </p>
        </div>

        {/* Monto */}
        <div className="rounded-2xl bg-terracotta text-ivory p-5 text-center mb-5">
          <p className="text-xs uppercase tracking-wider opacity-90">Monto a transferir</p>
          <p className="font-display text-3xl font-bold mt-1">{total != null ? fmtCLP(total) : '—'}</p>
        </div>

        {/* Datos bancarios */}
        <div className="rounded-2xl bg-background-surface border border-espresso/10 p-5 mb-5">
          <h2 className="font-display font-bold text-espresso mb-3">Datos para transferencia</h2>
          <table className="w-full text-sm">
            <tbody>
              {filas.map(([label, value]) => (
                <tr key={label}>
                  <td className="py-1.5 text-warm-gray">{label}</td>
                  <td className="py-1.5 text-right text-espresso font-medium">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Instrucciones */}
        <div className="rounded-2xl bg-amber/[0.06] border border-amber/30 p-4 mb-5 text-sm text-espresso">
          <p className="font-semibold mb-1">Instrucciones</p>
          <ol className="list-decimal pl-5 space-y-1 text-warm-gray">
            <li>Transfiere el monto exacto a la cuenta indicada.</li>
            <li>
              Envía el comprobante a <span className="text-espresso font-medium">{BANK.email}</span> indicando tu
              pedido <span className="text-espresso font-medium">#{pedidoId}</span>.
            </li>
            <li>Te confirmaremos por correo cuando validemos el pago.</li>
          </ol>
        </div>

        <p className="text-center text-sm text-warm-gray mb-6">
          Tu pedido quedará confirmado una vez validemos tu transferencia.
        </p>

        <div className="text-center">
          <Link
            to="/"
            className="inline-block bg-terracotta text-ivory font-semibold rounded-full px-7 py-3 hover:bg-ember transition-colors"
          >
            Volver al inicio
          </Link>
        </div>
      </main>
    </div>
  )
}
