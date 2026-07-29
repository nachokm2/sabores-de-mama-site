import { marked } from 'marked'

// Carga TODOS los artículos .md en el build (import.meta.glob, eager + raw).
// El contenido queda pre-renderizado; no hay CMS ni fetch en runtime.
const files = import.meta.glob('../content/blog/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})

// Parser mínimo de frontmatter (bloque `---` con pares `clave: valor`).
function parseFrontmatter(raw) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw)
  if (!m) return { data: {}, body: raw }
  const data = {}
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(':')
    if (i === -1) continue
    const key = line.slice(0, i).trim()
    const val = line.slice(i + 1).trim().replace(/^["']|["']$/g, '')
    if (key) data[key] = val
  }
  return { data, body: m[2] }
}

const slugFromPath = (p) => p.split('/').pop().replace(/\.md$/, '')

// Formatea una fecha ISO (YYYY-MM-DD) a texto en español, sin depender de la
// zona horaria (se parsea como fecha local fija).
export function fmtFecha(iso) {
  if (!iso) return ''
  const [y, mth, d] = iso.split('-').map(Number)
  if (!y || !mth || !d) return iso
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
  return `${d} de ${meses[mth - 1]} de ${y}`
}

export const POSTS = Object.entries(files)
  .map(([path, raw]) => {
    const { data, body } = parseFrontmatter(raw)
    return {
      slug: data.slug || slugFromPath(path),
      title: data.title || 'Sin título',
      description: data.description || '',
      date: data.date || '',
      author: data.author || 'Sabores de Mamá',
      type: data.type || 'article',
      cover: data.cover || '',
      html: marked.parse(body),
    }
  })
  .sort((a, b) => (a.date < b.date ? 1 : -1)) // más nuevo primero

export const POST_SLUGS = POSTS.map((p) => p.slug)
export const getPost = (slug) => POSTS.find((p) => p.slug === slug) || null
