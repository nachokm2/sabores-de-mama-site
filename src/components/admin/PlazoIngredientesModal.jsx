import { useState } from 'react'

/**
 * Modal bloqueante que pide la fecha y hora LÍMITE para que el cliente envíe los
 * ingredientes, antes de marcar el pedido como "Pagado" y disparar el correo.
 * Devuelve el plazo (string "YYYY-MM-DDTHH:mm") vía onConfirm(plazo). El cambio
 * de estado + envío del correo lo aplica el componente padre (AdminPedidos).
 */
export default function PlazoIngredientesModal({ pedido, onConfirm, onClose }) {
  const [plazo, setPlazo] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const confirmar = async () => {
    if (!plazo || guardando) return
    setGuardando(true)
    setError('')
    try {
      await onConfirm(plazo)
    } catch (err) {
      setError(err.message || 'No se pudo confirmar el pago. Intenta nuevamente.')
      setGuardando(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="plazo-titulo"
    >
      <div className="bg-background-surface rounded-2xl border border-espresso/10 shadow-xl w-full max-w-md p-5">
        <h2 id="plazo-titulo" className="font-display text-lg font-bold text-espresso mb-1">
          Plazo de ingredientes · Pedido #{pedido.id}
        </h2>
        <p className="text-sm text-warm-gray mb-4">
          Indica la <strong>fecha y hora límite</strong> en que el cliente puede enviar los
          ingredientes. Se incluirá en el correo de confirmación de pago.
        </p>

        <label className="block text-sm mb-3">
          <span className="block text-espresso font-medium mb-1.5">Fecha y hora límite *</span>
          <input
            type="datetime-local"
            value={plazo}
            onChange={(e) => {
              setError('')
              setPlazo(e.target.value)
            }}
            disabled={guardando}
            className="w-full rounded-xl border border-espresso/15 bg-background px-3.5 py-2.5 text-sm text-espresso focus:outline-none focus:border-terracotta/60 disabled:opacity-50"
          />
        </label>

        {error && (
          <div className="mb-3 text-sm text-primary-700 bg-primary-50 border border-primary-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div className="flex justify-end items-center gap-3 mt-2">
          <button
            onClick={onClose}
            disabled={guardando}
            className="text-sm text-warm-gray hover:text-espresso px-3 py-2 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={confirmar}
            disabled={!plazo || guardando}
            className="bg-terracotta text-ivory font-semibold rounded-full px-5 py-2.5 text-sm hover:bg-ember transition-colors disabled:opacity-50"
          >
            {guardando ? 'Enviando…' : 'Confirmar y enviar correo'}
          </button>
        </div>
      </div>
    </div>
  )
}
