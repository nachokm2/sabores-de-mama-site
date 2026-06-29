import { test, expect } from '@playwright/test'
import { API_URL, ensureCupo, fechaFutura } from './helpers/api'

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'admin@saboresdemama.com'
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || 'admin123'

test.describe('Panel administrador', () => {
  test('login admin y cambio de estado de un pedido', async ({ page, request }) => {
    // Crear un pedido en estado "solicitud_recibida" para cambiarlo luego.
    const fecha = fechaFutura(24)
    await ensureCupo(request, { fecha, capacidad: 20 })
    const email = `e2e.admin.${Date.now()}@example.com`
    const crear = await request.post(`${API_URL}/pedidos`, {
      data: {
        nombre: 'Pedido Admin E2E',
        email,
        fecha_entrega: fecha,
        servicio: 'meal_prep',
        platos: [{ id: 1, nombre: 'X' }],
        total: 60000,
      },
    })
    expect(crear.ok()).toBeTruthy()

    // /admin → redirección a /admin/login (sin sesión).
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/admin\/login/)

    // Login con credenciales válidas.
    await page.getByLabel(/Email/).fill(ADMIN_EMAIL)
    await page.getByLabel(/Contraseña/).fill(ADMIN_PASSWORD)
    await page.getByRole('button', { name: /Ingresar/ }).click()

    // Tras el login, el hub para elegir servicio. Elegir Meal Prep.
    await expect(page).toHaveURL(/\/admin\/hub/)
    await page.getByRole('link', { name: /Meal Prep/ }).click()
    await expect(page).toHaveURL(/\/admin\/meal_prep\/dashboard/)
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

    // Ir a reservas y cambiar el estado a "pagado".
    await page.goto('/admin/meal_prep/pedidos')
    const fila = page.getByRole('row').filter({ hasText: email })
    await expect(fila).toBeVisible()
    await fila.getByRole('combobox').selectOption('pagado')

    // El estado cambió en la tabla.
    await expect(fila).toContainText('Pagado')

    // Feedback del backend sobre el intento de envío de correo (SMTP vacío en dev).
    await expect(page.getByText(/correo (omitido|enviado)/i)).toBeVisible()
  })

  test('acceso denegado sin autenticación', async ({ page }) => {
    await page.goto('/admin/login')
    await page.evaluate(() => localStorage.removeItem('sdm_admin_token'))
    await page.goto('/admin/meal_prep/pedidos')
    await expect(page).toHaveURL(/\/admin\/login/)
  })
})
