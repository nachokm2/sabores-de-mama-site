import { test, expect } from '@playwright/test'
import { ensureCupo, getPedido, fechaFutura, etiquetaFecha } from './helpers/api'
import { llenarDireccion, elegirFecha, seleccionar5Platos, completarDatosYConfirmar } from './helpers/flow'

// Total dinámico según la config del frontend (.env.local): base 60.000 + despacho 5.000.
const TOTAL_DELIVERY = '$65.000'
const TOTAL_RETIRO = '$60.000'

test.describe('Flujo Meal Prep', () => {
  test('flujo completo meal prep delivery', async ({ page, request }) => {
    const fecha = fechaFutura(20)
    await ensureCupo(request, { fecha, capacidad: 20 })

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
    const id = Number(page.url().split('/pago/')[1])
    const pedido = await getPedido(request, id)
    expect(pedido.servicio).toBe('meal_prep')
    expect(pedido.estado).toBe('solicitud_recibida')
  })

  test('flujo completo meal prep retiro (total sin despacho)', async ({ page, request }) => {
    const fecha = fechaFutura(30)
    await ensureCupo(request, { fecha, capacidad: 20 })

    await page.goto('/meal-prep')
    await llenarDireccion(page)
    await elegirFecha(page, etiquetaFecha(fecha))
    await seleccionar5Platos(page)
    await page.getByRole('button', { name: 'Continuar' }).click() // platos → preferencias
    await expect(page.getByRole('heading', { name: /Preferencias/ })).toBeVisible()
    await page.getByRole('button', { name: 'Continuar' }).click() // preferencias → entrega (sin elegir)
    await expect(page.getByRole('heading', { name: /Cómo lo recibes/ })).toBeVisible()

    // Seleccionar Retiro → el total NO incluye despacho.
    await page.getByText('Retiro', { exact: false }).first().click()
    await expect(page.getByText('Gratis')).toBeVisible()
    await expect(page.locator('span.text-terracotta', { hasText: TOTAL_RETIRO })).toBeVisible()
    await page.getByRole('button', { name: 'Continuar' }).click()

    await completarDatosYConfirmar(page, {
      nombre: 'E2E Retiro',
      email: 'e2e.retiro@example.com',
      telefono: '+56 9 8765 4321',
    })

    await expect(page).toHaveURL(/\/pago\/\d+/)
    const id = Number(page.url().split('/pago/')[1])
    const pedido = await getPedido(request, id)
    expect(pedido.tipo_entrega).toBe('retiro')
    expect(Number(pedido.costo_despacho)).toBe(0)
  })

  test('no permite avanzar con menos de 5 platos (botón deshabilitado)', async ({ page, request }) => {
    const fecha = fechaFutura(21)
    await ensureCupo(request, { fecha, capacidad: 20 })

    await page.goto('/meal-prep')
    await llenarDireccion(page)
    await elegirFecha(page, etiquetaFecha(fecha))
    await expect(page.getByText('0 de 5 platos seleccionados')).toBeVisible()

    for (let i = 0; i < 4; i++) {
      await page.locator('button[aria-pressed="false"]').first().click()
    }
    await expect(page.getByText('4 de 5 platos seleccionados')).toBeVisible()
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
