import { expect } from '@playwright/test'

// Acciones reutilizables del stepper (sirven para Meal Prep y Cocinera).

export async function llenarDireccion(page, comuna = 'Las Condes') {
  await page.getByPlaceholder(/Calle/).fill('Av. Siempre Viva 742')
  await page.getByRole('combobox').selectOption(comuna)
  await page.getByRole('button', { name: 'Continuar' }).click()
}

export async function elegirFecha(page, etiqueta) {
  // Selecciona la tarjeta de la fecha indicada ("D de mes") — controlada por el
  // test — para no depender de cupos antiguos compartidos entre tests.
  await page.getByRole('button', { name: new RegExp(etiqueta) }).first().click()
  await page.getByRole('button', { name: 'Continuar' }).click()
}

export async function seleccionar5Platos(page) {
  await expect(page.getByText('0 de 5 platos seleccionados')).toBeVisible()
  // Las tarjetas de plato exponen aria-pressed; seleccionamos 5 no elegidas.
  for (let i = 0; i < 5; i++) {
    await page.locator('button[aria-pressed="false"]').first().click()
  }
  await expect(page.getByText('5 de 5 platos seleccionados')).toBeVisible()
}

async function fillControlado(locator, value) {
  // Inputs controlados por React: escribimos carácter a carácter (más fiable que
  // fill() cuando hay re-renders) y confirmamos que el valor quedó comprometido.
  await locator.click()
  await locator.fill('')
  await locator.pressSequentially(value, { delay: 15 })
  await expect(locator).toHaveValue(value)
}

export async function completarDatosYConfirmar(page, datos) {
  // Esperar a que el add-on "hornear en casa" TERMINE de cargar (su render async
  // re-renderiza el resumen y puede descartar los valores si se llena a la vez).
  await expect(page.getByText('Cargando productos…')).toHaveCount(0)

  await fillControlado(page.getByRole('textbox', { name: /Nombre/ }), datos.nombre)
  await fillControlado(page.getByRole('textbox', { name: /Email/ }), datos.email)
  await fillControlado(page.getByRole('textbox', { name: /Teléfono/ }), datos.telefono)

  // Re-verificar que los tres valores siguen presentes justo antes de confirmar.
  await expect(page.getByRole('textbox', { name: /Nombre/ })).toHaveValue(datos.nombre)
  await expect(page.getByRole('textbox', { name: /Email/ })).toHaveValue(datos.email)
  await expect(page.getByRole('textbox', { name: /Teléfono/ })).toHaveValue(datos.telefono)

  const confirmar = page.getByRole('button', { name: /Confirmar Pedido/ })
  await expect(confirmar).toBeEnabled()

  // Esperar la respuesta del POST (bajo carga el backend puede tardar) para que
  // la aserción de navegación no expire antes de que se dispare el navigate.
  const [resp] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes('/api/pedidos') && r.request().method() === 'POST',
      { timeout: 30_000 }
    ),
    confirmar.click(),
  ])
  if (!resp.ok()) throw new Error(`POST /api/pedidos falló: ${resp.status()} ${await resp.text()}`)
}
