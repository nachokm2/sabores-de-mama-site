import { useReducer, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import StepIndicator from '../components/flow/StepIndicator'
import StepAddress from '../components/flow/StepAddress'
import StepDate from '../components/flow/StepDate'
import StepDishes from '../components/flow/StepDishes'
import ShoppingList from '../components/flow/ShoppingList'
import StepPreferences from '../components/flow/StepPreferences'
import StepDelivery from '../components/flow/StepDelivery'
import StepSummary from '../components/flow/StepSummary'
import { DELIVERY_COST, COCINERA_BASE, computeTotal } from '../lib/flowConfig'
import { getPrecioBase } from '../lib/publicApi'

// Flujo Cocinera a Domicilio: 7 pasos. Reutiliza los componentes de Meal Prep e
// inserta ShoppingList (paso 4) entre StepDishes y StepPreferences.
const STEP_LABELS = ['Dirección', 'Fecha', 'Platos', 'Lista', 'Preferencias', 'Entrega', 'Resumen']
const TOTAL_STEPS = 7

const initialState = {
  step: 1,
  // Identidad del servicio (parametriza los componentes compartidos).
  servicio: 'cocinera',
  serviceLabel: 'Cocinera a Domicilio',
  base: COCINERA_BASE,
  // Paso 1
  direccion: '',
  comuna: '',
  comunaCosto: DELIVERY_COST, // costo de despacho de la comuna elegida
  // Paso 2
  fecha_entrega: '',
  // Paso 3
  platos: [],
  platosDetalle: [],
  // Paso 4 (exclusivo Cocinera): nº de comensales + lista de compras escalada
  personas: 2,
  lista_compras: [],
  // Paso 5
  restricciones: [],
  observaciones: '',
  // Paso 6
  tipo_entrega: 'delivery',
  costo_despacho: DELIVERY_COST,
  // Add-on
  productos_hornear: [],
  productosHornearDetalle: [],
  bakingTotal: 0,
  // Adicionales (ensaladas que se cobran aparte)
  adicionales: [], // [{ clave, nombre, precio }]
  adicionalesTotal: 0,
  // Paso 7 (datos personales)
  nombre: '',
  email: '',
  telefono: '',
  total: computeTotal({ base: COCINERA_BASE, costo_despacho: DELIVERY_COST, bakingTotal: 0 }),
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET': {
      const next = { ...state, ...action.payload }
      next.total = computeTotal({
        base: next.base,
        costo_despacho: next.costo_despacho,
        bakingTotal: next.bakingTotal,
        adicionalesTotal: next.adicionalesTotal,
      })
      return next
    }
    case 'NEXT':
      return { ...state, step: Math.min(TOTAL_STEPS, state.step + 1) }
    case 'BACK':
      return { ...state, step: Math.max(1, state.step - 1) }
    default:
      return state
  }
}

export default function CocineraFlow() {
  const [state, dispatch] = useReducer(reducer, initialState)

  const update = (payload) => dispatch({ type: 'SET', payload })
  const onNext = () => dispatch({ type: 'NEXT' })
  const onBack = () => dispatch({ type: 'BACK' })

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [state.step])

  // Precio base configurado por la admin para este servicio (cae al valor por
  // defecto si el backend no responde).
  useEffect(() => {
    let active = true
    getPrecioBase('cocinera').then((base) => {
      if (active && base != null) update({ base })
    })
    return () => {
      active = false
    }
  }, [])

  const stepProps = { data: state, update, onNext, onBack }

  // Orden de pasos (ShoppingList exclusivo, paso 4).
  function renderStep() {
    switch (state.step) {
      case 1:
        return <StepAddress {...stepProps} />
      case 2:
        return <StepDate {...stepProps} />
      case 3:
        return <StepDishes {...stepProps} />
      case 4:
        return <ShoppingList {...stepProps} platosSeleccionados={state.platos} />
      case 5:
        return <StepPreferences {...stepProps} />
      case 6:
        return <StepDelivery {...stepProps} />
      case 7:
        return <StepSummary {...stepProps} />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Cocinera a Domicilio · Sabores de Mamá</title>
      </Helmet>

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
          <StepIndicator currentStep={state.step} totalSteps={TOTAL_STEPS} labels={STEP_LABELS} />
        </div>

        <div className="bg-background-surface border border-espresso/10 rounded-2xl p-5 sm:p-7 shadow-[0_10px_40px_rgba(42,28,18,0.06)]">
          {renderStep()}
        </div>
      </main>
    </div>
  )
}
