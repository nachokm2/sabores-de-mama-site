import { useState } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
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

import { getProductosHornear, createPedido } from '../lib/publicApi'
import StepSummary from '../components/flow/StepSummary'
import { TERMINOS_VERSION } from '../data/terminos'

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

/**
 * Igual que `renderSummary`, pero con estado real: la casilla de los Términos y
 * Condiciones se controla desde `data`, así que sin un `update` que realmente
 * mute el estado marcarla no cambiaría nada.
 */
function renderSummaryConEstado(inicial) {
  function Host() {
    const [data, setData] = useState(inicial)
    return <StepSummary data={data} update={(p) => setData((d) => ({ ...d, ...p }))} onBack={vi.fn()} />
  }
  render(
    <MemoryRouter>
      <Host />
    </MemoryRouter>
  )
}

const DATOS_COMPLETOS = {
  ...BASE,
  servicio: 'meal_prep',
  base: 60000,
  nombre: 'Ana Pérez',
  email: 'ana@example.com',
  telefono: '+56 9 1234 5678',
}

const confirmar = () => screen.getByRole('button', { name: /Confirmar Pedido/ })
const casillaTerminos = () => screen.getByRole('checkbox', { name: /Términos y Condiciones/ })

beforeEach(() => {
  getProductosHornear.mockReset().mockResolvedValue([])
  createPedido.mockReset().mockResolvedValue({ id: 123, total: 65000, resumen_token: 'tok' })
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

describe('StepSummary · aceptación de los Términos y Condiciones', () => {
  it('con los datos completos pero SIN aceptar, el botón sigue deshabilitado y no envía nada', () => {
    renderSummaryConEstado(DATOS_COMPLETOS)

    expect(casillaTerminos()).not.toBeChecked()
    expect(confirmar()).toBeDisabled()

    fireEvent.click(confirmar())
    expect(createPedido).not.toHaveBeenCalled()
  })

  it('al marcar la casilla se habilita el botón, y al desmarcarla se vuelve a bloquear', () => {
    renderSummaryConEstado(DATOS_COMPLETOS)

    fireEvent.click(casillaTerminos())
    expect(confirmar()).toBeEnabled()

    fireEvent.click(casillaTerminos())
    expect(confirmar()).toBeDisabled()
  })

  it('la casilla NO reemplaza al resto de la validación (sin email válido sigue bloqueado)', () => {
    renderSummaryConEstado({ ...DATOS_COMPLETOS, email: 'no-es-un-email' })

    fireEvent.click(casillaTerminos())
    expect(confirmar()).toBeDisabled()
  })

  it('el enlace a los términos abre en una pestaña nueva (no se pierde el pedido en curso)', () => {
    renderSummaryConEstado(DATOS_COMPLETOS)

    const enlace = screen.getByRole('link', { name: /Términos y Condiciones/ })
    expect(enlace).toHaveAttribute('href', '/terminos-y-condiciones')
    expect(enlace).toHaveAttribute('target', '_blank')
    expect(enlace).toHaveAttribute('rel', expect.stringContaining('noopener'))
  })

  it('el pedido viaja con el respaldo de la aceptación: versión, fecha y confirmación', async () => {
    const antes = Date.now()
    renderSummaryConEstado(DATOS_COMPLETOS)

    fireEvent.click(casillaTerminos())
    fireEvent.click(confirmar())

    await waitFor(() => expect(createPedido).toHaveBeenCalledTimes(1))
    const payload = createPedido.mock.calls[0][0]

    expect(payload.acepta_terminos).toBe(true)
    expect(payload.terminos_version).toBe(TERMINOS_VERSION)
    // La fecha registrada es la del clic en la casilla, no la del envío.
    const aceptadoEn = Date.parse(payload.terminos_aceptados_en)
    expect(Number.isFinite(aceptadoEn)).toBe(true)
    expect(aceptadoEn).toBeGreaterThanOrEqual(antes)
    expect(aceptadoEn).toBeLessThanOrEqual(Date.now())
  })
})
