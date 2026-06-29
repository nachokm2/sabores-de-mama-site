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
import BakingAddon from '../components/flow/BakingAddon'
import StepSummary from '../components/flow/StepSummary'

const PRODUCTOS = [
  { id: 10, nombre: 'Brownie Nuez', descripcion: 'con nuez', precio: 9000 },
  { id: 11, nombre: 'Pie de Limón', descripcion: 'cítrico', precio: 8500 },
]

const BASE_DATA = {
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
  total: 65000,
  productos_hornear: [],
  productosHornearDetalle: [],
  nombre: 'Test User',
  email: 'test@example.com',
  telefono: '+56 9 1111 1111',
}

// Wrapper con estado para que las selecciones del add-on se reflejen.
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
  getProductosHornear.mockReset().mockResolvedValue(PRODUCTOS)
  createPedido.mockReset().mockResolvedValue({ id: 1, total: 65000 })
})

describe('BakingAddon', () => {
  it('renderiza los productos para hornear desde la API', async () => {
    render(<BakingAddon data={{ productos_hornear: [] }} update={vi.fn()} />)
    expect(await screen.findByText('Brownie Nuez')).toBeInTheDocument()
    expect(screen.getByText('Pie de Limón')).toBeInTheDocument()
    expect(screen.getByText('$9.000')).toBeInTheDocument()
    expect(screen.getByText(/¿Quieres agregar algo saludable\?/)).toBeInTheDocument()
  })

  it('es opcional: el flujo avanza aunque no se seleccione ningún producto', async () => {
    render(<SummaryWrapper />)
    await screen.findByText('Brownie Nuez') // add-on cargado

    fireEvent.click(screen.getByRole('button', { name: /Confirmar Pedido/ }))

    await waitFor(() => expect(createPedido).toHaveBeenCalledTimes(1))
    const payload = createPedido.mock.calls[0][0]
    expect(payload.productos_hornear).toEqual([])
  })

  it('los productos seleccionados se incluyen en el payload del POST /api/pedidos', async () => {
    render(<SummaryWrapper />)
    await screen.findByText('Brownie Nuez')

    // Seleccionar el Brownie (checkbox dentro de su label).
    const checkbox = screen.getByText('Brownie Nuez').closest('label').querySelector('input[type="checkbox"]')
    fireEvent.click(checkbox)

    fireEvent.click(screen.getByRole('button', { name: /Confirmar Pedido/ }))

    await waitFor(() => expect(createPedido).toHaveBeenCalledTimes(1))
    const payload = createPedido.mock.calls[0][0]
    expect(payload.productos_hornear).toEqual([{ id: 10, nombre: 'Brownie Nuez', precio: 9000 }])
  })
})
