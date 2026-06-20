import { DELIVERY_COST, computeTotal, fmtCLP, MEAL_PREP_BASE } from '../../lib/flowConfig'

/**
 * Paso 5 · Tipo de entrega. Delivery (con costo de despacho) o Retiro (sin costo).
 * Muestra el total actualizado dinámicamente.
 */
export default function StepDelivery({ data, update, onNext, onBack }) {
  const tipo = data.tipo_entrega || 'delivery'

  const base = data.base ?? MEAL_PREP_BASE
  const serviceLabel = data.serviceLabel || 'Meal Prep (5 platos)'

  const seleccionar = (nuevoTipo) => {
    const costo_despacho = nuevoTipo === 'delivery' ? DELIVERY_COST : 0
    update({
      tipo_entrega: nuevoTipo,
      costo_despacho,
      total: computeTotal({ base, costo_despacho, bakingTotal: data.bakingTotal }),
    })
  }

  const opciones = [
    { value: 'delivery', titulo: 'Delivery a domicilio', desc: 'Te lo llevamos a tu dirección.', costo: DELIVERY_COST },
    { value: 'retiro', titulo: 'Retiro', desc: 'Pasas a buscarlo. Sin costo adicional.', costo: 0 },
  ]

  return (
    <div>
      <h2 className="font-display text-2xl font-bold text-espresso mb-1">¿Cómo lo recibes?</h2>
      <p className="text-warm-gray text-sm mb-6">Elige el tipo de entrega.</p>

      <div className="space-y-2.5 mb-6">
        {opciones.map((o) => {
          const checked = tipo === o.value
          return (
            <label
              key={o.value}
              className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3.5 cursor-pointer transition-colors ${
                checked ? 'border-terracotta bg-amber/10' : 'border-espresso/15 bg-background-surface hover:border-terracotta/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="tipo_entrega"
                  checked={checked}
                  onChange={() => seleccionar(o.value)}
                  className="accent-terracotta w-4 h-4"
                />
                <div>
                  <p className="text-sm font-semibold text-espresso">{o.titulo}</p>
                  <p className="text-xs text-warm-gray">{o.desc}</p>
                </div>
              </div>
              <span className="text-sm font-semibold text-espresso whitespace-nowrap">
                {o.costo > 0 ? `+ ${fmtCLP(o.costo)}` : 'Gratis'}
              </span>
            </label>
          )
        })}
      </div>

      {/* Total dinámico */}
      <div className="rounded-2xl bg-background-warm border border-espresso/10 p-4 mb-6">
        <div className="flex justify-between text-sm text-warm-gray">
          <span>{serviceLabel}</span>
          <span>{fmtCLP(base)}</span>
        </div>
        <div className="flex justify-between text-sm text-warm-gray mt-1">
          <span>Despacho</span>
          <span>{fmtCLP(data.costo_despacho)}</span>
        </div>
        {data.bakingTotal > 0 && (
          <div className="flex justify-between text-sm text-warm-gray mt-1">
            <span>Para hornear</span>
            <span>{fmtCLP(data.bakingTotal)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-espresso mt-2 pt-2 border-t border-espresso/10">
          <span>Total</span>
          <span className="text-terracotta">{fmtCLP(data.total)}</span>
        </div>
      </div>

      <div className="flex justify-between">
        <button onClick={onBack} className="text-warm-gray hover:text-espresso px-4 py-3">
          ← Atrás
        </button>
        <button
          onClick={onNext}
          className="bg-terracotta text-ivory font-semibold rounded-full px-6 py-3 hover:bg-ember transition-colors"
        >
          Continuar
        </button>
      </div>
    </div>
  )
}
