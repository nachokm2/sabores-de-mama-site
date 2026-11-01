// Dominios de correo más usados por los clientes. Un dominio a 1 o 2 letras de
// uno de estos (gamil.com, hotmial.com, gmail.cl) casi siempre es un error de
// tipeo, y un email mal escrito deja al cliente sin la confirmación, los datos
// de pago ni la encuesta.
const DOMINIOS = [
  'gmail.com',
  'hotmail.com',
  'hotmail.cl',
  'outlook.com',
  'outlook.cl',
  'live.com',
  'live.cl',
  'yahoo.com',
  'yahoo.es',
  'yahoo.cl',
  'icloud.com',
]

/** Distancia de edición (Levenshtein) entre dos textos cortos. */
function distancia(a, b) {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    const fila = [i]
    for (let j = 1; j <= b.length; j++) {
      fila[j] = Math.min(prev[j] + 1, fila[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
    prev = fila
  }
  return prev[b.length]
}

/**
 * Si el dominio del email parece un error de tipeo de un dominio conocido,
 * devuelve el email corregido ("maria@gamil.com" → "maria@gmail.com"); si no,
 * null. Es sólo una sugerencia: el cliente decide si la acepta.
 */
export function sugerirEmail(email) {
  const m = String(email || '').trim().match(/^([^\s@]+)@([^\s@]+\.[^\s@]+)$/)
  if (!m) return null
  const usuario = m[1]
  const dominio = m[2].toLowerCase()
  if (DOMINIOS.includes(dominio)) return null

  let mejor = null
  let min = Infinity
  for (const d of DOMINIOS) {
    const n = distancia(dominio, d)
    if (n < min) {
      min = n
      mejor = d
    }
  }
  return min <= 2 ? `${usuario}@${mejor}` : null
}
