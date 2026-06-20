import dotenv from 'dotenv'
import { pool, withTransaction } from './index.js'
import { runMigrations } from './migrations.js'
// Reutiliza el menú estático del frontend como fuente de la verdad inicial.
import { DISH_CATEGORIES, DISH_DESCRIPTIONS } from '../../../src/data/menu.js'

dotenv.config()

/**
 * Carga el MENÚ COMPLETO (todas las categorías y platos de src/data/menu.js)
 * en la tabla `platos`, junto con INGREDIENTES de ejemplo por plato.
 *
 * - Reemplaza por completo la tabla `platos` (y sus `ingredientes` por cascada).
 * - NO toca pedidos, cupos ni admin_users.
 * - Los ingredientes son de ejemplo (curados para platos conocidos + un set por
 *   categoría para el resto). Incluyen ingredientes comunes (cebolla, ajo,
 *   aceite, sal) para que la lista de compras del flujo Cocinera consolide.
 *
 * Uso:  npm run seed:menu
 */

// Ingredientes comunes que aparecen en muchos platos → se consolidan en la lista.
const COMUNES = [
  { nombre: 'Cebolla', cantidad: '1', unidad: 'u' },
  { nombre: 'Ajo', cantidad: '2', unidad: 'dientes' },
  { nombre: 'Aceite', cantidad: '2', unidad: 'cda' },
  { nombre: 'Sal', cantidad: '1', unidad: 'cdta' },
]

// Curados para platos conocidos (parte específica; se les suman los comunes).
const CURADOS = {
  'Pollo al jugo': [{ nombre: 'Pollo', cantidad: '800', unidad: 'g' }, { nombre: 'Zanahoria', cantidad: '1', unidad: 'u' }],
  'Pollo a la mostaza': [{ nombre: 'Pollo', cantidad: '800', unidad: 'g' }, { nombre: 'Mostaza', cantidad: '2', unidad: 'cda' }, { nombre: 'Crema', cantidad: '200', unidad: 'ml' }],
  'Pollo al curry': [{ nombre: 'Pollo', cantidad: '700', unidad: 'g' }, { nombre: 'Curry', cantidad: '1', unidad: 'cda' }, { nombre: 'Leche de coco', cantidad: '200', unidad: 'ml' }],
  'Pollo arvejado': [{ nombre: 'Pollo', cantidad: '800', unidad: 'g' }, { nombre: 'Arvejas', cantidad: '300', unidad: 'g' }, { nombre: 'Zanahoria', cantidad: '1', unidad: 'u' }],
  'Carne mechada': [{ nombre: 'Posta', cantidad: '700', unidad: 'g' }, { nombre: 'Pimentón', cantidad: '1', unidad: 'u' }, { nombre: 'Zanahoria', cantidad: '1', unidad: 'u' }],
  Albóndigas: [{ nombre: 'Carne molida', cantidad: '500', unidad: 'g' }, { nombre: 'Pan rallado', cantidad: '50', unidad: 'g' }, { nombre: 'Salsa de tomate', cantidad: '400', unidad: 'ml' }],
  Cazuela: [{ nombre: 'Asado de tira', cantidad: '500', unidad: 'g' }, { nombre: 'Papa', cantidad: '3', unidad: 'u' }, { nombre: 'Zapallo', cantidad: '1', unidad: 'trozo' }, { nombre: 'Choclo', cantidad: '1', unidad: 'u' }],
  Lentejas: [{ nombre: 'Lentejas', cantidad: '400', unidad: 'g' }, { nombre: 'Chorizo', cantidad: '1', unidad: 'u' }, { nombre: 'Zanahoria', cantidad: '1', unidad: 'u' }],
  Porotos: [{ nombre: 'Porotos', cantidad: '400', unidad: 'g' }, { nombre: 'Zapallo', cantidad: '1', unidad: 'trozo' }, { nombre: 'Pimentón', cantidad: '1', unidad: 'u' }],
  Charquicán: [{ nombre: 'Carne picada', cantidad: '300', unidad: 'g' }, { nombre: 'Zapallo', cantidad: '1', unidad: 'trozo' }, { nombre: 'Papa', cantidad: '2', unidad: 'u' }, { nombre: 'Choclo', cantidad: '1', unidad: 'u' }],
  'Lasaña boloñesa': [{ nombre: 'Carne molida', cantidad: '500', unidad: 'g' }, { nombre: 'Láminas de lasaña', cantidad: '12', unidad: 'u' }, { nombre: 'Salsa de tomate', cantidad: '400', unidad: 'ml' }, { nombre: 'Queso', cantidad: '200', unidad: 'g' }],
  'Pastel de choclo': [{ nombre: 'Choclo', cantidad: '1', unidad: 'kg' }, { nombre: 'Pollo', cantidad: '300', unidad: 'g' }, { nombre: 'Carne molida', cantidad: '300', unidad: 'g' }, { nombre: 'Albahaca', cantidad: '5', unidad: 'hojas' }],
  'Pastel de papa': [{ nombre: 'Papa', cantidad: '1', unidad: 'kg' }, { nombre: 'Carne molida', cantidad: '500', unidad: 'g' }, { nombre: 'Huevo', cantidad: '2', unidad: 'u' }],
  'Tortilla española': [{ nombre: 'Papa', cantidad: '4', unidad: 'u' }, { nombre: 'Huevo', cantidad: '5', unidad: 'u' }],
  'Quiche queso jamón': [{ nombre: 'Masa de quiche', cantidad: '1', unidad: 'u' }, { nombre: 'Queso', cantidad: '200', unidad: 'g' }, { nombre: 'Jamón', cantidad: '150', unidad: 'g' }, { nombre: 'Crema', cantidad: '200', unidad: 'ml' }, { nombre: 'Huevo', cantidad: '3', unidad: 'u' }],
  Arroz: [{ nombre: 'Arroz', cantidad: '1', unidad: 'taza' }, { nombre: 'Agua', cantidad: '2', unidad: 'tazas' }],
  Puré: [{ nombre: 'Papa', cantidad: '4', unidad: 'u' }, { nombre: 'Mantequilla', cantidad: '50', unidad: 'g' }, { nombre: 'Leche', cantidad: '100', unidad: 'ml' }],
  Fideos: [{ nombre: 'Fideos', cantidad: '250', unidad: 'g' }, { nombre: 'Agua', cantidad: '1.5', unidad: 'l' }],
}

// Set específico por categoría (para los platos sin curado). Se les suman los comunes.
const POR_CATEGORIA = {
  'Carnes y Pollo': [{ nombre: 'Proteína (carne/pollo)', cantidad: '600', unidad: 'g' }, { nombre: 'Zanahoria', cantidad: '1', unidad: 'u' }],
  'Legumbres y Caldos': [{ nombre: 'Legumbre / base', cantidad: '400', unidad: 'g' }, { nombre: 'Zanahoria', cantidad: '1', unidad: 'u' }, { nombre: 'Papa', cantidad: '2', unidad: 'u' }],
  'Quiches y Tortillas': [{ nombre: 'Huevo', cantidad: '4', unidad: 'u' }, { nombre: 'Queso', cantidad: '150', unidad: 'g' }],
  'Otros Platos': [{ nombre: 'Ingrediente principal', cantidad: '400', unidad: 'g' }, { nombre: 'Salsa de tomate', cantidad: '200', unidad: 'ml' }],
  Acompañamientos: [{ nombre: 'Base', cantidad: '1', unidad: 'porción' }],
}

function ingredientesPara(nombre, categoria) {
  const especificos = CURADOS[nombre] || POR_CATEGORIA[categoria] || []
  return [...especificos, ...COMUNES]
}

async function seedMenu() {
  if (process.env.NODE_ENV === 'production' && process.env.FORCE_SEED !== 'true') {
    throw new Error('Seed bloqueado en producción. Usa FORCE_SEED=true si realmente lo quieres.')
  }

  await runMigrations()

  const { totalPlatos, totalIng } = await withTransaction(async (client) => {
    await client.query('TRUNCATE platos RESTART IDENTITY CASCADE')

    let totalPlatos = 0
    let totalIng = 0
    for (const cat of DISH_CATEGORIES) {
      for (const nombre of cat.items) {
        const descripcion = DISH_DESCRIPTIONS[nombre] || null
        const { rows } = await client.query(
          `INSERT INTO platos (nombre, descripcion, categoria, activo)
           VALUES ($1, $2, $3, true) RETURNING id`,
          [nombre, descripcion, cat.label]
        )
        const platoId = rows[0].id
        for (const ing of ingredientesPara(nombre, cat.label)) {
          await client.query(
            `INSERT INTO ingredientes (plato_id, nombre, cantidad, unidad) VALUES ($1,$2,$3,$4)`,
            [platoId, ing.nombre, ing.cantidad, ing.unidad]
          )
          totalIng++
        }
        totalPlatos++
      }
    }
    return { totalPlatos, totalIng }
  })

  console.log(`[seed:menu] Menú cargado: ${totalPlatos} platos y ${totalIng} ingredientes en ${DISH_CATEGORIES.length} categorías.`)
}

seedMenu()
  .then(() => pool.end())
  .then(() => {
    console.log('[seed:menu] Listo.')
    process.exit(0)
  })
  .catch((err) => {
    console.error('[seed:menu] Error:', err.message)
    pool.end().finally(() => process.exit(1))
  })
