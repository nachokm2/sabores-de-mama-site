import { test, expect } from '@playwright/test'
import { API_URL, ensureCupo, fechaFutura } from './helpers/api'

let n = 0
function nuevoCliente() {
  n += 1
  return {
    nombre: 'Cliente E2E',
    email: `cliente.${Date.now()}.${n}@example.com`,
    telefono: '+56900000000',
    password: 'secreto123',
  }
}

async function registrarPorUI(page, c) {
  await page.goto('/cuenta/registro')
  await page.getByLabel(/Nombre/).fill(c.nombre)
  await page.getByLabel(/Email/).fill(c.email)
  await page.getByLabel(/Teléfono/).fill(c.telefono)
  await page.getByLabel(/Contraseña/).fill(c.password)
  await page.getByRole('button', { name: /Crear cuenta/ }).click()
  await expect(page).toHaveURL(/\/cuenta$/)
}

test.describe('Portal de clientes', () => {
  test('registro, dashboard y CTA para agendar', async ({ page }) => {
    const c = nuevoCliente()
    await registrarPorUI(page, c)

    // Saludo con el nombre (viene del token, render inmediato).
    await expect(page.getByRole('heading', { name: new RegExp(c.nombre) })).toBeVisible()
    await expect(page.getByRole('button', { name: /Cerrar sesión/ })).toBeVisible()

    // El CTA "Agendar ahora" lleva al flujo de Cocinera.
    await page.getByRole('button', { name: /Agendar ahora/ }).click()
    await expect(page).toHaveURL(/\/cocinera-a-domicilio/)
  })

  test('ruta protegida: /cuenta sin sesión redirige a login', async ({ page }) => {
    await page.goto('/cuenta/login')
    await page.evaluate(() => localStorage.removeItem('sdm_cliente_token'))
    await page.goto('/cuenta')
    await expect(page).toHaveURL(/\/cuenta\/login/)
  })

  test('una reserva del cliente aparece en "Mis reservas"', async ({ page, request }) => {
    const c = nuevoCliente()
    await registrarPorUI(page, c)
    const token = await page.evaluate(() => localStorage.getItem('sdm_cliente_token'))
    expect(token).toBeTruthy()

    // Crear una reserva Cocinera vinculada a su cuenta (mismo POST que usa el flujo,
    // con el token del cliente → el backend la asocia vía usuario_id).
    const fecha = fechaFutura(33)
    await ensureCupo(request, { fecha, capacidad: 20 })
    const crear = await request.post(`${API_URL}/pedidos`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        nombre: c.nombre,
        email: c.email,
        fecha_entrega: fecha,
        servicio: 'cocinera',
        platos: [{ id: 1, nombre: 'X' }],
        total: 55000,
      },
    })
    expect(crear.ok()).toBeTruthy()
    const { pedido } = await crear.json()

    // Recargar el dashboard → la reserva aparece en próximas.
    await page.goto('/cuenta')
    await expect(page.getByText(`Reserva #${pedido.id}`)).toBeVisible()
  })

  test('un cliente NO puede acceder a endpoints de administración (403)', async ({ request }) => {
    const c = nuevoCliente()
    const reg = await request.post(`${API_URL}/auth/registro`, { data: c })
    expect(reg.ok()).toBeTruthy()
    const { token } = await reg.json()

    const res = await request.get(`${API_URL}/pedidos`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(403)
  })
})
