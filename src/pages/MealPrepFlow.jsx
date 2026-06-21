import { useReducer, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import StepIndicator from '../components/flow/StepIndicator'
import StepAddress from '../components/flow/StepAddress'
import StepDate from '../components/flow/StepDate'
import StepDishes from '../components/flow/StepDishes'
import StepPreferences from '../components/flow/StepPreferences'
import StepDelivery from '../components/flow/StepDelivery'
import StepSummary from '../components/flow/StepSummary'
import { DELIVERY_COST, MEAL_PREP_BASE, computeTotal } from '../lib/flowConfig'

const initialState = {
  step: 1,
  // Identidad del servicio (parametriza los componentes compartidos).
  servicio: 'meal_prep',
  serviceLabel: 'Meal Prep (5 platos)',
  base: MEAL_PREP_BASE,
  // Paso 1
  direccion: '',
  comuna: '',
  comunaCosto: DELIVERY_COST, // costo de despacho de la comuna elegida
  // Paso 2
  fecha_entrega: '',
  // Paso 3
  platos: [], // ids
  platosDetalle: [], // [{id, nombre, descripcion}]
  // Paso 4
  restricciones: [],
  observaciones: '',
  // Paso 5
  tipo_entrega: 'delivery',
  costo_despacho: DELIVERY_COST,
  // Add-on
  productos_hornear: [], // ids
  productosHornearDetalle: [],
  bakingTotal: 0,
  // Paso 6 (datos personales)
  nombre: '',
  email: '',
  telefono: '',
  // Total (recalculado en cada SET)
  total: computeTotal({ base: MEAL_PREP_BASE, costo_despacho: DELIVERY_COST, bakingTotal: 0 }),
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET': {
      const next = { ...state, ...action.payload }
      next.total = computeTotal({ base: next.base, costo_despacho: next.costo_despacho, bakingTotal: next.bakingTotal })
      return next
    }
    case 'NEXT':
      return { ...state, step: Math.min(6, state.step + 1) }
    case 'BACK':
      return { ...state, step: Math.max(1, state.step - 1) }
    default:
      return state
  }
}

const STEPS = {
  1: StepAddress,
  2: StepDate,
  3: StepDishes,
  4: StepPreferences,
  5: StepDelivery,
  6: StepSummary,
}

/**
 * Flujo de pedido Meal Prep: stepper de 6 pasos con estado global (useReducer).
 * El paso de pago es una página aparte (/pago/:pedidoId) a la que se navega con
 * replace, de modo que no se puede volver atrás al flujo una vez confirmado.
 */
export default function MealPrepFlow() {
  const [state, dispatch] = useReducer(reducer, initialState)

  const update = (payload) => dispatch({ type: 'SET', payload })
  const onNext = () => dispatch({ type: 'NEXT' })
  const onBack = () => dispatch({ type: 'BACK' })

  // Al cambiar de paso, subir al inicio.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [state.step])

  const CurrentStep = STEPS[state.step]

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Arma tu Meal Prep · Sabores de Mamá</title>
      </Helmet>

      {/* Topbar */}
      <header className="border-b border-espresso/10 bg-background-warm/80 backdrop-blur">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="font-display text-lg font-bold text-terracotta">
            Sabores de Mamá
          </Link>
          <Link to="/" className="text-sm text-warm-gray hover:text-espresso">
            Salir
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <StepIndicator currentStep={state.step} totalSteps={6} />
        </div>

        <div className="bg-background-surface border border-espresso/10 rounded-2xl p-5 sm:p-7 shadow-[0_10px_40px_rgba(42,28,18,0.06)]">
          <CurrentStep data={state} update={update} onNext={onNext} onBack={onBack} />
        </div>
      </main>
    </div>
  )
}
