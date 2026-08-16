import { test, expect } from './fixtures'

/**
 * Eventos del píxel de Meta disparados desde el código (src/lib/metaPixel.js).
 *
 * Contexto: hasta el 16/08/2026 estos eventos vivían en etiquetas de HTML
 * personalizado del contenedor GTM-PN56NXLC. La CSP bloquea los scripts que GTM
 * inyecta, así que no medían nada; se pasaron al código y las etiquetas quedaron
 * pausadas. Estos tests son la red que impide que vuelvan a apagarse en silencio.
 *
 * El píxel real NO se carga: `window.fbq` se sustituye por un grabador desde el
 * fixture compartido (e2e/fixtures.js), que lo aplica a toda la suite.
 */
async function noNavegarAWhatsApp(page) {
  await page.addInitScript(() => {
    // Los enlaces a WhatsApp abren wa.me de verdad; se cancela la navegación.
    // En burbuja, o sea después del listener real, que escucha en captura.
    document.addEventListener('click', (e) => {
      if (e.target?.closest?.('a[href*="wa.me"]')) e.preventDefault()
    })
  })
}

const eventos = (page) => page.evaluate(() => window.__meta || [])

test.describe('Píxel de Meta', () => {
  test.beforeEach(({ page }) => noNavegarAWhatsApp(page))

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
 * La guarda de dominio de index.html, que cubre el píxel de Meta Y GTM/GA4.
 *
 * Existe porque las dos cargaban en cualquier host. Medido el 16/08/2026 sobre
 * los 28 días previos: 1.700 eventos del píxel desde localhost contra 131 del
 * sitio, y 1.836 sesiones de GA4 desde localhost (78%) contra 478 del sitio.
 *
 * Estos dos tests son las dos mitades de la guarda, y ninguno usa el grabador:
 * acá lo que se prueba es justamente si la analítica se carga o no.
 */
test.describe('Guarda de dominio de la analítica', () => {
  // Sin el grabador: acá se prueba si el píxel de verdad se carga o no. Cada uno
  // de los dos tests se hace responsable de que nada salga hacia Meta.
  test.use({ pixelReal: true })

  const PREVIEW = process.env.E2E_PREVIEW_URL || 'http://localhost:4173'

  test('en localhost no carga NADA: ni el píxel ni GTM', async ({ page }) => {
    const salidas = []
    page.on('request', (r) => { if (/facebook|googletagmanager/.test(r.url())) salidas.push(r.url()) })

    await page.goto(`${PREVIEW}/`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1500)

    expect(await page.evaluate(() => window.__medir)).toBe(false)
    expect(await page.evaluate(() => typeof window.fbq)).toBe('undefined')
    expect(salidas, `no debería salir tráfico de analítica: ${salidas.join(', ')}`).toEqual([])
  })

  test('bajo el dominio de producción SÍ cargan los dos', async ({ page, request }) => {
    // Se registran los intentos y se abortan. Si se dejaran pasar, cada corrida
    // de CI mandaría un PageView a Meta y una sesión a GA4 desde un hostname
    // falseado: exactamente la contaminación que la guarda viene a arreglar.
    const intentos = []
    await page.route(/facebook\.(net|com)|googletagmanager\.com/, (r) => {
      intentos.push(new URL(r.request().url()).hostname)
      return r.abort()
    })

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
    await page.waitForTimeout(1000)

    expect(await page.evaluate(() => window.__medir)).toBe(true)

    // El píxel: `fbq` queda en el stub del snippet (fbevents.js está abortado),
    // con la cola de llamadas pendientes, que es lo que hay que comprobar.
    expect(await page.evaluate(() => typeof window.fbq)).toBe('function')
    expect(await page.evaluate(() => (window.fbq.queue || []).map((a) => [...a].slice(0, 2))))
      .toEqual([['init', '1524660162308441'], ['track', 'PageView']])

    // Y GTM: dataLayer inicializado por su snippet, y el intento de bajar gtm.js.
    expect(await page.evaluate(() => window.dataLayer?.[0]?.['gtm.start'])).toBeTruthy()
    expect(intentos).toContain('www.googletagmanager.com')
    expect(intentos).toContain('connect.facebook.net')
  })
})
