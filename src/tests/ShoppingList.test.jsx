import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useState } from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('../lib/publicApi', () => ({
  getCupos: vi.fn(),
  getPlatos: vi.fn(),
  getProductosHornear: vi.fn(),
  getIngredientesDePlatos: vi.fn(),
  createPedido: vi.fn(),
  getPedidoResumen: vi.fn(),
  ApiError: class ApiError extends Error {},
}))

import { getIngredientesDePlatos } from '../lib/publicApi'
import ShoppingList from '../components/flow/ShoppingList'

// El endpoint devuelve ingredientes consolidados YA con la cantidad EXACTA para
// el nº de personas consultado (Arroz proviene de 2 platos).
const ingredientesPara = (ids, personas = 1) => [
  { id: 1, nombre: 'Arroz', cantidad: 350 * personas, unidad: 'g', platos: [1, 2] },
  { id: 2, nombre: 'Cebolla', cantidad: 2 * personas, unidad: 'u', platos: [1, 2] },
]

function Wrapper({ ids = [1, 2] }) {
  const [data, setData] = useState({ platos: ids, lista_compras: [] })
  const update = (p) => setData((d) => ({ ...d, ...p }))
  return (
    <>
      <ShoppingList data={data} update={update} platosSeleccionados={ids} onNext={vi.fn()} onBack={vi.fn()} />
      <pre data-testid="estado">{JSON.stringify(data.lista_compras)}</pre>
    </>
  )
}

beforeEach(() => {
  getIngredientesDePlatos.mockReset().mockImplementation((ids, personas = 1) =>
    Promise.resolve(ingredientesPara(ids, personas))
  )
})

describe('ShoppingList', () => {
  it('llama a GET /api/platos/ingredientes (getIngredientesDePlatos) al montar', async () => {
    render(<Wrapper ids={[1, 2, 3]} />)
    await waitFor(() => expect(getIngredientesDePlatos).toHaveBeenCalledWith([1, 2, 3], 1))
  })

  it('muestra los ingredientes consolidados (una sola fila por ingrediente, con el total sumado)', async () => {
    render(<Wrapper />)
    // El ingrediente "Arroz" (que viene de 2 platos) aparece UNA sola vez, con su total.
    expect(await screen.findAllByText('Arroz')).toHaveLength(1)
    expect(screen.getByLabelText('Cantidad de Arroz')).toHaveValue(350)
  })

  it('los campos de cantidad son editables (input numérico)', async () => {
    render(<Wrapper />)
    const input = await screen.findByLabelText('Cantidad de Arroz')
    expect(input).toHaveAttribute('type', 'number')
    expect(input).not.toBeDisabled()
  })

  it('los cambios del usuario se reflejan en el estado del flujo', async () => {
    render(<Wrapper />)
    const input = await screen.findByLabelText('Cantidad de Arroz')

    fireEvent.change(input, { target: { value: '500' } })

    expect(input).toHaveValue(500)
    expect(screen.getByTestId('estado')).toHaveTextContent('"nombre":"Arroz","cantidad":"500","unidad":"g"')
  })

  it('el botón "Descargar lista" está presente', async () => {
    render(<Wrapper />)
    await screen.findByText('Arroz')
    expect(screen.getByRole('button', { name: /Descargar lista/i })).toBeInTheDocument()
  })

  it('permite elegir el número de personas (1 a 5)', async () => {
    render(<Wrapper />)
    await screen.findByText('Arroz')
    for (const n of [1, 2, 3, 4, 5]) {
      expect(screen.getByRole('button', { name: String(n) })).toBeInTheDocument()
    }
  })

  it('actualiza las cantidades al cambiar el número de personas (valor exacto del backend)', async () => {
    render(<Wrapper />)
    // Por defecto (1 persona) se muestra la cantidad para 1.
    expect(await screen.findByLabelText('Cantidad de Arroz')).toHaveValue(350)

    // Al elegir 4 personas, se re-consulta y se muestran las cantidades para 4.
    fireEvent.click(screen.getByRole('button', { name: '4' }))
    await waitFor(() => expect(screen.getByLabelText('Cantidad de Arroz')).toHaveValue(1400))
    expect(screen.getByLabelText('Cantidad de Cebolla')).toHaveValue(8)
  })
})
