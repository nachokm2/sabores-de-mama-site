import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useState } from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('../lib/publicApi', () => ({
  getCupos: vi.fn(),
  getPlatos: vi.fn(),
  getProductosHornear: vi.fn(),
  createPedido: vi.fn(),
  getPedidoResumen: vi.fn(),
  ApiError: class ApiError extends Error {},
}))

import { getPlatos } from '../lib/publicApi'
import StepDishes from '../components/flow/StepDishes'

const PLATOS = [
  { id: 1, nombre: 'Pollo al Curry', descripcion: 'curry', categoria: 'Carnes y Pollo' },
  { id: 2, nombre: 'Lasaña', descripcion: 'pasta', categoria: 'Otros Platos' },
  { id: 3, nombre: 'Cazuela', descripcion: 'caldo', categoria: 'Legumbres y Caldos' },
  { id: 4, nombre: 'Quiche', descripcion: 'tarta', categoria: 'Quiches y Tortillas' },
  { id: 5, nombre: 'Tortilla', descripcion: 'huevo', categoria: 'Quiches y Tortillas' },
  { id: 6, nombre: 'Charquicán', descripcion: 'guiso', categoria: 'Otros Platos' },
]

// Wrapper con estado: StepDishes es controlado, así reflejamos las selecciones.
function Wrapper() {
  const [data, setData] = useState({ platos: [], platosDetalle: [] })
  const update = (partial) => setData((d) => ({ ...d, ...partial }))
  return <StepDishes data={data} update={update} onNext={vi.fn()} onBack={vi.fn()} />
}

const contador = () => screen.getByText(/de 5 platos seleccionados/)
const platoBtn = (nombre) => screen.getByRole('button', { name: new RegExp(nombre) })

beforeEach(() => {
  getPlatos.mockReset().mockResolvedValue(PLATOS)
})

describe('StepDishes', () => {
  it('llama a getPlatos (GET /api/platos) al montar', async () => {
    render(<Wrapper />)
    await waitFor(() => expect(getPlatos).toHaveBeenCalledTimes(1))
  })

  it('el contador inicia en "0 de 5"', async () => {
    render(<Wrapper />)
    await screen.findByText('Pollo al Curry')
    expect(contador()).toHaveTextContent('0 de 5 platos seleccionados')
  })

  it('el contador se actualiza con cada selección y deselección', async () => {
    render(<Wrapper />)
    await screen.findByText('Pollo al Curry')

    fireEvent.click(platoBtn('Pollo al Curry'))
    expect(contador()).toHaveTextContent('1 de 5 platos seleccionados')

    fireEvent.click(platoBtn('Lasaña'))
    expect(contador()).toHaveTextContent('2 de 5 platos seleccionados')

    // Deseleccionar
    fireEvent.click(platoBtn('Pollo al Curry'))
    expect(contador()).toHaveTextContent('1 de 5 platos seleccionados')
  })

  it('no permite seleccionar más de 5 platos (el 6to click no tiene efecto)', async () => {
    render(<Wrapper />)
    await screen.findByText('Pollo al Curry')

    ;['Pollo al Curry', 'Lasaña', 'Cazuela', 'Quiche', 'Tortilla'].forEach((n) =>
      fireEvent.click(platoBtn(n))
    )
    expect(contador()).toHaveTextContent('5 de 5 platos seleccionados')

    // El 6to plato queda deshabilitado y su click no cambia el conteo.
    const sexto = platoBtn('Charquicán')
    expect(sexto).toBeDisabled()
    fireEvent.click(sexto)
    expect(contador()).toHaveTextContent('5 de 5 platos seleccionados')
  })
})
