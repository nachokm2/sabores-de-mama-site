import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'

vi.mock('../lib/publicApi', () => ({
  getCupos: vi.fn(),
  getPlatos: vi.fn(),
  getProductosHornear: vi.fn(),
  createPedido: vi.fn(),
  getPedidoResumen: vi.fn(),
  ApiError: class ApiError extends Error {},
}))

import { getPedidoResumen } from '../lib/publicApi'
import StepPayment from '../pages/StepPayment'

// `t` es el token del resumen: sin él la página no consulta la API (el endpoint
// responde 403). El flujo real lo pone en la URL al confirmar el pedido.
function renderPayment({ state, token = 'tok123' } = {}) {
  const search = token ? `?t=${token}` : ''
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[{ pathname: '/pago/123', search, state }]}>
        <Routes>
          <Route path="/pago/:pedidoId" element={<StepPayment />} />
          <Route path="/" element={<div>HOME PAGE</div>} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>
  )
}

beforeEach(() => {
  getPedidoResumen.mockReset().mockResolvedValue({
    id: 123,
    total: 74000,
    estado: 'solicitud_recibida',
    fecha_entrega: '2026-07-01',
  })
})

describe('StepPayment', () => {
  it('se renderiza correctamente con un pedidoId válido', () => {
    renderPayment()
    expect(screen.getByText('¡Casi listo!')).toBeInTheDocument()
    expect(screen.getAllByText(/#123/).length).toBeGreaterThan(0)
  })

  it('muestra el monto correcto del pedido', async () => {
    renderPayment()
    // Sin state → lo obtiene del endpoint de resumen (mock: total 74000).
    await waitFor(() => expect(getPedidoResumen).toHaveBeenCalledWith('123', 'tok123'))
    expect(await screen.findByText('$74.000')).toBeInTheDocument()
  })

  it('sin token en la URL no consulta el resumen', async () => {
    renderPayment({ token: null })
    expect(screen.getByText('¡Casi listo!')).toBeInTheDocument()
    expect(getPedidoResumen).not.toHaveBeenCalled()
  })

  it('usa el monto del state de navegación si está presente', async () => {
    renderPayment({ state: { total: 88000 } })
    expect(await screen.findByText('$88.000')).toBeInTheDocument()
  })

  it('el botón "Volver al inicio" navega a /', async () => {
    renderPayment()
    fireEvent.click(screen.getByRole('link', { name: /Volver al inicio/ }))
    expect(await screen.findByText('HOME PAGE')).toBeInTheDocument()
  })
})
