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
  // Carnes y Pollo lleva guarnición por categoría (sin flag manual).
  { id: 1, nombre: 'Pollo al Curry', descripcion: 'curry', categoria: 'Carnes y Pollo' },
  { id: 2, nombre: 'Lasaña', descripcion: 'pasta', categoria: 'Otros Platos' },
  { id: 3, nombre: 'Cazuela', descripcion: 'caldo', categoria: 'Legumbres y Caldos' },
  { id: 4, nombre: 'Quiche', descripcion: 'tarta', categoria: 'Quiches y Tortillas' },
  { id: 5, nombre: 'Tortilla', descripcion: 'huevo', categoria: 'Quiches y Tortillas' },
  { id: 6, nombre: 'Charquicán', descripcion: 'guiso', categoria: 'Otros Platos' },
  // Excepción configurable: flag manual en una categoría que normalmente no lleva.
  { id: 9, nombre: 'Especial de la casa', descripcion: 'x', categoria: 'Otros Platos', lleva_acompanamiento: true },
  // Ensalada: NO cuenta para los 5 (se cobra aparte como adicional).
  { id: 12, nombre: 'Ensalada Surtida', descripcion: 'mix', categoria: 'Ensaladas' },
  // Acompañamientos: NO cuentan para los 5 ni aparecen en la selección.
  { id: 7, nombre: 'Arroz', descripcion: '', categoria: 'Acompañamientos' },
  { id: 8, nombre: 'Puré', descripcion: '', categoria: 'Acompañamientos' },
]

// Wrapper con estado: StepDishes es controlado, así reflejamos las selecciones.
function Wrapper() {
  const [data, setData] = useState({ platos: [], platosDetalle: [] })
  const update = (partial) => setData((d) => ({ ...d, ...partial }))
  return (
    <>
      <StepDishes data={data} update={update} onNext={vi.fn()} onBack={vi.fn()} />
      <pre data-testid="pd">{JSON.stringify(data.platosDetalle)}</pre>
    </>
  )
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

  it('los acompañamientos no aparecen en la selección (no son platos)', async () => {
    render(<Wrapper />)
    await loadAndExpand()
    // "Arroz"/"Puré" son acompañamientos → no se pueden elegir como plato.
    expect(screen.queryByRole('button', { name: /^Arroz/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /^Puré/ })).toBeNull()
    // Tampoco existe el acordeón de la categoría Acompañamientos.
    expect(screen.queryByRole('button', { name: /Acompañamientos/ })).toBeNull()
  })

  it('los platos de categoría Ensaladas no aparecen en la selección (se cobran aparte)', async () => {
    render(<Wrapper />)
    await loadAndExpand()
    expect(screen.queryByRole('button', { name: /Ensalada Surtida/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /Ensaladas/ })).toBeNull()
  })

  it('un plato de "Carnes y Pollo" lleva acompañamiento por categoría (sin flag)', async () => {
    render(<Wrapper />)
    await loadAndExpand()

    fireEvent.click(platoBtn('Pollo al Curry'))

    // Aparece el selector de guarnición para ese plato (autoselecciona el 1º).
    const select = await screen.findByLabelText('Acompañamiento para Pollo al Curry')
    expect(select).toBeInTheDocument()
    expect(screen.getByTestId('pd')).toHaveTextContent('"acompanamiento":{"id":7,"nombre":"Arroz"}')

    // Cambiar a Puré se refleja en el estado del flujo.
    fireEvent.change(select, { target: { value: '8' } })
    expect(screen.getByTestId('pd')).toHaveTextContent('"acompanamiento":{"id":8,"nombre":"Puré"}')
  })

  it('un plato de otra categoría NO muestra selector de guarnición', async () => {
    render(<Wrapper />)
    await loadAndExpand()

    fireEvent.click(platoBtn('Lasaña')) // Otros Platos, sin flag
    expect(screen.queryByText('Elige el acompañamiento')).toBeNull()
    expect(screen.queryByLabelText(/Acompañamiento para/)).toBeNull()
    expect(screen.getByTestId('pd')).toHaveTextContent('"acompanamiento":null')
  })

  it('el flag manual funciona como excepción (override) en categorías sin acompañamiento', async () => {
    render(<Wrapper />)
    await loadAndExpand()

    fireEvent.click(platoBtn('Especial de la casa')) // Otros Platos, lleva_acompanamiento: true
    const select = await screen.findByLabelText('Acompañamiento para Especial de la casa')
    expect(select).toBeInTheDocument()
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
