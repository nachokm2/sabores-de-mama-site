import { test, expect } from './fixtures'
import { ensureCupo, fechaFutura, etiquetaFecha } from './helpers/api'
import { llenarDireccion, elegirFecha, seleccionar5Platos } from './helpers/flow'

// Términos y Condiciones: la página existe, se llega a ella desde el sitio, y el
// formulario de pedido NO se puede enviar sin aceptarlos.

test.describe('Términos y Condiciones', () => {
  test('la página se carga con su versión y la sección de horarios de entrega', async ({ page }) => {
    await page.goto('/terminos-y-condiciones')

    await expect(page.getByRole('heading', { name: 'Términos y Condiciones', level: 2 })).toBeVisible()
    await expect(page.getByText(/Versión 1\.0 · Vigente desde/)).toBeVisible()

    // La sección de horarios es el motivo de este documento: debe estar y debe
    // decir que el compromiso es con la fecha, no con una hora.
    await expect(page.getByRole('heading', { name: '8. Horarios de entrega' })).toBeVisible()
    await expect(page.getByText(/no con una hora exacta/)).toBeVisible()
    await expect(page.getByText(/2 horas y 30 minutos/)).toBeVisible()
  })

  test('el índice lleva a la sección de horarios', async ({ page }) => {
    await page.goto('/terminos-y-condiciones')
    await page.getByRole('link', { name: '8. Horarios de entrega' }).click()
    await expect(page).toHaveURL(/#horarios$/)
    await expect(page.locator('#horarios')).toBeVisible()
  })

  test('el enlace del footer llega a los términos', async ({ page }) => {
    await page.goto('/')
    const footer = page.getByRole('contentinfo')
    await footer.getByRole('link', { name: 'Términos y Condiciones' }).click()
    await expect(page).toHaveURL(/\/terminos-y-condiciones$/)
  })

  test('el pedido NO se puede enviar sin aceptar los términos', async ({ page, request }) => {
    const fecha = fechaFutura(26)
    await ensureCupo(request, { fecha, capacidad: 20 })

    await page.goto('/meal-prep')
    await llenarDireccion(page)
    await elegirFecha(page, etiquetaFecha(fecha))
    await seleccionar5Platos(page)
    await page.getByRole('button', { name: 'Continuar' }).click() // platos → preferencias
    await page.getByRole('button', { name: 'Continuar' }).click() // preferencias → entrega
    await page.getByRole('button', { name: 'Continuar' }).click() // entrega → resumen

    await expect(page.getByText('Cargando productos…')).toHaveCount(0)
    await page.getByRole('textbox', { name: /Nombre/ }).fill('E2E Términos')
    await page.getByRole('textbox', { name: /Email/ }).fill('e2e.terminos@example.com')
    await page.getByRole('textbox', { name: /Teléfono/ }).fill('+56 9 1234 5678')

    // Datos completos y casilla sin marcar: el botón sigue bloqueado.
    const casilla = page.getByRole('checkbox', { name: /Términos y Condiciones/ })
    await expect(casilla).not.toBeChecked()
    const confirmar = page.getByRole('button', { name: /Confirmar Pedido/ })
    await expect(confirmar).toBeDisabled()

    // Y al marcarla, se habilita.
    await casilla.check()
    await expect(confirmar).toBeEnabled()
  })

  test('el enlace de la casilla abre los términos en una pestaña nueva', async ({ page, request }) => {
    const fecha = fechaFutura(27)
    await ensureCupo(request, { fecha, capacidad: 20 })

    await page.goto('/meal-prep')
    await llenarDireccion(page)
    await elegirFecha(page, etiquetaFecha(fecha))
    await seleccionar5Platos(page)
    await page.getByRole('button', { name: 'Continuar' }).click()
    await page.getByRole('button', { name: 'Continuar' }).click()
    await page.getByRole('button', { name: 'Continuar' }).click()

    // Pestaña nueva a propósito: el pedido vive en memoria y navegar en la misma
    // pestaña perdería los pasos ya completados.
    const [pestana] = await Promise.all([
      page.context().waitForEvent('page'),
      page.getByRole('link', { name: 'Términos y Condiciones' }).click(),
    ])
    await expect(pestana).toHaveURL(/\/terminos-y-condiciones$/)
    await pestana.close()

    // La pestaña original sigue en el resumen, con el pedido intacto.
    await expect(page.getByRole('heading', { name: 'Revisa tu pedido' })).toBeVisible()
  })
})
