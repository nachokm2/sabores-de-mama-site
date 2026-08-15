/**
 * Clasificación de ingredientes por categoría, para el checklist de compras.
 *
 * La tabla `ingredientes` no guarda categoría, así que se deduce del nombre. Es
 * una heurística por palabras clave: acierta en el catálogo actual y cuando no
 * reconoce algo lo manda a "Otros", que es un fallo inofensivo —el ingrediente
 * aparece igual en la lista, solo en otra sección— y nunca uno que lo oculte.
 */

// Orden en que se imprimen las secciones del checklist.
export const CATEGORIAS = ['Proteínas', 'Verduras', 'Frutas', 'Lácteos', 'Carbohidratos', 'Otros']

const PALABRAS = {
  Proteínas: [
    'carne', 'molida', 'pollo', 'pechuga', 'posta', 'vacuno', 'cerdo', 'pavo', 'lomo',
    'filete', 'filetito', 'asado aleman', 'asado de tira', 'chuleta', 'costillar', 'pescado', 'salmon',
    'merluza', 'reineta', 'atun', 'camaron', 'marisco', 'huevo', 'jamon', 'tocino',
    'longaniza', 'chorizo', 'salchicha', 'vienesa', 'prieta', 'tofu',
  ],
  Verduras: [
    'cebolla', 'ajo', 'tomate', 'papa', 'zanahoria', 'zapallo', 'espinaca', 'lechuga',
    'champinon', 'pimenton', 'morron', 'choclo', 'poroto verde', 'apio', 'pepino',
    'brocoli', 'coliflor', 'betarraga', 'acelga', 'cilantro', 'perejil', 'albahaca',
    'puerro', 'arveja', 'alcachofa', 'repollo', 'rucula', 'palta', 'aceituna', 'berenjena',
    'zuccini', 'esparrago', 'rabanito', 'porro',
  ],
  Frutas: [
    'manzana', 'pera', 'platano', 'frutilla', 'frambuesa', 'arandano', 'mora',
    'naranja', 'limon', 'mandarina', 'uva', 'durazno', 'pina', 'mango', 'kiwi',
    'melon', 'sandia', 'ciruela', 'damasco', 'higo', 'pasas', 'cereza', 'papaya',
  ],
  Lácteos: [
    'leche', 'crema', 'queso', 'quesillo', 'mantequilla', 'margarina', 'yogur',
    'yoghurt', 'ricotta', 'parmesano', 'mantecoso', 'chanco', 'manjar', 'nata',
  ],
  Carbohidratos: [
    'arroz', 'pasta', 'tallarin', 'fideo', 'spaghetti', 'quinoa', 'cuscus', 'cus cus',
    'harina', 'pan', 'avena', 'lenteja', 'garbanzo', 'poroto', 'maicena', 'semola',
    'polenta', 'masa', 'tortilla de trigo', 'galleta', 'arroz integral', 'legumbre',
  ],
}

/**
 * Excepciones evaluadas ANTES que las palabras clave: nombres compuestos que
 * contienen la palabra de otra categoría. Sin esto "salsa de tomate" caería en
 * Verduras y "crema de leche" competiría entre dos reglas.
 */
const EXCEPCIONES = [
  [/salsa de tomate/, 'Otros'],
  [/salsa de soya/, 'Otros'],
  [/salsa teriyaki|teriyaki/, 'Otros'],
  [/pan rallado/, 'Carbohidratos'],
  [/polvos de hornear|polvo de hornear/, 'Otros'],
  [/crema de leche/, 'Lácteos'],
  [/leche condensada|leche de coco/, 'Otros'],
  [/aceite de oliva|aceite/, 'Otros'],
  [/vinagre|mostaza|mayonesa|ketchup/, 'Otros'],
  [/azucar|endulzante|miel/, 'Otros'],
  [/cacao|chocolate|vainilla|canela/, 'Otros'],
  [/nuez|nueces|almendra|mani|semilla|chia|linaza/, 'Otros'],
  // "Sobre o cubo de pollo" es caldo concentrado, no una proteína: sin esta regla
  // caía en Proteínas por la palabra "pollo".
  [/caldo|cubito|cubo de|sobre o cubo/, 'Otros'],
  [/sal\b|pimienta|comino|oregano|paprika|curry|aji\b|merken|alino|laurel/, 'Otros'],
  [/vino|cerveza|pisco/, 'Otros'],
]

/** Quita acentos y baja a minúsculas, para comparar sin sorpresas. */
function normalizar(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // marcas diacríticas que separa NFD
    .toLowerCase()
    .trim()
}

/** Categoría de un ingrediente por su nombre. Si no se reconoce → "Otros". */
export function categorizarIngrediente(nombre) {
  const n = normalizar(nombre)
  if (!n) return 'Otros'

  for (const [re, cat] of EXCEPCIONES) if (re.test(n)) return cat

  for (const cat of CATEGORIAS) {
    const palabras = PALABRAS[cat]
    if (!palabras) continue
    // Se compara por inclusión: "pechuga de pollo" cae en Proteínas por "pollo",
    // y "zapallo italiano" en Verduras por "zapallo".
    if (palabras.some((p) => n.includes(p))) return cat
  }
  return 'Otros'
}

/**
 * Agrupa los ingredientes de un pedido por categoría, consolidando el total de
 * cada uno y conservando el desglose por plato (igual que el checklist en papel:
 * "Choclo: 300 g en total (panqueques 200 g + ensalada 100 g)").
 *
 * @param {Array<{nombre:string, ingredientes:Array<{nombre,cantidad,unidad}>}>} platosConIng
 * @returns {Array<{categoria:string, items:Array<{nombre,unidad,total,detalle}>}>}
 */
export function agruparPorCategoria(platosConIng) {
  const porIngrediente = new Map()

  for (const plato of Array.isArray(platosConIng) ? platosConIng : []) {
    for (const ing of Array.isArray(plato?.ingredientes) ? plato.ingredientes : []) {
      if (!ing?.nombre) continue
      const unidad = ing.unidad || ''
      const clave = `${normalizar(ing.nombre)}|${normalizar(unidad)}`
      if (!porIngrediente.has(clave)) {
        porIngrediente.set(clave, { nombre: ing.nombre, unidad, num: 0, hayNum: false, textos: [], detalle: [] })
      }
      const e = porIngrediente.get(clave)
      const cantidad = ing.cantidad
      const numero = typeof cantidad === 'number' ? cantidad : parseFloat(String(cantidad ?? '').replace(',', '.'))
      if (Number.isFinite(numero)) {
        e.num += numero
        e.hayNum = true
      } else if (cantidad != null && String(cantidad).trim() && !e.textos.includes(String(cantidad))) {
        e.textos.push(String(cantidad))
      }
      e.detalle.push({ plato: plato.nombre || 'Plato', cantidad })
    }
  }

  const items = [...porIngrediente.values()].map((e) => ({
    nombre: e.nombre,
    unidad: e.unidad,
    // Redondeo a 2 decimales para no arrastrar 0.30000000000000004.
    total: e.hayNum ? Math.round(e.num * 100) / 100 : e.textos.join(' / ') || '—',
    detalle: e.detalle,
    categoria: categorizarIngrediente(e.nombre),
  }))

  return CATEGORIAS.map((categoria) => ({
    categoria,
    items: items
      .filter((i) => i.categoria === categoria)
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
  })).filter((g) => g.items.length)
}
