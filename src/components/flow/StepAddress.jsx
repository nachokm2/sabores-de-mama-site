import { useEffect, useState } from 'react'
import { getComunas } from '../../lib/publicApi'
import { DELIVERY_COST, computeTotal } from '../../lib/flowConfig'

// Lista de respaldo si la API de comunas no responde (mismo costo para todas).
const COMUNAS_FALLBACK = [
  'Cerrillos', 'Cerro Navia', 'Conchalí', 'El Bosque', 'Estación Central', 'Huechuraba',
  'Independencia', 'La Cisterna', 'La Florida', 'La Granja', 'La Pintana', 'La Reina',
  'Las Condes', 'Lo Barnechea', 'Lo Espejo', 'Lo Prado', 'Macul', 'Maipú', 'Ñuñoa',
  'Pedro Aguirre Cerda', 'Peñalolén', 'Providencia', 'Pudahuel', 'Puente Alto', 'Quilicura',
  'Quinta Normal', 'Recoleta', 'Renca', 'San Joaquín', 'San Miguel', 'San Ramón',
  'Santiago', 'Vitacura',
].map((nombre) => ({ nombre, costo_despacho: DELIVERY_COST }))

const inputCls =
  'w-full rounded-xl border border-espresso/15 bg-background px-3.5 py-2.5 text-sm text-espresso focus:outline-none focus:border-terracotta/60'

/**
 * Paso 1 · Dirección y comuna. La comuna define el costo de despacho.
 */
export default function StepAddress({ data, update, onNext }) {
  const [touched, setTouched] = useState(false)
  const [comunas, setComunas] = useState(COMUNAS_FALLBACK)
  const valido = data.direccion.trim() !== '' && data.comuna !== ''

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const lista = await getComunas(data.servicio)
        if (active && Array.isArray(lista) && lista.length) setComunas(lista)
      } catch {
        /* se mantiene el fallback */
      }
    })()
    return () => {
      active = false
    }
  }, [data.servicio])

  const onComuna = (nombre) => {
    const c = comunas.find((x) => x.nombre === nombre)
    const comunaCosto = c ? Number(c.costo_despacho) : DELIVERY_COST
    const patch = { comuna: nombre, comunaCosto }
    // Si ya había elegido delivery, reflejar el nuevo costo en el total.
    if (data.tipo_entrega === 'delivery') {
      patch.costo_despacho = comunaCosto
      patch.total = computeTotal({ base: data.base, costo_despacho: comunaCosto, bakingTotal: data.bakingTotal })
    }
    update(patch)
  }

  const continuar = () => {
    setTouched(true)
    if (valido) onNext()
  }

  return (
    <div>
      <h2 className="font-display text-2xl font-bold text-espresso mb-1">¿Dónde entregamos?</h2>
      <p className="text-warm-gray text-sm mb-6">Indícanos tu dirección y comuna.</p>

      <label className="block mb-4 text-sm">
        <span className="block text-espresso font-medium mb-1.5">Dirección *</span>
        <input
          className={inputCls}
          value={data.direccion}
          onChange={(e) => update({ direccion: e.target.value })}
          placeholder="Calle, número, depto…"
        />
        {touched && data.direccion.trim() === '' && (
          <span className="text-xs text-primary-600 mt-1 block">La dirección es obligatoria.</span>
        )}
      </label>

      <label className="block mb-6 text-sm">
        <span className="block text-espresso font-medium mb-1.5">Comuna *</span>
        <select className={inputCls} value={data.comuna} onChange={(e) => onComuna(e.target.value)}>
          <option value="">Selecciona tu comuna…</option>
          {comunas.map((c) => (
            <option key={c.nombre} value={c.nombre}>
              {c.nombre}
            </option>
          ))}
        </select>
        {touched && data.comuna === '' && (
          <span className="text-xs text-primary-600 mt-1 block">Selecciona una comuna.</span>
        )}
      </label>

      <div className="flex justify-end">
        <button
          onClick={continuar}
          disabled={!valido}
          className="bg-terracotta text-ivory font-semibold rounded-full px-6 py-3 hover:bg-ember transition-colors disabled:opacity-50"
        >
          Continuar
        </button>
      </div>
    </div>
  )
}
