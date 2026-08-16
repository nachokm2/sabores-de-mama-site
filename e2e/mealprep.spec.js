import { test, expect } from './fixtures'
import { ensureCupo, getPedido, fechaFutura, etiquetaFecha } from './helpers/api'
import { llenarDireccion, elegirFecha, seleccionar5Platos, completarDatosYConfirmar, expandirCategorias } from './helpers/flow'

// Total dinámico: base 60.000 (VITE_MEAL_PREP_BASE) + despacho de la comuna
// (sembrada a 5.000 en CI vía COMUNA_COSTO_DEFAULT) = 65.000.
const TOTAL_DELIVERY = '$65.000'

test.describe('Flujo Meal Prep', () => {
  test('flujo completo meal prep delivery', async ({ page, request }) => {
    const fecha = fechaFutura(20)
    await ensureCupo(request, { fecha, capacidad: 20 })

    // Graba el píxel de Meta en vez de cargarlo: el snippet de index.html hace
    // `if (f.fbq) return`, así que definirlo antes evita que pida fbevents.js y
    // que esta corrida registre una compra falsa en la cuenta real de Meta.
    await page.addInitScript(() => {
      window.__meta = []
      window.fbq = (...args) => window.__meta.push(args)
    })

    await page.goto('/meal-prep')
    await llenarDireccion(page)
    await elegirFecha(page, etiquetaFecha(fecha))
    await seleccionar5Platos(page)
    await page.getByRole('button', { name: 'Continuar' }).click() // platos → preferencias

    // Sin gluten
    await page.getByText('Sin gluten').click()
    await page.getByRole('button', { name: 'Continuar' }).click() // preferencias → entrega

    // Delivery (por defecto): el total incluye el costo de despacho.
    await expect(page.getByText('Despacho')).toBeVisible()
    await expect(page.locator('span.text-terracotta', { hasText: TOTAL_DELIVERY })).toBeVisible()
    await page.getByRole('button', { name: 'Continuar' }).click() // entrega → resumen

    await completarDatosYConfirmar(page, {
      nombre: 'E2E Tester',
      email: 'e2e.delivery@example.com',
      telefono: '+56 9 1234 5678',
    })

    // Pantalla de pago con datos bancarios.
    await expect(page).toHaveURL(/\/pago\/\d+/)
    await expect(page.getByText('Datos para transferencia')).toBeVisible()
    await expect(page.getByText('Estela Zavalla')).toBeVisible() // VITE_BANK_TITULAR

    // El pedido existe en la BD con estado "solicitud_recibida".
    const id = Number(page.url().split('/pago/')[1].split('?')[0])
    const pedido = await getPedido(request, id)
    expect(pedido.servicio).toBe('meal_prep')
    expect(pedido.estado).toBe('solicitud_recibida')

    // La conversión llega a Meta con el monto real del pedido. Es la única
    // señal que tiene la campaña para optimizar, y en GTM nunca existió: se
    // implementó en el código el 16/08/2026 (src/lib/analytics.js).
    // Number(): la API puede devolver el total como string (pg entrega NUMERIC
    // así), y el código lo convierte antes de enviarlo. Comparar sin convertir
    // haría fallar el test por el tipo, no por la medición.
    expect(await page.evaluate(() => window.__meta)).toContainEqual([
      'track', 'Purchase', { value: Number(pedido.total), currency: 'CLP' },
    ])
  })

  // NOTA: se eliminó el test "flujo completo meal prep retiro". El flujo Meal Prep
  // es SÓLO delivery a domicilio por diseño (ver StepDelivery.jsx: "no hay retiro");
  // no existe la opción "Retiro" en este flujo, así que el test probaba una
  // funcionalidad inexistente. El retiro sí aplica al flujo Cocinera.

  test('no permite avanzar con menos de 5 platos (botón deshabilitado)', async ({ page, request }) => {
    const fecha = fechaFutura(21)
    await ensureCupo(request, { fecha, capacidad: 20 })

    await page.goto('/meal-prep')
    await llenarDireccion(page)
    await elegirFecha(page, etiquetaFecha(fecha))
    await expect(page.getByText('0 de 5 platos seleccionados')).toBeVisible()

    await expandirCategorias(page)
    for (let i = 0; i < 4; i++) {
      await page.locator('button[aria-pressed="false"]:not([disabled])').first().click()
      await expect(page.getByText(`${i + 1} de 5 platos seleccionados`)).toBeVisible()
    }
    await expect(page.getByRole('button', { name: 'Continuar' })).toBeDisabled()
  })

  test('una fecha sin cupo no es seleccionable', async ({ page, request }) => {
    // Fecha con capacidad 0 → disponibles 0. El backend la excluye del listado
    // público, por lo que NO aparece como opción clickeable en el calendario.
    const fechaLlena = fechaFutura(45)
    await ensureCupo(request, { fecha: fechaLlena, capacidad: 0 })
    await ensureCupo(request, { fecha: fechaFutura(22), capacidad: 10 }) // sí disponible

    await page.goto('/meal-prep')
    await llenarDireccion(page)

    // Hay fechas disponibles…
    await expect(page.locator('button', { hasText: 'cupos' }).first()).toBeVisible()
    // …pero la fecha llena no aparece como botón seleccionable.
    const etiqueta = etiquetaFecha(fechaLlena)
    await expect(page.getByRole('button', { name: new RegExp(etiqueta) })).toHaveCount(0)
  })
})
