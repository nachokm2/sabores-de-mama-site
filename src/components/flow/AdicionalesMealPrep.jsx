import {
  computeTotal,
  fmtCLP,
  MEAL_PREP_INGREDIENTES,
  MEAL_PREP_PORCIONADO,
} from '../../lib/flowConfig'

/**
 * Servicios adicionales opcionales de Meal Prep. Los precios son configurables
 * por la admin (llegan en `data.costoIngredientes` / `data.costoPorcionado`);
 * si faltan, se usan los valores por defecto de flowConfig.
 */
export default function AdicionalesMealPrep({ data, update }) {
  const opciones = [
    {
      clave: 'ingredientes',
      nombre: 'Compra de ingredientes en el supermercado',
      descripcion: 'Nosotros compramos los ingredientes por ti.',
      precio: Number(data.costoIngredientes ?? MEAL_PREP_INGREDIENTES),
    },
    {
      clave: 'porcionado',
      nombre: 'Platos porcionados',
      descripcion: 'Recibe cada plato dividido en porciones individuales.',
      precio: Number(data.costoPorcionado ?? MEAL_PREP_PORCIONADO),
    },
  ]

  const seleccionados = data.adicionales || []
  const isSel = (clave) => seleccionados.some((a) => a.clave === clave)

  const toggle = (op) => {
    const next = isSel(op.clave)
      ? seleccionados.filter((a) => a.clave !== op.clave)
      : [...seleccionados, { clave: op.clave, nombre: op.nombre, precio: op.precio }]
    const adicionalesTotal = next.reduce((sum, a) => sum + Number(a.precio || 0), 0)
    update({
      adicionales: next,
      adicionalesTotal,
      total: computeTotal({
        base: data.base,
        costo_despacho: data.costo_despacho,
        bakingTotal: data.bakingTotal,
        adicionalesTotal,
      }),
    })
  }

  return (
    <div className="rounded-2xl border border-amber/30 bg-amber/[0.05] p-4">
      <h3 className="font-display text-base font-bold text-espresso mb-1">
        ¿Quieres agregar un servicio adicional?
      </h3>
      <p className="text-xs text-warm-gray mb-3">Totalmente opcional.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {opciones.map((op) => {
          const sel = isSel(op.clave)
          return (
            <label
              key={op.clave}
              className={`flex items-start justify-between gap-2 rounded-xl border px-3 py-2.5 cursor-pointer transition-colors ${
                sel ? 'border-terracotta bg-amber/10' : 'border-espresso/15 bg-background-surface hover:border-terracotta/40'
              }`}
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <input
                  type="checkbox"
                  checked={sel}
                  onChange={() => toggle(op)}
                  className="mt-0.5 accent-terracotta w-4 h-4 flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-espresso">{op.nombre}</p>
                  <p className="text-xs text-warm-gray">{op.descripcion}</p>
                </div>
              </div>
              <span className="text-sm font-semibold text-terracotta whitespace-nowrap">+ {fmtCLP(op.precio)}</span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
