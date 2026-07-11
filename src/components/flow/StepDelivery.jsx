import { useEffect } from 'react'
import { DELIVERY_COST, computeTotal, fmtCLP, MEAL_PREP_BASE } from '../../lib/flowConfig'

/**
 * Paso 5 · Entrega. El servicio es sólo delivery a domicilio (no hay retiro),
 * así que este paso confirma la entrega y muestra el total actualizado.
 */
export default function StepDelivery({ data, update, onNext, onBack }) {
  const base = data.base ?? MEAL_PREP_BASE
  const serviceLabel = data.serviceLabel || 'Meal Prep (5 platos)'
  // Costo de despacho de la comuna elegida (fallback al valor por defecto).
  const deliveryCost = data.comunaCosto ?? DELIVERY_COST

  // Sólo hay delivery: fija el tipo de entrega y el costo de despacho de la
  // comuna al entrar (por si el estado venía con otro valor) y recalcula el total.
  useEffect(() => {
    if (data.tipo_entrega === 'delivery' && data.costo_despacho === deliveryCost) return
    update({ tipo_entrega: 'delivery', costo_despacho: deliveryCost })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliveryCost])

  return (
    <div>
      <h2 className="font-display text-2xl font-bold text-espresso mb-1">Entrega a domicilio</h2>
      <p className="text-warm-gray text-sm mb-6">Te llevamos tu pedido a tu dirección.</p>

      {/* Único método de entrega: delivery (informativo, no seleccionable) */}
      <div className="flex items-center justify-between gap-3 rounded-xl border border-terracotta bg-amber/10 px-4 py-3.5 mb-6">
        <div>
          <p className="text-sm font-semibold text-espresso">Delivery a domicilio</p>
          <p className="text-xs text-warm-gray">Te lo llevamos{data.comuna ? ` a ${data.comuna}` : ''}.</p>
        </div>
        <span className="text-sm font-semibold text-espresso whitespace-nowrap">
          {deliveryCost > 0 ? `+ ${fmtCLP(deliveryCost)}` : 'Gratis'}
        </span>
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
        {data.adicionalesTotal > 0 && (
          <div className="flex justify-between text-sm text-warm-gray mt-1">
            <span>Servicios adicionales</span>
            <span>{fmtCLP(data.adicionalesTotal)}</span>
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
