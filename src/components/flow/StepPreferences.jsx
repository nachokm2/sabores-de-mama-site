const OPCIONES = ['Sin lactosa', 'Sin gluten', 'Vegetariano', 'Vegano', 'No consumo algún alimento']

/**
 * Paso 4 · Preferencias y restricciones (todas opcionales) + observaciones.
 */
export default function StepPreferences({ data, update, onNext, onBack }) {
  const restricciones = data.restricciones || []

  const toggle = (opcion) => {
    const next = restricciones.includes(opcion)
      ? restricciones.filter((r) => r !== opcion)
      : [...restricciones, opcion]
    update({ restricciones: next })
  }

  return (
    <div>
      <h2 className="font-display text-2xl font-bold text-espresso mb-1">Preferencias alimenticias</h2>
      <p className="text-warm-gray text-sm mb-6">Marca lo que aplique (opcional).</p>

      <div className="space-y-2 mb-6">
        {OPCIONES.map((opcion) => {
          const checked = restricciones.includes(opcion)
          return (
            <label
              key={opcion}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-colors ${
                checked ? 'border-terracotta bg-amber/10' : 'border-espresso/15 bg-background-surface hover:border-terracotta/40'
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(opcion)}
                className="accent-terracotta w-4 h-4"
              />
              <span className="text-sm text-espresso">{opcion}</span>
            </label>
          )
        })}
      </div>

      <label className="block mb-6 text-sm">
        <span className="block text-espresso font-medium mb-1.5">Observaciones (opcional)</span>
        <textarea
          rows={3}
          value={data.observaciones || ''}
          onChange={(e) => update({ observaciones: e.target.value })}
          placeholder="Ej: alergia a los frutos secos, sin cebolla, etc."
          className="w-full rounded-xl border border-espresso/15 bg-background px-3.5 py-2.5 text-sm text-espresso focus:outline-none focus:border-terracotta/60"
        />
      </label>

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
