import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'

/**
 * Integración del flujo COMPLETO de Cocinera a Domicilio:
 *   selección de platos → lista de compras generada → edición de cantidades →
 *   confirmación → verificación del pedido enviado (payload que se persiste).
 *
 * La API se mockea (test hermético). La persistencia real en la BD se verifica
 * en el backend (api.integration.test.js: "lista_compras EDITADA en la BD").
 */

vi.mock('../../lib/publicApi', () => ({
  getCupos: vi.fn(),
  getPlatos: vi.fn(),
  getProductosHornear: vi.fn(),
  getIngredientesDePlatos: vi.fn(),
  createPedido: vi.fn(),
  getPedidoResumen: vi.fn(),
  getPrecioBase: vi.fn(() => Promise.resolve(null)),
  ApiError: class ApiError extends Error {},
}))

import {
  getCupos,
  getPlatos,
  getProductosHornear,
  getIngredientesDePlatos,
  createPedido,
} from '../../lib/publicApi'
import CocineraFlow from '../../pages/CocineraFlow'

const CUPOS = [{ id: 1, fecha: '2026-07-01T04:00:00.000Z', disponibles: 5, capacidad_maxima: 5 }]
const DISH_NAMES = ['Pollo', 'Lasaña', 'Cazuela', 'Quiche', 'Tortilla']
const PLATOS = DISH_NAMES.map((nombre, i) => ({ id: i + 1, nombre, descripcion: `d${i}`, categoria: 'Cat' }))
// Lista consolidada que generaría el backend a partir de los 5 platos.
const INGREDIENTES = [
  { id: 1, nombre: 'Arroz', cantidad_total: 350, unidad: 'g', platos: [1, 2] },
  { id: 2, nombre: 'Cebolla', cantidad_total: 3, unidad: 'u', platos: [1, 2, 3] },
]

beforeEach(() => {
  getCupos.mockReset().mockResolvedValue(CUPOS)
  getPlatos.mockReset().mockResolvedValue(PLATOS)
  getProductosHornear.mockReset().mockResolvedValue([])
  getIngredientesDePlatos.mockReset().mockResolvedValue(INGREDIENTES)
  createPedido.mockReset().mockResolvedValue({ id: 321, total: 60000 })
})

const continuar = () => screen.getByRole('button', { name: 'Continuar' })

describe('Integración · flujo completo Cocinera a Domicilio', () => {
  it('selecciona platos, genera y edita la lista, confirma y persiste la lista editada', async () => {
    render(
      <HelmetProvider>
        <MemoryRouter initialEntries={['/cocinera-a-domicilio']}>
          <CocineraFlow />
        </MemoryRouter>
      </HelmetProvider>
    )

    // Paso 1 · Dirección
    fireEvent.change(screen.getByPlaceholderText(/Calle/), { target: { value: 'Av. Siempre Viva 742' } })
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Providencia' } })
    fireEvent.click(continuar())

    // Paso 2 · Fecha
    fireEvent.click((await screen.findByText('5 cupos')).closest('button'))
    fireEvent.click(continuar())

    // Paso 3 · Selección de 5 platos
    await screen.findByText('Pollo')
    DISH_NAMES.forEach((n) => fireEvent.click(screen.getByRole('button', { name: new RegExp(n) })))
    fireEvent.click(continuar())

    // Paso 4 · Lista de compras generada a partir de los 5 platos. Por defecto
    // 2 comensales → cada cantidad (por persona) se multiplica por 2.
    await screen.findByText('Tu lista de compras')
    expect(getIngredientesDePlatos).toHaveBeenCalledWith([1, 2, 3, 4, 5])
    await waitFor(() => expect(screen.getByLabelText('Cantidad de Arroz')).toHaveValue(700))

    // → Edición de cantidad por el cliente: Arroz 700 → 999
    fireEvent.change(screen.getByLabelText('Cantidad de Arroz'), { target: { value: '999' } })
    fireEvent.click(continuar())

    // Pasos 5 y 6 · Preferencias y Entrega (defaults)
    fireEvent.click(continuar()) // 5 → 6
    fireEvent.click(continuar()) // 6 → 7

    // Paso 7 · Datos + confirmación
    fireEvent.change(screen.getByRole('textbox', { name: /Nombre/ }), { target: { value: 'Carla Soto' } })
    fireEvent.change(screen.getByRole('textbox', { name: /Email/ }), { target: { value: 'carla@example.com' } })
    fireEvent.change(screen.getByRole('textbox', { name: /Teléfono/ }), { target: { value: '+56 9 3333 3333' } })
    fireEvent.click(screen.getByRole('button', { name: /Confirmar Pedido/ }))

    // Verificación del pedido enviado (lo que se persiste).
    await waitFor(() => expect(createPedido).toHaveBeenCalledTimes(1))
    const pedido = createPedido.mock.calls[0][0]

    expect(pedido.servicio).toBe('cocinera')
    expect(pedido.nombre).toBe('Carla Soto')
    expect(pedido.platos).toHaveLength(5)
    expect(pedido.personas).toBe(2)
    // La lista_compras editada viaja en el pedido (Arroz con la cantidad editada).
    expect(pedido.lista_compras).toContainEqual({ nombre: 'Arroz', cantidad: '999', unidad: 'g' })
    // Cebolla sin editar: 3 por persona × 2 comensales = 6.
    expect(pedido.lista_compras).toContainEqual({ nombre: 'Cebolla', cantidad: 6, unidad: 'u' })
  })
})
