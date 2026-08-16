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

  test('img-src permite blob: (previsualización de fotos en el panel)', async ({ request }) => {
    // El panel previsualiza las fotos a subir con URL.createObjectURL(), que
    // genera URLs blob:. Sin blob: en la política el navegador las bloquea y la
    // miniatura sale como imagen rota — pasó en producción y no lo detectó nada,
    // porque el resto de estos tests solo recorre páginas públicas.
    const csp = (await request.get(`${PREVIEW}/`)).headers()['content-security-policy']
    const imgSrc = csp.split(';').map((d) => d.trim()).find((d) => d.startsWith('img-src'))
    expect(imgSrc).toContain('blob:')
  })

  test('los scripts inline SÍ se ejecutan (la página hidrata y el píxel carga)', async ({ page }) => {
    await capturarViolaciones(page)
    await page.goto(`${PREVIEW}/`, { waitUntil: 'networkidle' })

    // Definidas por scripts inline: si la CSP los bloqueara quedarían indefinidas
    // y el sitio no hidrataría.
    expect(await page.evaluate(() => typeof window.__VITE_REACT_SSG_HASH__)).toBe('string')
    expect(await page.evaluate(() => Array.isArray(window.dataLayer))).toBe(true)

    // El píxel de Meta sigue declarado en index.html y no en un tag de GTM: es la
    // razón de que la CSP no lo bloquee. Si alguien lo devuelve a GTM, esto lo
    // detecta. Se comprueba en el HTML servido y no con `typeof window.fbq`
    // porque aquí el host es localhost y la guarda de dominio no lo carga —eso
    // se verifica en meta-pixel.spec.js.
    const html = await (await page.request.get(`${PREVIEW}/`)).text()
    expect(html).toContain("fbq('init', '1524660162308441')")

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

/**
 * El sitemap se genera en el build (scripts/sitemap.mjs) a partir del HTML
 * realmente producido. Estos tests cubren el modo de fallo que tenía cuando era
 * un archivo escrito a mano: quedarse corto respecto de las páginas del sitio, o
 * traer fechas que no corresponden a ningún cambio real.
 */
test.describe('Sitemap generado en el build', () => {
  test('declara exactamente las páginas que el sitio sirve', async ({ request }) => {
    const xml = await (await request.get(`${PREVIEW}/sitemap.xml`)).text()
    const rutas = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
      .map((m) => m[1].replace('https://saboresdemama.com', '') || '/')
      .sort()

    expect(rutas.length).toBeGreaterThanOrEqual(19)
    // Cada ruta declarada debe responder de verdad en el servidor.
    for (const ruta of rutas) {
      const res = await request.get(`${PREVIEW}${ruta}`)
      expect(res.status(), `${ruta} declarada en el sitemap`).toBe(200)
    }
    // Y las páginas clave no pueden faltar.
    for (const debe of ['/', '/preguntas-frecuentes', '/blog', '/comida-a-domicilio/las-condes']) {
      expect(rutas, `${debe} debe estar en el sitemap`).toContain(debe)
    }
  })

  test('cada URL trae lastmod y no son todas la misma fecha', async ({ request }) => {
    const xml = await (await request.get(`${PREVIEW}/sitemap.xml`)).text()
    const urls = [...xml.matchAll(/<url>[\s\S]*?<\/url>/g)].map((m) => m[0])
    const fechas = urls.map((u) => (u.match(/<lastmod>([^<]+)/) || [])[1])

    expect(fechas.every(Boolean), 'todas las URLs deben traer lastmod').toBe(true)
    expect(fechas.every((f) => /^\d{4}-\d{2}-\d{2}$/.test(f))).toBe(true)
    // Si todas fueran iguales, sería la fecha del deploy y no diría nada sobre
    // qué cambió: es justo lo que este generador viene a evitar.
    expect(new Set(fechas).size).toBeGreaterThan(1)
  })
})

/**
 * Un asset que no existe debe responder 404 y no el home.
 *
 * Es el modo de fallo que aparece cada vez que se despliega con el sitio abierto:
 * los chunks cambian de nombre y la pestaña pide los viejos. Devolver "200 con el
 * HTML del home" convertía eso en un misterio —el navegador intentaba ejecutar
 * HTML como módulo— y dejaba en pantalla el home estático, sin React.
 */
test.describe('Assets inexistentes', () => {
  test('un chunk que no existe responde 404, no el home', async ({ request }) => {
    const res = await request.get(`${PREVIEW}/assets/PaginaQueNoExiste-ABC123.js`)
    expect(res.status()).toBe(404)
    expect(res.headers()['content-type']).not.toContain('text/html')
  })

  test('un asset real se sigue sirviendo con su tipo correcto', async ({ request }) => {
    const html = await (await request.get(`${PREVIEW}/`)).text()
    const asset = html.match(/assets\/[A-Za-z0-9._-]+\.js/)?.[0]
    expect(asset).toBeTruthy()

    const res = await request.get(`${PREVIEW}/${asset}`)
    expect(res.status()).toBe(200)
    expect(res.headers()['content-type']).toContain('javascript')
  })

  test('las rutas del SPA siguen cayendo al index', async ({ request }) => {
    // El fallback debe seguir vivo para las rutas de la aplicación: la regla
    // nueva aplica solo a /assets/.
    const res = await request.get(`${PREVIEW}/admin/meal_prep/usuarios`)
    expect(res.status()).toBe(200)
    expect(res.headers()['content-type']).toContain('text/html')
  })
})
