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

/**
 * La guarda de dominio de index.html.
 *
 * Existe porque el píxel cargaba en cualquier host: en los 28 días hasta el
 * 15/08/2026, 1.700 de los eventos del dataset venían de localhost y solo 131
 * del sitio real. Estos dos tests son las dos mitades de la guarda, y ninguno
 * usa el grabador: aquí lo que se prueba es justamente si el píxel se carga.
 */
test.describe('Guarda de dominio del píxel', () => {
  const PREVIEW = process.env.E2E_PREVIEW_URL || 'http://localhost:4173'

  test('en localhost NO carga: ni fbq ni petición a connect.facebook.net', async ({ page }) => {
    const aMeta = []
    page.on('request', (r) => { if (/facebook/.test(r.url())) aMeta.push(r.url()) })

    await page.goto(`${PREVIEW}/`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1500)

    expect(await page.evaluate(() => typeof window.fbq)).toBe('undefined')
    expect(aMeta).toEqual([])
  })

  test('bajo el dominio de producción SÍ carga', async ({ page, request }) => {
    // Nada de tráfico real a Meta: si `fbevents.js` cargara de verdad, este test
    // registraría un PageView en la cuenta en cada corrida de CI — exactamente
    // la contaminación que la guarda viene a arreglar. Abortado, `fbq` se queda
    // en el stub que define el snippet, que es lo que hay que comprobar.
    await page.route(/facebook\.(net|com)/, (r) => r.abort())

    // Se sirve el contenido del preview bajo el hostname de producción, con sus
    // cabeceras: así la guarda ve el dominio real sin salir a internet.
    await page.route('https://saboresdemama.com/**', async (route) => {
      const url = new URL(route.request().url())
      const resp = await request.get(PREVIEW + url.pathname + url.search)
      const headers = { ...resp.headers() }
      delete headers['content-encoding']
      delete headers['content-length']
      await route.fulfill({ status: resp.status(), headers, body: await resp.body() })
    })

    await page.goto('https://saboresdemama.com/', { waitUntil: 'domcontentloaded' })

    expect(await page.evaluate(() => typeof window.fbq)).toBe('function')
    expect(await page.evaluate(() => (window.fbq.queue || []).map((a) => [...a].slice(0, 2))))
      .toEqual([['init', '1524660162308441'], ['track', 'PageView']])
  })
})
