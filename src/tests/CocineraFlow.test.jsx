import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'

vi.mock('../lib/publicApi', () => ({
  getCupos: vi.fn(),
  getPlatos: vi.fn(),
  getProductosHornear: vi.fn(),
  getIngredientesDePlatos: vi.fn(),
  createPedido: vi.fn(),
  getPedidoResumen: vi.fn(),
  ApiError: class ApiError extends Error {},
}))

import {
  getCupos,
  getPlatos,
  getProductosHornear,
  getIngredientesDePlatos,
  createPedido,
} from '../lib/publicApi'
import CocineraFlow from '../pages/CocineraFlow'

const CUPOS = [{ id: 1, fecha: '2026-07-01T04:00:00.000Z', disponibles: 5, capacidad_maxima: 5 }]
const DISH_NAMES = ['Pollo', 'Lasaña', 'Cazuela', 'Quiche', 'Tortilla']
const PLATOS = DISH_NAMES.map((nombre, i) => ({ id: i + 1, nombre, descripcion: `d${i}`, categoria: 'Cat' }))
// Ingredientes ya consolidados que devolvería el endpoint (Arroz de 2 platos).
const INGREDIENTES = [
  { id: 1, nombre: 'Arroz', cantidad_total: 350, unidad: 'g', platos: [1, 2] },
  { id: 2, nombre: 'Cebolla', cantidad_total: 3, unidad: 'u', platos: [1, 2, 3] },
]

beforeEach(() => {
  getCupos.mockReset().mockResolvedValue(CUPOS)
  getPlatos.mockReset().mockResolvedValue(PLATOS)
  getProductosHornear.mockReset().mockResolvedValue([])
  getIngredientesDePlatos.mockReset().mockResolvedValue(INGREDIENTES)
  createPedido.mockReset().mockResolvedValue({ id: 200, total: 60000 })
})

function renderFlow() {
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={['/cocinera-a-domicilio']}>
        <CocineraFlow />
      </MemoryRouter>
    </HelmetProvider>
  )
}

const continuar = () => screen.getByRole('button', { name: 'Continuar' })

async function step1to2() {
  fireEvent.change(screen.getByPlaceholderText(/Calle/), { target: { value: 'Calle 1' } })
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Ñuñoa' } })
  fireEvent.click(continuar())
}
async function step2to3() {
  fireEvent.click((await screen.findByText('5 cupos')).closest('button'))
  fireEvent.click(continuar())
}
async function selectDishes() {
  await screen.findByText('Pollo')
  DISH_NAMES.forEach((n) => fireEvent.click(screen.getByRole('button', { name: new RegExp(n) })))
}

describe('CocineraFlow (7 pasos)', () => {
  it('inicia en el paso 1 y el stepper tiene 7 pasos en total', () => {
    renderFlow()
    // Paso 1 activo (StepAddress).
    expect(screen.getByText('¿Dónde entregamos?')).toBeInTheDocument()
    // Indicador con 7 pasos: incluye el paso extra "Lista" y el círculo "7".
    expect(screen.getByText('Lista')).toBeInTheDocument()
    expect(screen.getByText('Resumen')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
  })

  it('los mismos componentes Step* (StepDishes) funcionan en el contexto de Cocinera', async () => {
    renderFlow()
    await step1to2()
    await step2to3()
    // StepDishes (el mismo componente de Meal Prep) opera igual aquí.
    expect(await screen.findByText(/de 5 platos seleccionados/)).toHaveTextContent('0 de 5 platos seleccionados')
    await selectDishes()
    expect(screen.getByText(/de 5 platos seleccionados/)).toHaveTextContent('5 de 5 platos seleccionados')
    expect(continuar()).not.toBeDisabled()
  })

  it('el paso 4 (ShoppingList) aparece después de seleccionar 5 platos', async () => {
    renderFlow()
    await step1to2()
    await step2to3()
    await selectDishes()
    fireEvent.click(continuar()) // paso 3 → 4
    expect(await screen.findByText('Tu lista de compras')).toBeInTheDocument()
    await waitFor(() => expect(getIngredientesDePlatos).toHaveBeenCalled())
  })

  it('el POST /api/pedidos incluye servicio "cocinera" y lista_compras consolidada', async () => {
    renderFlow()
    await step1to2()
    await step2to3()
    await selectDishes()
    fireEvent.click(continuar()) // 3 → 4 (ShoppingList)
    await screen.findByText('Tu lista de compras')
    fireEvent.click(continuar()) // 4 → 5 (Preferencias)
    fireEvent.click(continuar()) // 5 → 6 (Entrega)
    fireEvent.click(continuar()) // 6 → 7 (Resumen)

    fireEvent.change(screen.getByRole('textbox', { name: /Nombre/ }), { target: { value: 'Ana' } })
    fireEvent.change(screen.getByRole('textbox', { name: /Email/ }), { target: { value: 'ana@example.com' } })
    fireEvent.change(screen.getByRole('textbox', { name: /Teléfono/ }), { target: { value: '+56 9 2222 2222' } })

    fireEvent.click(screen.getByRole('button', { name: /Confirmar Pedido/ }))

    await waitFor(() => expect(createPedido).toHaveBeenCalledTimes(1))
    const payload = createPedido.mock.calls[0][0]
    expect(payload.servicio).toBe('cocinera')
    expect(payload.lista_compras).toEqual([
      { nombre: 'Arroz', cantidad: 350, unidad: 'g' },
      { nombre: 'Cebolla', cantidad: 3, unidad: 'u' },
    ])
  })
})
