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
// \b evita que el nombre del plato matchee el encabezado de su categoría
// (p. ej. "Quiche"/"Tortilla" ⊂ "Quiches y Tortillas").
const platoBtn = (nombre) => screen.getByRole('button', { name: new RegExp(nombre + '\\b') })
const buscador = () => screen.getByLabelText('Buscar plato por nombre')

// Espera a que carguen las categorías (acordeones colapsados) y las despliega
// todas para poder interactuar con los platos por nombre.
async function loadAndExpand() {
  const headers = await screen.findAllByRole('button', { expanded: false })
  headers.forEach((b) => fireEvent.click(b))
}

beforeEach(() => {
  getPlatos.mockReset().mockResolvedValue(PLATOS)
})

describe('StepDishes', () => {
  it('llama a getPlatos (GET /api/platos) al montar', async () => {
    render(<Wrapper />)
    await waitFor(() => expect(getPlatos).toHaveBeenCalledTimes(1))
  })

  it('las categorías inician colapsadas: los platos no se ven hasta desplegar', async () => {
    render(<Wrapper />)
    // El encabezado de categoría existe, pero el plato no está en el DOM aún.
    await screen.findByRole('button', { name: /Carnes y Pollo/ })
    expect(screen.queryByText('Pollo al Curry')).toBeNull()
    // Al desplegar la categoría, aparece el plato.
    fireEvent.click(screen.getByRole('button', { name: /Carnes y Pollo/ }))
    expect(screen.getByText('Pollo al Curry')).toBeInTheDocument()
  })

  it('el buscador filtra por nombre (acento-insensible) y auto-despliega', async () => {
    render(<Wrapper />)
    await screen.findByRole('button', { name: /Carnes y Pollo/ })

    // Sin tilde debe encontrar "Charquicán".
    fireEvent.change(buscador(), { target: { value: 'charquican' } })
    expect(screen.getByText('Charquicán')).toBeInTheDocument()
    // Los que no coinciden no se muestran.
    expect(screen.queryByText('Pollo al Curry')).toBeNull()
    expect(screen.queryByText('Lasaña')).toBeNull()
  })

  it('muestra un mensaje cuando la búsqueda no tiene resultados', async () => {
    render(<Wrapper />)
    await screen.findByRole('button', { name: /Carnes y Pollo/ })
    fireEvent.change(buscador(), { target: { value: 'zzz-no-existe' } })
    expect(screen.getByText(/No encontramos platos/)).toBeInTheDocument()
  })

  it('el contador inicia en "0 de 5"', async () => {
    render(<Wrapper />)
    await screen.findByRole('button', { name: /Carnes y Pollo/ })
    expect(contador()).toHaveTextContent('0 de 5 platos seleccionados')
  })

  it('el contador se actualiza con cada selección y deselección', async () => {
    render(<Wrapper />)
    await loadAndExpand()

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
    await loadAndExpand()

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
