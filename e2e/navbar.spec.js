import { test, expect } from '@playwright/test'

const ITEMS = [
  { label: 'Inicio', href: '/' },
  { label: 'Meal Prep', href: '/meal-prep-en-casa' },
  { label: 'Cocinera a Domicilio', href: '/cocinera' },
  { label: 'Hornear en Casa', href: '/menu#servicios' },
  { label: 'Horneados', href: '/menu#dulces' },
  { label: 'Nosotros', href: '/nosotros' },
  { label: 'Contacto', href: '/contacto' },
]

test.describe('Navbar', () => {
  test('tiene exactamente los 7 ítems correctos (R-02), en orden y con su destino', async ({ page }) => {
    await page.goto('/')
    const nav = page.getByRole('navigation', { name: 'Navegación principal' })
    const items = nav.getByRole('listitem')

    await expect(items).toHaveCount(7)
    await expect(items).toHaveText(ITEMS.map((i) => i.label))

    for (const { label, href } of ITEMS) {
      await expect(nav.getByRole('link', { name: label, exact: true })).toHaveAttribute('href', href)
    }
  })

  test('al hacer click, cada ítem navega a su sección/ruta correcta', async ({ page }) => {
    for (const { label, href } of ITEMS) {
      await page.goto('/')
      const nav = page.getByRole('navigation', { name: 'Navegación principal' })
      await nav.getByRole('link', { name: label, exact: true }).click()
      // El destino puede incluir hash (ancla de sección dentro de /menu).
      const esperado = href === '/' ? /\/$/ : new RegExp(href.replace(/[#]/g, '\\#') + '$')
      await expect(page).toHaveURL(esperado)
    }
  })

  test('en móvil (375x812) el hamburguesa abre el menú con los 7 ítems', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')

    // El nav de escritorio está oculto y el botón hamburguesa visible.
    const nav = page.getByRole('navigation', { name: 'Navegación principal' })
    await expect(nav.getByRole('list')).toBeHidden()
    const burger = page.getByRole('button', { name: /abrir menú/i })
    await expect(burger).toBeVisible()

    await burger.click()
    const dialog = page.getByRole('dialog', { name: /menú de navegación/i })
    await expect(dialog.getByRole('listitem')).toHaveText(ITEMS.map((i) => i.label))
  })
})
