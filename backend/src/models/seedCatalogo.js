import dotenv from 'dotenv'
import { pool, withTransaction } from './index.js'
import { runMigrations } from './migrations.js'

dotenv.config()

/**
 * Reemplaza POR COMPLETO el catálogo de platos con el de `catalogoPlatos.js`:
 * - TRUNCATE platos (y sus ingredientes por cascada).
 * - Cada plato lleva sus flags de servicio (meal_prep / cocinera), categoría e
 *   ingredientes con cantidades EXACTAS por nº de personas (p1..p5).
 * - NO toca pedidos, cupos ni admin_users (pedidos guarda un snapshot de platos).
 *
 * Devuelve un resumen { totalPlatos, totalIng, porServicio, porCategoria }.
 * Reutilizable desde el CLI (`npm run seed:catalogo`) y desde el panel admin.
 * Asume que las migraciones ya corrieron (columnas meal_prep/cocinera, p1..p5).
 */
export async function cargarCatalogo() {
  // Import dinámico y backend-local: el servidor arranca sin depender de este
  // archivo; sólo se carga cuando se ejecuta la recarga del catálogo.
  const { CATALOGO_PLATOS } = await import('../data/catalogoPlatos.js')
  return withTransaction(async (client) => {
    await client.query('TRUNCATE platos RESTART IDENTITY CASCADE')

    let totalPlatos = 0
    let totalIng = 0
    const porServicio = { meal_prep: 0, cocinera: 0 }
    const porCategoria = {}

    for (const plato of CATALOGO_PLATOS) {
      const servicios = plato.servicios || []
      const mealPrep = servicios.includes('meal_prep')
      const cocinera = servicios.includes('cocinera')

      const { rows } = await client.query(
        `INSERT INTO platos (nombre, descripcion, categoria, activo, meal_prep, cocinera)
         VALUES ($1, $2, $3, true, $4, $5) RETURNING id`,
        [plato.nombre, plato.descripcion || null, plato.categoria || null, mealPrep, cocinera]
      )
      const platoId = rows[0].id

      for (const ing of plato.ingredientes || []) {
        const p = ing.p || []
        await client.query(
          `INSERT INTO ingredientes (plato_id, nombre, unidad, p1, p2, p3, p4, p5)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [platoId, ing.nombre, ing.unidad || null, p[0] ?? null, p[1] ?? null, p[2] ?? null, p[3] ?? null, p[4] ?? null]
        )
        totalIng++
      }

      totalPlatos++
      if (mealPrep) porServicio.meal_prep++
      if (cocinera) porServicio.cocinera++
      porCategoria[plato.categoria] = (porCategoria[plato.categoria] || 0) + 1
    }

    return { totalPlatos, totalIng, porServicio, porCategoria }
  })
}

// ── CLI: `npm run seed:catalogo` (en prod requiere FORCE_SEED=true) ───────────
const isMain = process.argv[1] && process.argv[1].endsWith('seedCatalogo.js')
if (isMain) {
  ;(async () => {
    if (process.env.NODE_ENV === 'production' && process.env.FORCE_SEED !== 'true') {
      throw new Error('Seed bloqueado en producción. Usa FORCE_SEED=true si realmente lo quieres.')
    }
    await runMigrations()
    const r = await cargarCatalogo()
    console.log(`[seed:catalogo] Catálogo cargado: ${r.totalPlatos} platos, ${r.totalIng} ingredientes.`)
    console.log(`[seed:catalogo] Por servicio → Meal Prep: ${r.porServicio.meal_prep} · Cocinera: ${r.porServicio.cocinera}`)
    console.log('[seed:catalogo] Por categoría:')
    for (const [cat, n] of Object.entries(r.porCategoria)) console.log(`  - ${cat}: ${n}`)
  })()
    .then(() => pool.end())
    .then(() => {
      console.log('[seed:catalogo] Listo.')
      process.exit(0)
    })
    .catch((err) => {
      console.error('[seed:catalogo] Error:', err.message)
      pool.end().finally(() => process.exit(1))
    })
}
