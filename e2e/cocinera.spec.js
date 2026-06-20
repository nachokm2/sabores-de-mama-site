import { test, expect } from '@playwright/test'
import { ensureCupo, getPedido, fechaFutura, etiquetaFecha } from './helpers/api'
import { llenarDireccion, elegirFecha, seleccionar5Platos, completarDatosYConfirmar } from './helpers/flow'

test.describe('Flujo Cocinera a Domicilio', () => {
  test('flujo completo cocinera con lista de compras editable', async ({ page, request }) => {
    const fecha = fechaFutura(23)
    await ensureCupo(request, { fecha, capacidad: 20 })

    // Capturar el payload del POST /api/pedidos.
    let payload = null
    await page.route('**/api/pedidos', async (route) => {
      if (route.request().method() === 'POST') payload = route.request().postDataJSON()
      await route.continue()
    })

    await page.goto('/cocinera-a-domicilio')
    await llenarDireccion(page) // paso 1
    await elegirFecha(page, etiquetaFecha(fecha)) // paso 2
    await seleccionar5Platos(page) // paso 3
    await page.getByRole('button', { name: 'Continuar' }).click() // → paso 4 (ShoppingList)

    // Paso 4 muestra la lista de compras con ingredientes.
    await expect(page.getByText('Tu lista de compras')).toBeVisible()
    const primerInput = page.locator('input[type="number"]').first()
    await expect(primerInput).toBeVisible()

    // Editar la cantidad de un ingrediente.
    await primerInput.fill('999')
    await page.getByRole('button', { name: 'Continuar' }).click() // → paso 5 (preferencias)
    await page.getByRole('button', { name: 'Continuar' }).click() // → paso 6 (entrega)
    await page.getByRole('button', { name: 'Continuar' }).click() // → paso 7 (resumen)

    await completarDatosYConfirmar(page, {
      nombre: 'Cocinera E2E',
      email: 'cocinera.e2e@example.com',
      telefono: '+56 9 9999 9999',
    })
    await expect(page).toHaveURL(/\/pago\/\d+/)

    // La lista_compras editada está en el payload enviado.
    expect(payload).not.toBeNull()
    expect(payload.servicio).toBe('cocinera')
    expect(Array.isArray(payload.lista_compras)).toBe(true)
    expect(payload.lista_compras.some((i) => String(i.cantidad) === '999')).toBe(true)

    // Y se persiste en el pedido.
    const id = Number(page.url().split('/pago/')[1])
    const pedido = await getPedido(request, id)
    expect(pedido.servicio).toBe('cocinera')
    expect(pedido.lista_compras.some((i) => String(i.cantidad) === '999')).toBe(true)
  })
})
