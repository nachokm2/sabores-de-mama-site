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

import { getPlatos, getProductosHornear, createPedido } from '../lib/publicApi'
import EnsaladasAddon from '../components/flow/EnsaladasAddon'
import StepSummary from '../components/flow/StepSummary'

const PLATOS = [
  { id: 30, nombre: 'César', descripcion: 'clásica', categoria: 'Ensaladas' },
  { id: 31, nombre: 'Primavera', descripcion: 'fresca', categoria: 'Ensaladas' },
  { id: 1, nombre: 'Pollo al Jugo', categoria: 'Carnes y Pollo' }, // no es ensalada
]

const BASE_DATA = {
  servicio: 'meal_prep',
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
  adicionales: [],
  adicionalesTotal: 0,
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
  getPlatos.mockReset().mockResolvedValue(PLATOS)
  getProductosHornear.mockReset().mockResolvedValue([])
  createPedido.mockReset().mockResolvedValue({ id: 1, total: 66500 })
})

describe('EnsaladasAddon', () => {
  it('muestra sólo las ensaladas, a $1.500 c/u', async () => {
    render(<EnsaladasAddon data={{ servicio: 'meal_prep', adicionales: [] }} update={vi.fn()} />)
    expect(await screen.findByText('César')).toBeInTheDocument()
    expect(screen.getByText('Primavera')).toBeInTheDocument()
    // Un plato que no es ensalada no aparece en este add-on.
    expect(screen.queryByText('Pollo al Jugo')).toBeNull()
    expect(screen.getAllByText('+ $1.500').length).toBe(2)
  })

  it('al elegir una ensalada viaja en `adicionales` del pedido a $1.500', async () => {
    render(<SummaryWrapper />)
    await screen.findByText('César')

    const checkbox = screen.getByText('César').closest('label').querySelector('input[type="checkbox"]')
    fireEvent.click(checkbox)

    fireEvent.click(screen.getByRole('button', { name: /Confirmar Pedido/ }))

    await waitFor(() => expect(createPedido).toHaveBeenCalledTimes(1))
    const payload = createPedido.mock.calls[0][0]
    expect(payload.adicionales).toContainEqual({
      clave: 'ensalada-30',
      nombre: 'Ensalada: César',
      precio: 1500,
    })
  })
})
