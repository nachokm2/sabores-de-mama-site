// Utilidades de ingredientes compartidas entre el endpoint de la lista de compras
// (routes/platos.js) y el correo transaccional (services/mailService.js), para que
// la consolidación sea idéntica en ambos lados.

// Convierte una cantidad textual ("½", "1½", "260", "A gusto", "2 cdas") a número
// puro cuando es posible; si no, la deja como texto (unidad embebida, "A gusto"…).
export function parseCantidad(v) {
  if (v == null) return { num: null, text: null }
  const s = String(v).trim()
  if (!s) return { num: null, text: null }
  const norm = s.replace('½', '.5').replace('¼', '.25').replace('¾', '.75').replace(',', '.')
  if (/^\d*\.?\d+$/.test(norm)) return { num: parseFloat(norm), text: null }
  return { num: null, text: s }
}

/**
 * Consolida una lista PLANA de ingredientes sumando las cantidades del mismo
 * ingrediente (agrupado por nombre + unidad, sin distinguir mayúsculas/espacios).
 * Los valores numéricos se suman; los textuales ("A gusto") se preservan sin
 * duplicar. Así la persona recibe UN solo total por ingrediente en vez de verlos
 * repetidos por cada plato.
 *
 * @param {Array<{nombre:string, unidad?:string, cantidad:(number|string)}>} items
 * @returns {Array<{nombre:string, unidad:string, cantidad:(number|string)}>}
 */
export function consolidarIngredientes(items) {
  const map = new Map()
  for (const it of Array.isArray(items) ? items : []) {
    if (!it || it.nombre == null) continue
    const nombre = String(it.nombre)
    const unidad = it.unidad || ''
    const key = `${nombre.trim().toLowerCase()}|${String(unidad).trim().toLowerCase()}`
    if (!map.has(key)) map.set(key, { nombre, unidad, num: 0, hayNum: false, textos: new Set() })
    const e = map.get(key)
    const { num, text } = parseCantidad(it.cantidad)
    if (num != null) {
      e.num += num
      e.hayNum = true
    } else if (text) {
      e.textos.add(text)
    }
  }

  return Array.from(map.values()).map((e) => {
    let cantidad
    if (e.hayNum && e.textos.size === 0) cantidad = Math.round(e.num * 100) / 100
    else if (!e.hayNum && e.textos.size) cantidad = [...e.textos].join(', ')
    else if (e.hayNum && e.textos.size) cantidad = `${Math.round(e.num * 100) / 100} + ${[...e.textos].join(', ')}`
    else cantidad = ''
    return { nombre: e.nombre, unidad: e.unidad, cantidad }
  })
}
