import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
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

// Deshace los spyOn de medidas del DOM (sólo los usa el test de "Ver más").
afterEach(() => {
  vi.restoreAllMocks()
})

describe('BakingAddon', () => {
  it('renderiza los productos para hornear desde la API', async () => {
    render(<BakingAddon data={{ productos_hornear: [] }} update={vi.fn()} />)
    expect(await screen.findByText('Brownie Nuez')).toBeInTheDocument()
    expect(screen.getByText('Pie de Limón')).toBeInTheDocument()
    expect(screen.getByText('$9.000')).toBeInTheDocument()
    expect(screen.getByText(/¿Quieres agregar algo saludable\?/)).toBeInTheDocument()
  })

  it('los productos con etiqueta salen agrupados en un recuadro destacado', async () => {
    getProductosHornear.mockResolvedValue([
      { id: 20, nombre: 'Pan de Pascua Tradicional', formato: '1 kg', precio: 9500, etiqueta: 'Pan de Pascua 🎄' },
      { id: 21, nombre: 'Pan de Pascua Frutos Secos', formato: '1 kg', precio: 10500, etiqueta: 'Pan de Pascua 🎄' },
      ...PRODUCTOS,
    ])
    const update = vi.fn()
    render(<BakingAddon data={{ productos_hornear: [] }} update={update} />)

    const titulo = await screen.findByRole('heading', { name: 'Pan de Pascua 🎄' })
    const recuadro = titulo.closest('section')
    expect(recuadro).toHaveTextContent('Pan de Pascua Tradicional')
    expect(recuadro).toHaveTextContent('$10.500')
    // Los normales quedan fuera del recuadro destacado, en su bloque de siempre.
    expect(recuadro).not.toHaveTextContent('Brownie Nuez')
    expect(screen.getByText(/¿Quieres agregar algo saludable\?/)).toBeInTheDocument()

    // Se agregan al pedido igual que cualquier otro producto.
    fireEvent.click(screen.getByText('Pan de Pascua Tradicional').closest('label').querySelector('input'))
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        productos_hornear: [20],
        productosHornearDetalle: [{ id: 20, nombre: 'Pan de Pascua Tradicional', precio: 9500 }],
        bakingTotal: 9500,
      })
    )
  })

  it('recorta la descripción larga con "Ver más" sin marcar el producto', async () => {
    const larga =
      'Galletas artesanales elaboradas con harina de avena, harina integral, miel, huevo, limón y polvo de hornear. Suaves y frescas.'
    // jsdom no calcula layout: se simula que sólo el texto largo desborda sus 2 líneas.
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(40)
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(function () {
      return this.textContent === larga ? 80 : 40
    })
    getProductosHornear.mockResolvedValue([
      { id: 30, nombre: 'Galletas de Avena y Limón', porciones: '10', precio: 8000, descripcion: larga },
      { id: 31, nombre: 'Kuchen', formato: 'Molde 20 cm', porciones: '8 a 10 porciones', precio: 9000, descripcion: 'Corta.' },
    ])
    const update = vi.fn()
    render(<BakingAddon data={{ productos_hornear: [] }} update={update} />)

    // Un número solo en porciones se lee como unidades; un texto se deja tal cual.
    expect(await screen.findByText('10 unidades')).toBeInTheDocument()
    expect(screen.getByText('Molde 20 cm · 8 a 10 porciones')).toBeInTheDocument()

    const desc = screen.getByText(larga)
    expect(desc.className).toMatch(/line-clamp-2/)
    // La descripción corta no lleva "Ver más".
    expect(screen.getAllByRole('button', { name: 'Ver más' })).toHaveLength(1)

    fireEvent.click(screen.getByRole('button', { name: 'Ver más' }))
    expect(desc.className).not.toMatch(/line-clamp-2/)
    expect(screen.getByRole('button', { name: 'Ver menos' })).toBeInTheDocument()
    // Abrir la descripción no agrega el producto al pedido.
    expect(update).not.toHaveBeenCalled()
  })

  it('es opcional: el flujo avanza aunque no se seleccione ningún producto', async () => {
    render(<SummaryWrapper />)
    await screen.findByText('Brownie Nuez') // add-on cargado

    // Términos y Condiciones: primero LEER (la casilla está bloqueada hasta
    // recorrer el modal) y después aceptar.
    fireEvent.click(screen.getByRole('button', { name: /Leer los Términos y Condiciones/ }))
    fireEvent.click(screen.getByRole('button', { name: /He leído los términos/ }))
    fireEvent.click(screen.getByRole('checkbox', { name: /Términos y Condiciones/ }))
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

    // Términos y Condiciones: primero LEER (la casilla está bloqueada hasta
    // recorrer el modal) y después aceptar.
    fireEvent.click(screen.getByRole('button', { name: /Leer los Términos y Condiciones/ }))
    fireEvent.click(screen.getByRole('button', { name: /He leído los términos/ }))
    fireEvent.click(screen.getByRole('checkbox', { name: /Términos y Condiciones/ }))
    fireEvent.click(screen.getByRole('button', { name: /Confirmar Pedido/ }))

    await waitFor(() => expect(createPedido).toHaveBeenCalledTimes(1))
    const payload = createPedido.mock.calls[0][0]
    expect(payload.productos_hornear).toEqual([{ id: 10, nombre: 'Brownie Nuez', precio: 9000 }])
  })
})
