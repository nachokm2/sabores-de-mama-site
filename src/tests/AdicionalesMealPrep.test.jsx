import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useState } from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../lib/publicApi', () => ({
  getCupos: vi.fn(),
  getPlatos: vi.fn(),
  getProductosHornear: vi.fn(),
  createPedido: vi.fn(),
  getPedidoResumen: vi.fn(),
  ApiError: class ApiError extends Error {},
}))

import { getProductosHornear, createPedido } from '../lib/publicApi'
import AdicionalesMealPrep from '../components/flow/AdicionalesMealPrep'
import StepSummary from '../components/flow/StepSummary'
import { computeTotal } from '../lib/flowConfig'

const BASE_DATA = {
  servicio: 'meal_prep',
  base: 60000,
  direccion: 'Calle 1',
  comuna: 'Ñuñoa',
  fecha_entrega: '2026-07-01',
  platos: [1, 2, 3, 4, 5],
  platosDetalle: [
    { id: 1, nombre: 'A' },
    { id: 2, nombre: 'B' },
    { id: 3, nombre: 'C' },
    { id: 4, nombre: 'D' },
    { id: 5, nombre: 'E' },
  ],
  restricciones: [],
  observaciones: '',
  tipo_entrega: 'delivery',
  costo_despacho: 5000,
  bakingTotal: 0,
  productos_hornear: [],
  productosHornearDetalle: [],
  // Servicios adicionales con precios configurados.
  costoIngredientes: 1000,
  costoPorcionado: 3000,
  adicionales: [],
  adicionalesTotal: 0,
  total: computeTotal({ base: 60000, costo_despacho: 5000 }),
  nombre: 'Test User',
  email: 'test@example.com',
  telefono: '+56 9 1111 1111',
}

function SummaryWrapper({ initial = BASE_DATA }) {
  const [data, setData] = useState(initial)
  const update = (p) => setData((d) => ({ ...d, ...p }))
  return (
    <MemoryRouter>
      <StepSummary data={data} update={update} onBack={vi.fn()} />
    </MemoryRouter>
  )
}

beforeEach(() => {
  getProductosHornear.mockReset().mockResolvedValue([])
  createPedido.mockReset().mockResolvedValue({ id: 1, total: 65000 })
})

describe('AdicionalesMealPrep', () => {
  it('renderiza los dos adicionales con los precios configurados', () => {
    render(<AdicionalesMealPrep data={BASE_DATA} update={vi.fn()} />)
    expect(screen.getByText('Compra de ingredientes en el supermercado')).toBeInTheDocument()
    expect(screen.getByText('Platos porcionados')).toBeInTheDocument()
    expect(screen.getByText('+ $1.000')).toBeInTheDocument()
    expect(screen.getByText('+ $3.000')).toBeInTheDocument()
  })

  it('al marcar un adicional recalcula el total y lo suma', () => {
    const update = vi.fn()
    render(<AdicionalesMealPrep data={BASE_DATA} update={update} />)

    const checkbox = screen
      .getByText('Platos porcionados')
      .closest('label')
      .querySelector('input[type="checkbox"]')
    fireEvent.click(checkbox)

    expect(update).toHaveBeenCalledTimes(1)
    const payload = update.mock.calls[0][0]
    expect(payload.adicionalesTotal).toBe(3000)
    expect(payload.adicionales).toEqual([{ clave: 'porcionado', nombre: 'Platos porcionados', precio: 3000 }])
    // base 60000 + despacho 5000 + adicional 3000
    expect(payload.total).toBe(68000)
  })

  it('los adicionales elegidos se incluyen en el payload del POST /api/pedidos', async () => {
    render(<SummaryWrapper />)
    await screen.findByText('Platos porcionados')

    const checkbox = screen
      .getByText('Compra de ingredientes en el supermercado')
      .closest('label')
      .querySelector('input[type="checkbox"]')
    fireEvent.click(checkbox)

    fireEvent.click(screen.getByRole('button', { name: /Confirmar Pedido/ }))

    await waitFor(() => expect(createPedido).toHaveBeenCalledTimes(1))
    const payload = createPedido.mock.calls[0][0]
    expect(payload.adicionales).toEqual([
      { clave: 'ingredientes', nombre: 'Compra de ingredientes en el supermercado', precio: 1000 },
    ])
  })
})
