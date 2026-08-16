import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Genera dist/sitemap.xml después del build.
 *
 * Dos problemas del sitemap escrito a mano que esto resuelve:
 *
 * 1. Las URLs se descubren del HTML realmente generado (dist/**\/*.html), no de
 *    una lista paralela. Antes había que acordarse de agregar cada página nueva
 *    al archivo, y una landing olvidada simplemente no se indexaba.
 *
 * 2. `lastmod` sale de la fecha del ÚLTIMO COMMIT que tocó el contenido de esa
 *    página, no de la fecha del build. Poner la fecha del deploy en las 19 URLs
 *    es tan poco informativo como dejarlas congeladas: le dice a Google que todo
 *    cambió cuando en realidad cambió una. Con la fecha por archivo, un cambio en
 *    las FAQ mueve solo /preguntas-frecuentes.
 */

const RAIZ = process.cwd()
const DIST = path.join(RAIZ, 'dist')
const BASE = 'https://saboresdemama.com'

/**
 * Archivos que definen el contenido de cada ruta. Una carpeta cuenta como todos
 * sus archivos. Es una aproximación declarada: no rastrea el grafo de imports
 * (un cambio en un componente compartido no mueve la fecha de todas las páginas),
 * pero cubre lo que en la práctica se edita.
 */
const FUENTES = {
  '/': ['src/pages/Home.jsx', 'src/components/sections', 'index.html'],
  '/nosotros': ['src/pages/Nosotros.jsx'],
  '/menu': ['src/pages/Menu.jsx', 'src/data/menu.js'],
  '/meal-prep-en-casa': ['src/pages/MealPrep.jsx'],
  '/cocinera': ['src/pages/Cocinera.jsx'],
  '/healthy': ['src/pages/HornearEnCasa.jsx'],
  '/galeria': ['src/pages/Galeria.jsx'],
  '/contacto': ['src/pages/Contacto.jsx'],
  '/almuerzos-a-domicilio-santiago': ['src/pages/AlmuerzosDomicilio.jsx'],
  '/comida-para-empresas': ['src/pages/ComidaEmpresas.jsx'],
  '/preguntas-frecuentes': ['src/pages/PreguntasFrecuentes.jsx'],
  '/blog': ['src/pages/Blog.jsx', 'src/content/blog'],
}

// Rutas por patrón: la landing de comuna y los artículos del blog.
const FUENTES_PATRON = [
  [/^\/comida-a-domicilio\//, ['src/pages/ComunaLanding.jsx', 'src/data/comunasLanding.js']],
  // El artículo tiene su propio .md: acá la fecha es exacta.
  [/^\/blog\/(.+)$/, (m) => [`src/content/blog/${m[1]}.md`, 'src/pages/BlogPost.jsx']],
]

// changefreq y priority por ruta (Google los ignora, pero se conservan los del
// sitemap anterior para no cambiar más de lo necesario).
const AJUSTES = {
  '/': ['weekly', '1.0'],
  '/menu': ['weekly', '0.9'],
  '/meal-prep-en-casa': ['monthly', '0.9'],
  '/almuerzos-a-domicilio-santiago': ['monthly', '0.9'],
  '/comida-para-empresas': ['monthly', '0.8'],
  '/cocinera': ['monthly', '0.8'],
  '/healthy': ['monthly', '0.8'],
  '/blog': ['weekly', '0.7'],
  '/nosotros': ['monthly', '0.7'],
  '/contacto': ['monthly', '0.7'],
  '/preguntas-frecuentes': ['monthly', '0.7'],
  '/galeria': ['monthly', '0.6'],
}
const ajustesDe = (ruta) =>
  AJUSTES[ruta] || (ruta.startsWith('/comida-a-domicilio/') ? ['monthly', '0.8'] : ['monthly', '0.6'])

function htmlsDe(dir) {
  const salida = []
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) salida.push(...htmlsDe(p))
    else if (e.name.endsWith('.html')) salida.push(p)
  }
  return salida
}

/**
 * ¿Se puede confiar en el historial de git?
 *
 * Un clon SHALLOW (el que hace actions/checkout por defecto, y posiblemente el
 * del builder de Railway) tiene un solo commit: `git log -1 -- archivo` devuelve
 * vacío para todo lo que no se tocó en ese commit. Sin esto, cada archivo caería
 * al respaldo del sistema de archivos, cuyas fechas en un clon reciente son todas
 * la del clon — o sea, la fecha del deploy disfrazada de fecha de contenido.
 * Preferible no declarar lastmod que declarar uno falso.
 */
function esShallow() {
  try {
    return (
      execFileSync('git', ['rev-parse', '--is-shallow-repository'], {
        cwd: RAIZ,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim() === 'true'
    )
  } catch {
    return null // sin git
  }
}

function historialConfiable() {
  const shallow = esShallow()
  if (shallow === null) return false
  if (!shallow) return true

  // Clon shallow: se intenta completar el historial. El repositorio es público,
  // así que no hacen falta credenciales. Es lo que permite tener fechas reales en
  // el build de Railway, cuyo clon viene shallow; si no hay red o remoto, se sigue
  // sin lastmod y queda el aviso.
  try {
    console.log('[sitemap] Clon shallow: recuperando el historial de git…')
    execFileSync('git', ['fetch', '--unshallow', '--quiet'], {
      cwd: RAIZ,
      stdio: 'ignore',
      timeout: 120_000,
    })
  } catch {
    return false
  }
  return esShallow() === false
}

let hayGit = historialConfiable()
/** Fecha ISO del último commit que tocó una ruta del repo (archivo o carpeta). */
function fechaCommit(rel) {
  if (!hayGit) return null
  try {
    const salida = execFileSync('git', ['log', '-1', '--format=%cI', '--', rel], {
      cwd: RAIZ,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
    return salida || null
  } catch {
    // Sin git (o sin historia) no se puede saber cuándo cambió el contenido.
    hayGit = false
    return null
  }
}


/**
 * Segundo camino para fechar: la API pública de GitHub.
 *
 * Hace falta porque el builder de Railway NO clona el repositorio, sube un
 * snapshot de archivos: no hay .git, así que git no puede decir nada (verificado
 * en el log del deploy). Red sí hay —el npm install descarga paquetes—, y la API
 * de commits acepta un `path` y devuelve el último commit que lo tocó.
 *
 * Sin autenticación son 60 peticiones por hora y este build usa ~20, con caché
 * por ruta. Si se define GITHUB_TOKEN el límite sube a 5000; es opcional.
 */
const REPO = process.env.SITEMAP_GITHUB_REPO || 'nachokm2/sabores-de-mama-site'
const cacheApi = new Map()
let apiAgotada = false
let usoApi = false

async function fechaGitHub(rel) {
  if (apiAgotada) return null
  if (cacheApi.has(rel)) return cacheApi.get(rel)

  const url = `https://api.github.com/repos/${REPO}/commits?path=${encodeURIComponent(rel)}&per_page=1`
  const cabeceras = { 'User-Agent': 'sabores-de-mama-sitemap', Accept: 'application/vnd.github+json' }
  if (process.env.GITHUB_TOKEN) cabeceras.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`

  try {
    const res = await fetch(url, { headers: cabeceras, signal: AbortSignal.timeout(15_000) })
    if (res.status === 403 || res.status === 429) {
      apiAgotada = true
      console.warn(`[sitemap] La API de GitHub respondió ${res.status} (cuota). Se omiten las fechas restantes.`)
      return null
    }
    if (!res.ok) {
      cacheApi.set(rel, null)
      return null
    }
    const commits = await res.json()
    const fecha = commits?.[0]?.commit?.committer?.date || null
    if (fecha) usoApi = true
    cacheApi.set(rel, fecha)
    return fecha
  } catch (err) {
    apiAgotada = true
    console.warn(`[sitemap] No se pudo consultar la API de GitHub (${err?.message || err}).`)
    return null
  }
}

/** lastmod de una ruta: la más reciente entre sus fuentes. */
async function lastmodDe(ruta) {
  let fuentes = FUENTES[ruta]
  if (!fuentes) {
    for (const [re, f] of FUENTES_PATRON) {
      const m = re.exec(ruta)
      if (m) {
        fuentes = typeof f === 'function' ? f(m) : f
        break
      }
    }
  }
  if (!fuentes?.length) return null

  // Primero git (local y CI); si no hay repositorio, la API de GitHub. Nunca el
  // sistema de archivos: en un snapshot o un clon reciente su fecha es la del
  // deploy, y una fecha falsa es peor que ninguna.
  const fechas = []
  for (const fuente of fuentes) {
    const f = fechaCommit(fuente) || (await fechaGitHub(fuente))
    if (f) fechas.push(f)
  }
  if (!fechas.length) return null
  // A UTC antes de recortar el día. git devuelve la fecha con el desfase local
  // (-04:00) y la API de GitHub en Z: sin normalizar, el MISMO commit daba 07-26
  // por un camino y 07-27 por el otro.
  const masReciente = fechas.map((f) => new Date(f)).sort((a, b) => a - b).pop()
  return masReciente.toISOString().slice(0, 10)
}

if (!fs.existsSync(DIST)) {
  console.error('[sitemap] No existe dist/. Corre el build primero.')
  process.exit(1)
}

const rutas = htmlsDe(DIST)
  .map((f) => {
    const rel = path.relative(DIST, f).split(path.sep).join('/')
    return rel === 'index.html' ? '/' : '/' + rel.replace(/\.html$/, '')
  })
  .sort((a, b) => (a === '/' ? -1 : b === '/' ? 1 : a.localeCompare(b)))

const sinFecha = []
const urls = []
for (const ruta of rutas) {
  const [changefreq, priority] = ajustesDe(ruta)
  const lastmod = await lastmodDe(ruta)
  if (!lastmod) sinFecha.push(ruta)
  urls.push(
    [
      '  <url>',
      `    <loc>${BASE}${ruta === '/' ? '/' : ruta}</loc>`,
      // Se OMITE si no se pudo determinar: una fecha inventada es peor que ninguna.
      lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
      `    <changefreq>${changefreq}</changefreq>`,
      `    <priority>${priority}</priority>`,
      '  </url>',
    ]
      .filter(Boolean)
      .join('\n')
  )
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`

fs.writeFileSync(path.join(DIST, 'sitemap.xml'), xml)

const distintas = new Set(xml.match(/<lastmod>[^<]+/g) || [])
const fuenteUsada = hayGit ? 'git' : usoApi ? 'API de GitHub' : 'ninguna'
console.log(
  `[sitemap] ${rutas.length} URLs → dist/sitemap.xml ` +
    `(${distintas.size} fechas distintas, fuente: ${fuenteUsada})`
)
if (!hayGit && !usoApi) {
  console.warn(
    '[sitemap] ADVERTENCIA: el sitemap va SIN lastmod. No hubo historial de git ' +
      '(el builder de Railway sube un snapshot, no clona) ni respuesta de la API de ' +
      'GitHub. Revisa la red del build o define GITHUB_TOKEN para más cuota.'
  )
}
// Solo con historial disponible la falta de fecha significa "fuentes sin declarar";
// sin historial faltan todas y el aviso de arriba ya lo explica.
if (hayGit && sinFecha.length) {
  console.warn(`[sitemap] Sin lastmod (falta declarar sus fuentes en FUENTES): ${sinFecha.join(', ')}`)
}
