import { test, expect } from '@playwright/test'

/**
 * Eventos del píxel de Meta disparados desde el código (src/lib/metaPixel.js).
 *
 * Contexto: hasta el 16/08/2026 estos eventos vivían en etiquetas de HTML
 * personalizado del contenedor GTM-PN56NXLC. La CSP bloquea los scripts que GTM
 * inyecta, así que no medían nada; se pasaron al código y las etiquetas quedaron
 * pausadas. Estos tests son la red que impide que vuelvan a apagarse en silencio.
 *
 * El píxel real NO se carga: se sustituye `window.fbq` por un grabador antes de
 * que corra el snippet de index.html, que empieza con `if (f.fbq) return` y por
 * lo tanto ni siquiera pide fbevents.js. Sin esto, cada corrida de CI enviaría
 * eventos falsos a la cuenta de Meta y ensuciaría los datos de la campaña.
 */
async function grabarPixel(page) {
  await page.addInitScript(() => {
    window.__meta = []
    window.fbq = (...args) => window.__meta.push(args)
    // Los enlaces a WhatsApp abren wa.me de verdad; se cancela la navegación.
    // En burbuja, o sea después del listener real, que escucha en captura.
    document.addEventListener('click', (e) => {
      if (e.target?.closest?.('a[href*="wa.me"]')) e.preventDefault()
    })
  })
}

const eventos = (page) => page.evaluate(() => window.__meta || [])

test.describe('Píxel de Meta', () => {
  test.beforeEach(({ page }) => grabarPixel(page))

  test('ViewContent al entrar al menú, una sola vez por sesión', async ({ page }) => {
    await page.goto('/menu')
    await expect
      .poll(() => eventos(page))
      .toContainEqual(['track', 'ViewContent', { content_name: 'Menu' }])

    // Ir y volver no puede contar como una segunda visualización del menú.
    await page.getByRole('link', { name: /Inicio/ }).first().click()
    await expect(page).not.toHaveURL(/\/menu/)
    await page.goBack()
    await expect(page).toHaveURL(/\/menu/)

    const vistas = (await eventos(page)).filter(([, ev]) => ev === 'ViewContent')
    expect(vistas).toHaveLength(1)
  })

  test('no dispara ViewContent en otras páginas', async ({ page }) => {
    await page.goto('/contacto')
    await page.waitForLoadState('networkidle')
    expect((await eventos(page)).filter(([, ev]) => ev === 'ViewContent')).toHaveLength(0)
  })

  test('Contact al hacer clic en un enlace a WhatsApp', async ({ page }) => {
    await page.goto('/contacto')
    await page.locator('a[href*="wa.me"]').first().click()
    await expect
      .poll(() => eventos(page))
      .toContainEqual(['track', 'Contact', { content_name: 'WhatsApp' }])
  })
})
