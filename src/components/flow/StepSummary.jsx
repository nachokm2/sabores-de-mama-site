import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BakingAddon from './BakingAddon'
import { createPedido, ApiError } from '../../lib/publicApi'
import { fmtCLP } from '../../lib/flowConfig'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function fmtFecha(fecha) {
  if (!fecha) return '—'
  return new Date(String(fecha).slice(0, 10) + 'T00:00:00').toLocaleDateString('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function Fila({ label, children }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <span className="text-warm-gray flex-shrink-0">{label}</span>
      <span className="text-espresso text-right">{children}</span>
    </div>
  )
}

/**
 * Paso 6 · Resumen + datos personales + add-on de hornear + confirmar pedido.
 * Al confirmar hace POST /api/pedidos y navega a /pago/:pedidoId.
 */
export default function StepSummary({ data, update, onBack }) {
  const navigate = useNavigate()
  const [touched, setTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const emailValido = EMAIL_RE.test(data.email || '')
  const valido = (data.nombre || '').trim() !== '' && emailValido && (data.telefono || '').trim() !== ''

  const platosDetalle = data.platosDetalle || []
  const restricciones = data.restricciones || []
  const baking = data.productosHornearDetalle || []

  const confirmar = async () => {
    setTouched(true)
    if (!valido) return
    setSubmitting(true)
    setError('')
    try {
      const pedido = await createPedido({
        nombre: data.nombre.trim(),
        email: data.email.trim(),
        telefono: data.telefono.trim(),
        direccion: data.direccion,
        comuna: data.comuna,
        fecha_entrega: data.fecha_entrega,
        // Servicio parametrizado por el flujo (meal_prep | cocinera).
        servicio: data.servicio || 'meal_prep',
        platos: platosDetalle.map((p) => ({ id: p.id, nombre: p.nombre })),
        restricciones,
        observaciones: data.observaciones || null,
        tipo_entrega: data.tipo_entrega,
        costo_despacho: data.costo_despacho,
        total: data.total,
        productos_hornear: baking.map((p) => ({ id: p.id, nombre: p.nombre, precio: p.precio })),
        // Lista de compras editable (flujo Cocinera); vacío en Meal Prep.
        lista_compras: data.lista_compras || [],
        // Nº de comensales (flujo Cocinera); null en Meal Prep.
        personas: data.personas || null,
      })
      // replace: true → evita volver atrás al resumen una vez en la página de pago.
      navigate(`/pago/${pedido.id}`, { replace: true, state: { total: pedido.total } })
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError('La fecha elegida acaba de llenarse. Vuelve al paso de Fecha y elige otra.')
      } else if (err instanceof ApiError && err.status === 0) {
        setError('No pudimos conectar con el servidor. Intenta nuevamente.')
      } else {
        setError(err.message || 'No se pudo confirmar el pedido.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls =
    'w-full rounded-xl border border-espresso/15 bg-background px-3.5 py-2.5 text-sm text-espresso focus:outline-none focus:border-terracotta/60'

  return (
    <div>
      <h2 className="font-display text-2xl font-bold text-espresso mb-1">Revisa tu pedido</h2>
      <p className="text-warm-gray text-sm mb-6">Confirma los detalles antes de finalizar.</p>

      {/* Resumen */}
      <div className="rounded-2xl bg-background-warm border border-espresso/10 p-4 mb-5">
        <Fila label="Fecha de entrega">
          <span className="capitalize">{fmtFecha(data.fecha_entrega)}</span>
        </Fila>
        <Fila label="Entrega">{data.tipo_entrega === 'retiro' ? 'Retiro' : 'Delivery'}</Fila>
        <Fila label="Dirección">
          {data.direccion}
          {data.comuna ? `, ${data.comuna}` : ''}
        </Fila>
        <div className="py-1.5 text-sm">
          <span className="text-warm-gray block mb-1">Platos ({platosDetalle.length})</span>
          <ul className="list-disc pl-5 text-espresso">
            {platosDetalle.map((p) => (
              <li key={p.id}>{p.nombre}</li>
            ))}
          </ul>
        </div>
        {data.personas > 0 && (
          <Fila label="Personas">
            {data.personas} {data.personas === 1 ? 'persona' : 'personas'}
          </Fila>
        )}
        {(data.lista_compras || []).length > 0 && (
          <Fila label="Lista de compras">{data.lista_compras.length} ingredientes</Fila>
        )}
        {restricciones.length > 0 && <Fila label="Restricciones">{restricciones.join(', ')}</Fila>}
        {data.observaciones && <Fila label="Observaciones">{data.observaciones}</Fila>}
        {baking.length > 0 && <Fila label="Para hornear">{baking.map((p) => p.nombre).join(', ')}</Fila>}
        <div className="flex justify-between font-bold text-espresso mt-2 pt-2 border-t border-espresso/10">
          <span>Total</span>
          <span className="text-terracotta">{fmtCLP(data.total)}</span>
        </div>
      </div>

      {/* Add-on de hornear (ANTES del botón confirmar) */}
      <div className="mb-5">
        <BakingAddon data={data} update={update} />
      </div>

      {/* Datos personales */}
      <h3 className="font-display text-base font-bold text-espresso mb-3">Tus datos</h3>
      <div className="space-y-3 mb-6">
        <label className="block text-sm">
          <span className="block text-espresso font-medium mb-1.5">Nombre *</span>
          <input className={inputCls} value={data.nombre || ''} onChange={(e) => update({ nombre: e.target.value })} />
          {touched && (data.nombre || '').trim() === '' && (
            <span className="text-xs text-primary-600 mt-1 block">El nombre es obligatorio.</span>
          )}
        </label>
        <label className="block text-sm">
          <span className="block text-espresso font-medium mb-1.5">Email *</span>
          <input
            type="email"
            className={inputCls}
            value={data.email || ''}
            onChange={(e) => update({ email: e.target.value })}
            placeholder="tucorreo@ejemplo.com"
          />
          {touched && !emailValido && (
            <span className="text-xs text-primary-600 mt-1 block">Ingresa un email válido.</span>
          )}
        </label>
        <label className="block text-sm">
          <span className="block text-espresso font-medium mb-1.5">Teléfono *</span>
          <input
            type="tel"
            className={inputCls}
            value={data.telefono || ''}
            onChange={(e) => update({ telefono: e.target.value })}
            placeholder="+56 9 ..."
          />
          {touched && (data.telefono || '').trim() === '' && (
            <span className="text-xs text-primary-600 mt-1 block">El teléfono es obligatorio.</span>
          )}
        </label>
      </div>

      {error && (
        <div className="mb-4 text-sm text-primary-700 bg-primary-50 border border-primary-200 rounded-lg px-4 py-2.5">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center">
        <button onClick={onBack} disabled={submitting} className="text-warm-gray hover:text-espresso px-4 py-3 disabled:opacity-50">
          ← Atrás
        </button>
        <button
          onClick={confirmar}
          disabled={submitting || !valido}
          className="bg-terracotta text-ivory font-semibold rounded-full px-7 py-3 hover:bg-ember transition-colors disabled:opacity-50"
        >
          {submitting ? 'Confirmando…' : 'Confirmar Pedido'}
        </button>
      </div>
    </div>
  )
}
