import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'

// Sonda para leer la ruta actual y poder "retroceder" en los tests.
function LocationProbe() {
  const loc = useLocation()
  const navigate = useNavigate()
  return (
    <div>
      <span data-testid="path">{loc.pathname}</span>
      <button data-testid="goback" onClick={() => navigate(-1)}>
        back
      </button>
    </div>
  )
}

vi.mock('../lib/publicApi', () => ({
  getCupos: vi.fn(),
  getPlatos: vi.fn(),
  getProductosHornear: vi.fn(),
  createPedido: vi.fn(),
  getPedidoResumen: vi.fn(),
  ApiError: class ApiError extends Error {},
}))

import { getCupos, getPlatos, getProductosHornear, createPedido } from '../lib/publicApi'
import { MEAL_PREP_BASE, DELIVERY_COST, fmtCLP } from '../lib/flowConfig'
import MealPrepFlow from '../pages/MealPrepFlow'

const CUPOS = [
  { id: 1, fecha: '2026-07-01T04:00:00.000Z', disponibles: 5, capacidad_maxima: 5 },
  { id: 2, fecha: '2026-07-03T04:00:00.000Z', disponibles: 3, capacidad_maxima: 5 },
]
const DISH_NAMES = ['Pollo', 'Lasaña', 'Cazuela', 'Quiche', 'Tortilla', 'Charqui']
const PLATOS = DISH_NAMES.map((nombre, i) => ({
  id: i + 1,
  nombre,
  descripcion: `desc-${i}`,
  categoria: i < 3 ? 'Categoría A' : 'Categoría B',
}))

beforeEach(() => {
  getCupos.mockReset().mockResolvedValue(CUPOS)
  getPlatos.mockReset().mockResolvedValue(PLATOS)
  getProductosHornear.mockReset().mockResolvedValue([])
  createPedido.mockReset().mockResolvedValue({ id: 123, total: MEAL_PREP_BASE + DELIVERY_COST })
})

function renderFlow() {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={['/meal-prep']}>
        <MealPrepFlow />
      </MemoryRouter>
    </HelmetProvider>
  )
}

const continuar = () => screen.getByRole('button', { name: 'Continuar' })

async function step1to2() {
  fireEvent.change(screen.getByPlaceholderText(/Calle/), { target: { value: 'Av. Siempre Viva 123' } })
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Ñuñoa' } })
  fireEvent.click(continuar())
}
async function step2to3() {
  fireEvent.click((await screen.findByText('5 cupos')).closest('button'))
  fireEvent.click(continuar())
}
async function selectDishes(n) {
  await screen.findByText('Pollo')
  DISH_NAMES.slice(0, n).forEach((name) =>
    fireEvent.click(screen.getByRole('button', { name: new RegExp(name) }))
  )
}

describe('MealPrepFlow (stepper)', () => {
  it('inicia en el paso 1 (StepAddress)', () => {
    renderFlow()
    expect(screen.getByText('¿Dónde entregamos?')).toBeInTheDocument()
  })

  it('no permite avanzar del paso 1 sin dirección y comuna', () => {
    renderFlow()
    // Botón deshabilitado con los campos vacíos.
    expect(continuar()).toBeDisabled()
    // Sólo dirección → sigue deshabilitado.
    fireEvent.change(screen.getByPlaceholderText(/Calle/), { target: { value: 'Calle 1' } })
    expect(continuar()).toBeDisabled()
    // Dirección + comuna → habilitado.
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Las Condes' } })
    expect(continuar()).not.toBeDisabled()
  })

  it('el contador del paso 3 inicia en "0 de 5 platos seleccionados"', async () => {
    renderFlow()
    await step1to2()
    await step2to3()
    expect(await screen.findByText(/de 5 platos seleccionados/)).toHaveTextContent('0 de 5 platos seleccionados')
  })

  it('al seleccionar 5 platos el contador muestra "5 de 5 platos seleccionados"', async () => {
    renderFlow()
    await step1to2()
    await step2to3()
    await selectDishes(5)
    expect(screen.getByText(/de 5 platos seleccionados/)).toHaveTextContent('5 de 5 platos seleccionados')
  })

  it('el botón avanzar del paso 3 está deshabilitado con menos de 5 platos', async () => {
    renderFlow()
    await step1to2()
    await step2to3()
    await selectDishes(4)
    expect(continuar()).toBeDisabled()
  })

  it('no permite avanzar del paso 3 sin exactamente 5 platos (habilita al llegar a 5)', async () => {
    renderFlow()
    await step1to2()
    await step2to3()
    await selectDishes(4)
    expect(continuar()).toBeDisabled()
    // Seleccionar el 5° plato (uno distinto a los 4 ya elegidos).
    fireEvent.click(screen.getByRole('button', { name: /Tortilla/ }))
    expect(continuar()).not.toBeDisabled()
  })

  it('al cambiar de Delivery a Retiro el total se actualiza correctamente', async () => {
    renderFlow()
    await step1to2()
    await step2to3()
    await selectDishes(5)
    fireEvent.click(continuar()) // paso 3 → 4
    fireEvent.click(continuar()) // paso 4 → 5 (entrega)

    // Delivery (por defecto): base + despacho.
    expect(screen.getByText('Total').closest('div').textContent).toContain(
      fmtCLP(MEAL_PREP_BASE + DELIVERY_COST)
    )

    // Cambiar a Retiro → total = base (sin despacho).
    fireEvent.click(screen.getByRole('radio', { name: /Retiro/ }))
    expect(screen.getByText('Total').closest('div').textContent).toContain(fmtCLP(MEAL_PREP_BASE))
  })

  it('el paso de pago no puede retroceder al flujo (navegación con replace)', async () => {
    render(
      <HelmetProvider>
        <MemoryRouter initialEntries={['/', '/meal-prep']} initialIndex={1}>
          <LocationProbe />
          <Routes>
            <Route path="/" element={<div>HOME</div>} />
            <Route path="/meal-prep" element={<MealPrepFlow />} />
            <Route path="/pago/:pedidoId" element={<div>PAGO</div>} />
          </Routes>
        </MemoryRouter>
      </HelmetProvider>
    )

    // Recorrer el flujo completo hasta confirmar.
    await step1to2()
    await step2to3()
    await selectDishes(5)
    fireEvent.click(continuar()) // 3 → 4
    fireEvent.click(continuar()) // 4 → 5
    fireEvent.click(continuar()) // 5 → 6 (resumen)

    fireEvent.change(screen.getByRole('textbox', { name: /Nombre/ }), { target: { value: 'Juan Pérez' } })
    fireEvent.change(screen.getByRole('textbox', { name: /Email/ }), { target: { value: 'juan@example.com' } })
    fireEvent.change(screen.getByRole('textbox', { name: /Teléfono/ }), { target: { value: '+56 9 1111 1111' } })

    fireEvent.click(screen.getByRole('button', { name: /Confirmar Pedido/ }))

    // Navegó a la página de pago (replace).
    await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/pago/123'))

    // Al retroceder NO vuelve a /meal-prep (el resumen fue reemplazado).
    fireEvent.click(screen.getByTestId('goback'))
    expect(screen.getByTestId('path').textContent).toBe('/')
    expect(screen.getByTestId('path').textContent).not.toBe('/meal-prep')
  })
})
