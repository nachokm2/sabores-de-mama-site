import { test, expect } from '@playwright/test'

/**
 * La CSP de producción, verificada en un navegador de verdad.
 *
 * Estos tests NO usan `baseURL`: apuntan al servidor de `vite preview`, que es el
 * que corre en Railway y el único que emite las cabeceras de seguridad. El resto
 * de la suite E2E corre contra el dev server, donde esas cabeceras no existen, así
 * que sin este archivo la CSP no la comprobaba nadie.
 *
 * Importa porque el modo de fallo es catastrófico y silencioso: si un hash no
 * cuadra, el navegador bloquea el script de hidratación, el HTML pre-renderizado
 * se sigue viendo —la página "parece" bien— pero nada es interactivo.
 */

const PREVIEW = process.env.E2E_PREVIEW_URL || 'http://localhost:4173'

// Una de cada tipo: portada, página SSG simple, landing por comuna, artículo del
// blog (los tres primeros tienen JSON-LD distinto) y una ruta SPA, que se sirve
// por el fallback a index.html y hereda sus hashes.
const RUTAS = ['/', '/nosotros', '/preguntas-frecuentes', '/comida-a-domicilio/las-condes', '/blog/meal-prep-chileno', '/meal-prep']

/**
 * Violaciones que NO son culpa nuestra y se descartan a propósito:
 *
 * 1. `http://localhost:*` — en desarrollo y en CI la API es HTTP plano, y la
 *    política permite `https:`. En producción la API es HTTPS y entra sin más.
 * 2. Las originadas en gtm.js — son los tags de HTML personalizado de Google Tag
 *    Manager, que se inyectan como código inline en runtime. Que estén bloqueadas
 *    es EL OBJETIVO de la política, no un defecto: es exactamente el vector que
 *    'unsafe-inline' dejaba abierto. Por eso el píxel de Meta vive en index.html.
 */
const esRuidoConocido = (v) =>
  (v.bloqueado || '').startsWith('http://localhost:') || (v.origen || '').includes('googletagmanager.com')

async function capturarViolaciones(page) {
  await page.addInitScript(() => {
    window.__cspViolaciones = []
    document.addEventListener('securitypolicyviolation', (e) => {
      window.__cspViolaciones.push({
        directiva: e.violatedDirective,
        bloqueado: e.blockedURI,
        origen: e.sourceFile || '',
      })
    })
  })
}

const violacionesReales = async (page) =>
  (await page.evaluate(() => window.__cspViolaciones || [])).filter((v) => !esRuidoConocido(v))

test.describe('CSP de producción (servidor de preview)', () => {
  for (const ruta of RUTAS) {
    test(`${ruta} carga sin violaciones de CSP`, async ({ page }) => {
      await capturarViolaciones(page)
      await page.goto(`${PREVIEW}${ruta}`, { waitUntil: 'networkidle' })

      const violaciones = await violacionesReales(page)
      expect(violaciones, `Violaciones en ${ruta}: ${JSON.stringify(violaciones, null, 2)}`).toEqual([])
    })
  }

  test('la cabecera CSP no trae unsafe-inline en script-src', async ({ request }) => {
    const res = await request.get(`${PREVIEW}/`)
    const csp = res.headers()['content-security-policy']
    expect(csp).toBeTruthy()

    const scriptSrc = csp.split(';').map((d) => d.trim()).find((d) => d.startsWith('script-src'))
    expect(scriptSrc).toBeTruthy()
    expect(scriptSrc).not.toContain("'unsafe-inline'")
    // Y sí trae hashes: sin ellos "sin unsafe-inline" se cumpliría trivialmente
    // porque estarían todos los scripts bloqueados.
    expect(scriptSrc).toMatch(/'sha256-/)
  })

  test('los scripts inline SÍ se ejecutan (la página hidrata y el píxel carga)', async ({ page }) => {
    await capturarViolaciones(page)
    await page.goto(`${PREVIEW}/`, { waitUntil: 'networkidle' })

    // Definidas por scripts inline: si la CSP los bloqueara quedarían indefinidas
    // y el sitio no hidrataría.
    expect(await page.evaluate(() => typeof window.__VITE_REACT_SSG_HASH__)).toBe('string')
    expect(await page.evaluate(() => Array.isArray(window.dataLayer))).toBe(true)

    // El píxel de Meta: es la razón por la que está declarado en index.html en vez
    // de en un tag de GTM. Si alguien lo devuelve a GTM, esto lo detecta.
    expect(await page.evaluate(() => typeof window.fbq)).toBe('function')

    await expect(page.locator('#root')).not.toBeEmpty()
  })

  test('el intercambio de fuentes ocurre sin manejador inline', async ({ page }) => {
    await page.goto(`${PREVIEW}/`, { waitUntil: 'networkidle' })
    // El <link> nace como preload y un script (hasheado) lo pasa a stylesheet.
    // Antes esto lo hacía un onload="…", que `script-src-attr` bloquea.
    await expect
      .poll(() => page.evaluate(() => document.getElementById('fuentes-google')?.rel))
      .toBe('stylesheet')
  })
})
