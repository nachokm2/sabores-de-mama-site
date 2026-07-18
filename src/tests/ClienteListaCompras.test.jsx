import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'

// Navbar/Footer no son relevantes para esta prueba (y arrastran dependencias).
vi.mock('../components/layout/Navbar', () => ({ default: () => null }))
vi.mock('../components/layout/Footer', () => ({ default: () => null }))

vi.mock('../lib/publicApi', () => ({
  getPlatos: vi.fn(),
  getIngredientesDePlatos: vi.fn(),
  imagenUrl: (x) => x || '',
}))

import { getPlatos, getIngredientesDePlatos } from '../lib/publicApi'
import ClienteListaCompras from '../pages/Cuenta/ClienteListaCompras'

const PLATOS = [
  { id: 1, nombre: 'Pollo al curry', categoria: 'Carnes', descripcion: 'rico' },
  { id: 2, nombre: 'Lasaña', categoria: 'Otros', descripcion: 'capas' },
]
// El backend devuelve las cantidades EXACTAS para el nº de personas consultado.
const ingredientesPara = (ids, personas = 1) => [
  { id: 1, nombre: 'Arroz', cantidad: 100 * personas, unidad: 'g', platos: [1, 2] },
  { id: 2, nombre: 'Cebolla', cantidad: 1 * personas, unidad: 'u', platos: [1] },
]

function renderPage() {
  render(
    <HelmetProvider>
      <MemoryRouter>
        <ClienteListaCompras />
      </MemoryRouter>
    </HelmetProvider>
  )
}

beforeEach(() => {
  getPlatos.mockReset().mockResolvedValue(PLATOS)
  getIngredientesDePlatos.mockReset().mockImplementation((ids, personas = 1) =>
    Promise.resolve(ingredientesPara(ids, personas))
  )
})

describe('ClienteListaCompras · consultar lista de compras', () => {
  it('carga y muestra los platos disponibles', async () => {
    renderPage()
    expect(await screen.findByRole('button', { name: /Pollo al curry/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Lasaña/ })).toBeInTheDocument()
  })

  it('consulta el backend con los platos elegidos y escala por personas', async () => {
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: /Pollo al curry/ }))
    fireEvent.click(screen.getByRole('button', { name: /Lasaña/ }))

    // Generar la lista (personas por defecto: 2).
    fireEvent.click(screen.getByRole('button', { name: /Generar lista/i }))

    await waitFor(() => expect(getIngredientesDePlatos).toHaveBeenCalledWith([1, 2], 2))

    const arroz = (await screen.findByText('Arroz')).closest('tr')
    expect(within(arroz).getByText('200')).toBeInTheDocument() // exacto para 2 personas
    const cebolla = screen.getByText('Cebolla').closest('tr')
    expect(within(cebolla).getByText('2')).toBeInTheDocument()
  })

  it('al cambiar el número de personas re-consulta con las cantidades exactas', async () => {
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: /Pollo al curry/ }))
    fireEvent.click(screen.getByRole('button', { name: /Generar lista/i }))

    const arroz = (await screen.findByText('Arroz')).closest('tr')
    await waitFor(() => expect(within(arroz).getByText('200')).toBeInTheDocument())

    // Elegir 4 personas → re-consulta el backend con las cantidades exactas para 4.
    fireEvent.click(screen.getByRole('button', { name: '4' }))
    await waitFor(() => expect(within(arroz).getByText('400')).toBeInTheDocument())
    expect(getIngredientesDePlatos).toHaveBeenCalledWith([1], 4)
    expect(getIngredientesDePlatos).toHaveBeenCalledTimes(2)
  })
})
