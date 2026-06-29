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
// Ingredientes consolidados POR PERSONA que devolvería el backend de Cocinera.
const INGREDIENTES = [
  { id: 1, nombre: 'Arroz', cantidad_total: 100, unidad: 'g', platos: [1, 2] },
  { id: 2, nombre: 'Cebolla', cantidad_total: 1, unidad: 'u', platos: [1] },
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
  getIngredientesDePlatos.mockReset().mockResolvedValue(INGREDIENTES)
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

    await waitFor(() => expect(getIngredientesDePlatos).toHaveBeenCalledWith([1, 2]))

    const arroz = (await screen.findByText('Arroz')).closest('tr')
    expect(within(arroz).getByText('200')).toBeInTheDocument() // 100 × 2
    const cebolla = screen.getByText('Cebolla').closest('tr')
    expect(within(cebolla).getByText('2')).toBeInTheDocument() // 1 × 2
  })

  it('al cambiar el número de personas re-escala sin volver a consultar el backend', async () => {
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: /Pollo al curry/ }))
    fireEvent.click(screen.getByRole('button', { name: /Generar lista/i }))

    const arroz = (await screen.findByText('Arroz')).closest('tr')
    await waitFor(() => expect(within(arroz).getByText('200')).toBeInTheDocument())

    // Elegir 4 personas → 100 × 4 = 400, sin nueva consulta al backend.
    fireEvent.click(screen.getByRole('button', { name: '4' }))
    await waitFor(() => expect(within(arroz).getByText('400')).toBeInTheDocument())
    expect(getIngredientesDePlatos).toHaveBeenCalledTimes(1)
  })
})
