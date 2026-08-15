import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Calcula los hashes SHA-256 de los scripts INLINE de cada página generada y los
 * escribe en dist/csp-hashes.json, para que el servidor de `vite preview` pueda
 * mandar una CSP con `script-src` sin 'unsafe-inline'.
 *
 * Por qué hashes y no un nonce: el sitio es estático y pre-renderizado. Un nonce
 * tiene que ser distinto en cada respuesta y venir escrito en el HTML, lo que
 * obligaría a reescribir cada página en cada request. Los hashes se calculan una
 * vez, en el build.
 *
 * Y por qué en un paso post-build en vez de un plugin de Vite: el HTML de las 19
 * rutas lo genera vite-react-ssg DESPUÉS de que termina el build de Vite, así que
 * cuando corren los hooks del plugin esos archivos todavía no existen.
 *
 * Hay cuatro scripts inline por página y tres de ellos NO se pueden fijar a mano:
 *   1. el snippet de Google Tag Manager (estable, viene de index.html),
 *   2. el bloque JSON-LD de datos estructurados (distinto en cada página),
 *   3. window.__staticRouterHydrationData (distinto en cada página),
 *   4. window.__VITE_REACT_SSG_HASH__ (cambia en CADA build).
 * De ahí que la lista se regenere automáticamente en cada compilación.
 */

const DIST = path.resolve(process.cwd(), 'dist')
const SALIDA = path.join(DIST, 'csp-hashes.json')

// Scripts inline = etiquetas <script> SIN atributo src. Se incluyen también los
// de tipo application/ld+json: no se ejecutan, pero hay navegadores que igual
// los evalúan contra script-src, y hashearlos no cuesta nada.
const RE_SCRIPT = /<script(?![^>]*\ssrc\s*=)([^>]*)>([\s\S]*?)<\/script>/gi

function htmlsDe(dir) {
  const salida = []
  for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
    const completo = path.join(dir, entrada.name)
    if (entrada.isDirectory()) salida.push(...htmlsDe(completo))
    else if (entrada.name.endsWith('.html')) salida.push(completo)
  }
  return salida
}

function hashesDe(html) {
  const hashes = new Set()
  for (const [, , cuerpo] of html.matchAll(RE_SCRIPT)) {
    // El hash se calcula sobre el contenido EXACTO entre las etiquetas: un solo
    // byte de diferencia (un espacio, un salto de línea) y el navegador bloquea.
    hashes.add(`'sha256-${crypto.createHash('sha256').update(cuerpo, 'utf8').digest('base64')}'`)
  }
  return [...hashes]
}

if (!fs.existsSync(DIST)) {
  console.error('[csp] No existe dist/. Corre el build primero.')
  process.exit(1)
}

const mapa = {}
let total = 0
for (const archivo of htmlsDe(DIST)) {
  // Clave = ruta servida. `dirStyle: flat` hace que /nosotros salga de
  // dist/nosotros.html, así que basta con quitar la extensión.
  const rel = path.relative(DIST, archivo).split(path.sep).join('/')
  const clave = rel === 'index.html' ? '/' : '/' + rel.replace(/\.html$/, '')
  const hashes = hashesDe(fs.readFileSync(archivo, 'utf8'))
  mapa[clave] = hashes
  total += hashes.length
}

fs.writeFileSync(SALIDA, JSON.stringify(mapa, null, 2))
console.log(
  `[csp] ${total} hashes de scripts inline en ${Object.keys(mapa).length} páginas → dist/csp-hashes.json`
)
