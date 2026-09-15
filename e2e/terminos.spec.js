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

    // Datos completos, pero sin leer ni aceptar: bloqueado, y la casilla ni
    // siquiera se puede marcar.
    const casilla = page.getByRole('checkbox', { name: /Términos y Condiciones/ })
    const confirmar = page.getByRole('button', { name: /Confirmar Pedido/ })
    await expect(casilla).toBeDisabled()
    await expect(casilla).not.toBeChecked()
    await expect(confirmar).toBeDisabled()

    // Abrir el modal NO basta: el botón de confirmar la lectura nace bloqueado.
    await page.getByRole('button', { name: /Leer los Términos y Condiciones/ }).click()
    const heLeido = page.getByRole('button', { name: /He leído los términos/ })
    await expect(heLeido).toBeDisabled()
    await expect(page.getByText(/Desplázate hasta el final/)).toBeVisible()

    // Sólo al llegar al final del documento se habilita.
    const contenido = page.getByTestId('terminos-contenido')
    await contenido.evaluate((el) => el.scrollTo(0, el.scrollHeight))
    await expect(heLeido).toBeEnabled()
    await heLeido.click()

    // Leído, pero todavía no aceptado: sigue sin poder enviarse.
    await expect(casilla).toBeEnabled()
    await expect(casilla).not.toBeChecked()
    await expect(confirmar).toBeDisabled()

    // Y al aceptar, recién ahí se habilita.
    await casilla.check()
    await expect(confirmar).toBeEnabled()
  })

  test('el modal muestra la sección de horarios sin salir del flujo', async ({ page, request }) => {
    const fecha = fechaFutura(28)
    await ensureCupo(request, { fecha, capacidad: 20 })

    await page.goto('/meal-prep')
    await llenarDireccion(page)
    await elegirFecha(page, etiquetaFecha(fecha))
    await seleccionar5Platos(page)
    await page.getByRole('button', { name: 'Continuar' }).click()
    await page.getByRole('button', { name: 'Continuar' }).click()
    await page.getByRole('button', { name: 'Continuar' }).click()

    await page.getByRole('button', { name: /Leer los Términos y Condiciones/ }).click()
    const dialogo = page.getByRole('dialog')
    await expect(dialogo.getByRole('heading', { name: '8. Horarios de entrega' })).toBeVisible()
    await expect(dialogo.getByText(/no con una hora exacta/)).toBeVisible()
    await expect(dialogo.getByText(/2 horas y 30 minutos/)).toBeVisible()

    // Se cierra con Escape y el pedido sigue intacto detrás.
    await page.keyboard.press('Escape')
    await expect(dialogo).toBeHidden()
    await expect(page.getByRole('heading', { name: 'Revisa tu pedido' })).toBeVisible()
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
