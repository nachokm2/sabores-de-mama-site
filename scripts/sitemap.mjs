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

/** lastmod de una ruta: la más reciente entre sus fuentes. */
function lastmodDe(ruta) {
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

  // Solo git. El respaldo por mtime se descartó a propósito: ver historialConfiable().
  const fechas = fuentes.map(fechaCommit).filter(Boolean).sort()
  return fechas.length ? fechas[fechas.length - 1].slice(0, 10) : null
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
const urls = rutas.map((ruta) => {
  const [changefreq, priority] = ajustesDe(ruta)
  const lastmod = lastmodDe(ruta)
  if (!lastmod) sinFecha.push(ruta)
  return [
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
})

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`

fs.writeFileSync(path.join(DIST, 'sitemap.xml'), xml)

const distintas = new Set(xml.match(/<lastmod>[^<]+/g) || [])
console.log(
  `[sitemap] ${rutas.length} URLs → dist/sitemap.xml ` +
    `(${distintas.size} fechas distintas, fuente: ${hayGit ? 'git' : 'sistema de archivos'})`
)
if (!hayGit) {
  console.warn(
    '[sitemap] ADVERTENCIA: sin historial de git completo (clon shallow o sin git), ' +
      'el sitemap va SIN lastmod. Para tener fechas reales por página, el build ' +
      'necesita el historial: en GitHub Actions, actions/checkout con fetch-depth: 0.'
  )
}
// Solo con historial disponible la falta de fecha significa "fuentes sin declarar";
// sin historial faltan todas y el aviso de arriba ya lo explica.
if (hayGit && sinFecha.length) {
  console.warn(`[sitemap] Sin lastmod (falta declarar sus fuentes en FUENTES): ${sinFecha.join(', ')}`)
}
