import { describe, it, expect } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'

/**
 * R-02 · Test del Navbar.
 *
 * Verifica que el menú de navegación contiene EXACTAMENTE los 7 ítems
 * especificados por el cliente, en el orden correcto, que cada uno apunta a su
 * destino (ruta o ancla de sección), que el menú de escritorio está configurado
 * para mostrarse en desktop y ocultarse en móvil, y que el menú hamburguesa
 * móvil contiene los mismos 7 ítems.
 *
 * Nota sobre el breakpoint: el menú de escritorio usa `lg` (≥1024px) en lugar de
 * `md` (≥768px) para que los 7 ítems quepan sin solaparse. El test verifica el
 * patrón "oculto en móvil / visible en desktop" sin fijar un px concreto.
 */

const EXPECTED_LABELS = [
  'Inicio',
  'Meal Prep',
  'Cocinera a Domicilio',
  'Hornear en Casa',
  'Horneados',
  'Nosotros',
  'Contacto',
]

const EXPECTED_HREFS = {
  Inicio: '/',
  'Meal Prep': '/meal-prep-en-casa',
  'Cocinera a Domicilio': '/menu#servicio-cocinera',
  'Hornear en Casa': '/menu#servicios',
  Horneados: '/menu#dulces',
  Nosotros: '/nosotros',
  Contacto: '/contacto',
}

function renderNavbar(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Navbar />
    </MemoryRouter>
  )
}

// El menú de escritorio es la única lista presente en el render inicial
// (el menú móvil sólo se monta al abrir el hamburguesa).
function getDesktopNavList() {
  return screen.getByRole('list')
}

describe('Navbar', () => {
  it('se renderiza sin errores y muestra el logo de la marca', () => {
    renderNavbar()
    expect(screen.getByText('Sabores de')).toBeInTheDocument()
    expect(screen.getByText('Mamá')).toBeInTheDocument()
  })

  it('muestra exactamente 7 ítems de navegación en el menú de escritorio', () => {
    renderNavbar()
    const items = within(getDesktopNavList()).getAllByRole('listitem')
    expect(items).toHaveLength(7)
  })

  it('muestra los 7 ítems con los nombres exactos y en el orden correcto', () => {
    renderNavbar()
    const labels = within(getDesktopNavList())
      .getAllByRole('listitem')
      .map((li) => li.textContent.trim())
    expect(labels).toEqual(EXPECTED_LABELS)
  })

  it.each(EXPECTED_LABELS)('el ítem "%s" apunta a su destino correcto (ruta o ancla)', (label) => {
    renderNavbar()
    const link = within(getDesktopNavList()).getByRole('link', { name: label })
    expect(link).toHaveAttribute('href', EXPECTED_HREFS[label])
  })

  it('los enlaces a servicios/productos usan anclas dentro de /menu (scroll a sección)', () => {
    renderNavbar()
    const list = getDesktopNavList()
    for (const label of ['Cocinera a Domicilio', 'Hornear en Casa', 'Horneados']) {
      const href = within(list).getByRole('link', { name: label }).getAttribute('href')
      expect(href).toMatch(/^\/menu#/)
    }
  })

  it('el menú de escritorio está oculto en móvil y se muestra en viewport desktop', () => {
    renderNavbar()
    const list = getDesktopNavList()
    // Mobile-first: oculto por defecto, visible (flex) a partir del breakpoint desktop.
    expect(list.className).toMatch(/\bhidden\b/)
    expect(list.className).toMatch(/(md|lg|xl):flex/)
  })

  it('el botón hamburguesa está disponible en móvil y oculto en desktop', () => {
    renderNavbar()
    const burger = screen.getByRole('button', { name: /abrir menú/i })
    expect(burger.className).toMatch(/(md|lg|xl):hidden/)
  })

  it('el menú hamburguesa móvil muestra los mismos 7 ítems en el mismo orden', () => {
    renderNavbar()
    fireEvent.click(screen.getByRole('button', { name: /abrir menú/i }))

    const dialog = screen.getByRole('dialog', { name: /menú de navegación/i })
    const mobileLabels = within(dialog)
      .getAllByRole('listitem')
      .map((li) => li.textContent.trim())

    expect(mobileLabels).toEqual(EXPECTED_LABELS)
  })
})
