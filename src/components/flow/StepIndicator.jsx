import { Fragment } from 'react'

const DEFAULT_LABELS = ['Dirección', 'Fecha', 'Platos', 'Preferencias', 'Entrega', 'Resumen']

/**
 * Barra de progreso horizontal del stepper.
 * - currentStep (1-6), totalSteps (=6)
 * - El paso actual se destaca, los completados muestran ✓, los futuros inactivos.
 */
export default function StepIndicator({ currentStep, totalSteps = 6, labels = DEFAULT_LABELS }) {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1)

  return (
    <div className="w-full" aria-label={`Paso ${currentStep} de ${totalSteps}`}>
      <div className="flex items-start">
        {steps.map((n, idx) => {
          const completed = n < currentStep
          const active = n === currentStep
          return (
            <Fragment key={n}>
              <div className="flex flex-col items-center flex-shrink-0 w-10 sm:w-14">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                    completed
                      ? 'bg-terracotta text-ivory'
                      : active
                        ? 'bg-terracotta text-ivory ring-4 ring-terracotta/20'
                        : 'bg-background border border-espresso/15 text-warm-gray'
                  }`}
                  aria-current={active ? 'step' : undefined}
                >
                  {completed ? '✓' : n}
                </div>
                <span
                  className={`mt-1.5 text-2xs text-center leading-tight ${
                    active ? 'text-espresso font-semibold' : 'text-warm-gray'
                  }`}
                >
                  {labels[idx]}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mt-4 mx-0.5 sm:mx-1 rounded-full ${
                    n < currentStep ? 'bg-terracotta' : 'bg-espresso/15'
                  }`}
                />
              )}
            </Fragment>
          )
        })}
      </div>
    </div>
  )
}
