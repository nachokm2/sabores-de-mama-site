import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../lib/publicApi', () => ({
  getProductosHornear: vi.fn(),
  imagenUrl: (u) => u,
}))

import { getProductosHornear } from '../lib/publicApi'
import ProductosDestacados from '../components/sections/ProductosDestacados'

const PAN = 'Pan de Pascua 🎄'

function renderSection() {
  return render(
    <MemoryRouter>
      <ProductosDestacados />
    </MemoryRouter>
  )
}

beforeEach(() => {
  getProductosHornear.mockReset()
})

describe('ProductosDestacados', () => {
  it('muestra cada etiqueta con sus productos, precios y el enlace al Meal Prep', async () => {
    getProductosHornear.mockResolvedValue([
      { id: 1, nombre: 'Pan de Pascua Tradicional', formato: '1 kg', precio: 9500, etiqueta: PAN },
      { id: 2, nombre: 'Pan de Pascua Frutos Secos', formato: '1/2 kg', precio: 6000, etiqueta: PAN },
      { id: 3, nombre: 'Cocadas Manjar', precio: 7500, etiqueta: null },
    ])
    renderSection()

    expect(await screen.findByRole('heading', { name: PAN })).toBeInTheDocument()
    expect(screen.getByText('Pan de Pascua Tradicional')).toBeInTheDocument()
    expect(screen.getByText('$9.500')).toBeInTheDocument()
    expect(screen.getByText('$6.000')).toBeInTheDocument()
    // Los productos sin etiqueta no se destacan.
    expect(screen.queryByText('Cocadas Manjar')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Agregar a mi Meal Prep/ })).toHaveAttribute('href', '/meal-prep')
  })

  it('no renderiza nada si no hay productos destacados', async () => {
    getProductosHornear.mockResolvedValue([{ id: 3, nombre: 'Cocadas Manjar', precio: 7500 }])
    const { container } = renderSection()
    await waitFor(() => expect(getProductosHornear).toHaveBeenCalled())
    expect(container).toBeEmptyDOMElement()
  })
})
