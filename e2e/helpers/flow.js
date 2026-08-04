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

// El paso de platos agrupa por categorías en un ACORDEÓN que arranca colapsado:
// las tarjetas de plato (button[aria-pressed]) solo se montan al abrir su
// categoría. Igual que el test de vitest (MealPrepFlow), desplegamos todas las
// categorías antes de seleccionar. getByRole excluye del árbol de accesibilidad
// la hamburguesa del navbar (lg:hidden → display:none en el viewport Desktop del
// e2e), así que solo matchea las cabeceras de categoría.
export async function expandirCategorias(page) {
  // OJO: no usar `.all()` aquí. El locator es dinámico (expanded:false) y al abrir
  // una categoría ésta sale del conjunto, corriendo los índices → `.nth(n)` de un
  // snapshot previo se queda esperando un elemento que ya no existe. En su lugar,
  // clickeamos SIEMPRE la primera colapsada y esperamos a que el conjunto baje.
  const colapsadas = page.getByRole('button', { expanded: false })
  for (let guard = 0; guard < 30; guard++) {
    const n = await colapsadas.count()
    if (n === 0) break
    await colapsadas.first().click()
    await expect(colapsadas).toHaveCount(n - 1) // confirma que se expandió una
  }
}

export async function seleccionar5Platos(page) {
  await expect(page.getByText('0 de 5 platos seleccionados')).toBeVisible()
  await expandirCategorias(page)
  // Seleccionamos 5 tarjetas NO elegidas y NO deshabilitadas. Tras cada click
  // esperamos a que el contador suba: sincroniza con el re-render de React y evita
  // la carrera de re-clickear (y deseleccionar) la misma tarjeta aún sin actualizar.
  for (let i = 0; i < 5; i++) {
    await page.locator('button[aria-pressed="false"]:not([disabled])').first().click()
    await expect(page.getByText(`${i + 1} de 5 platos seleccionados`)).toBeVisible()
  }
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
