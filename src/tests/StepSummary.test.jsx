import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../lib/publicApi', () => ({
  getCupos: vi.fn(),
  getPlatos: vi.fn(),
  getProductosHornear: vi.fn(),
  getIngredientesDePlatos: vi.fn(),
  createPedido: vi.fn(),
  getPedidoResumen: vi.fn(),
  ApiError: class ApiError extends Error {},
}))

import { getProductosHornear } from '../lib/publicApi'
import StepSummary from '../components/flow/StepSummary'

const BASE = {
  direccion: 'Calle 1',
  comuna: 'Ñuñoa',
  fecha_entrega: '2026-07-01',
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
  total: 60000,
  productos_hornear: [],
  productosHornearDetalle: [],
  bakingTotal: 0,
  nombre: '',
  email: '',
  telefono: '',
}

function renderSummary(data) {
  render(
    <MemoryRouter>
      <StepSummary data={data} update={vi.fn()} onBack={vi.fn()} />
    </MemoryRouter>
  )
}

beforeEach(() => {
  getProductosHornear.mockReset().mockResolvedValue([])
})

describe('StepSummary · reutilización en Cocinera', () => {
  it('muestra la lista de compras cuando el servicio es "cocinera"', () => {
    renderSummary({
      ...BASE,
      servicio: 'cocinera',
      serviceLabel: 'Cocinera a Domicilio',
      base: 55000,
      lista_compras: [
        { nombre: 'Arroz', cantidad: 350, unidad: 'g' },
        { nombre: 'Cebolla', cantidad: 2, unidad: 'u' },
        { nombre: 'Sal', cantidad: 1, unidad: 'cdta' },
      ],
    })

    expect(screen.getByText('Lista de compras')).toBeInTheDocument()
    expect(screen.getByText('3 ingredientes')).toBeInTheDocument()
  })

  it('NO muestra la lista de compras en Meal Prep (lista vacía)', () => {
    renderSummary({ ...BASE, servicio: 'meal_prep', base: 60000, lista_compras: [] })
    expect(screen.queryByText('Lista de compras')).not.toBeInTheDocument()
  })
})
