import dotenv from 'dotenv'
import { pool, withTransaction } from './index.js'
import { runMigrations } from './migrations.js'

dotenv.config()

/**
 * Datos de ejemplo para probar el panel admin.
 *
 * ⚠️  RESETEA las tablas de datos (pedidos, ingredientes, platos, cupos,
 *     productos_hornear) — NO toca admin_users. Pensado para desarrollo/demo.
 *     Para ejecutarlo en producción hay que pasar FORCE_SEED=true.
 *
 * Uso:  npm run seed
 */

// Helper de fechas (YYYY-MM-DD, zona local) relativas a hoy.
function addDays(n) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  const pad = (x) => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const HOY = addDays(0)
const D3 = addDays(3)
const D5 = addDays(5)
const D7 = addDays(7)
const D10 = addDays(10)
const D14 = addDays(14)
const PASADA = addDays(-2)

const PLATOS = [
  {
    nombre: 'Lasaña Boloñesa',
    categoria: 'Otros Platos',
    descripcion: 'Capas de pasta con carne y bechamel gratinada.',
    activo: true,
    ingredientes: [
      { nombre: 'Carne molida', cantidad: '500', unidad: 'g' },
      { nombre: 'Láminas de lasaña', cantidad: '12', unidad: 'u' },
      { nombre: 'Salsa de tomate', cantidad: '400', unidad: 'ml' },
      { nombre: 'Queso', cantidad: '200', unidad: 'g' },
    ],
  },
  {
    nombre: 'Pollo al Curry',
    categoria: 'Carnes y Pollo',
    descripcion: 'Pollo en salsa aromática de especias y leche de coco.',
    activo: true,
    ingredientes: [
      { nombre: 'Pechuga de pollo', cantidad: '600', unidad: 'g' },
      { nombre: 'Curry', cantidad: '1', unidad: 'cda' },
      { nombre: 'Leche de coco', cantidad: '200', unidad: 'ml' },
      { nombre: 'Cebolla', cantidad: '1', unidad: 'u' },
    ],
  },
  {
    nombre: 'Cazuela de Vacuno',
    categoria: 'Legumbres y Caldos',
    descripcion: 'Caldo reconfortante con carne, papa, zapallo y choclo.',
    activo: true,
    ingredientes: [
      { nombre: 'Asado de tira', cantidad: '500', unidad: 'g' },
      { nombre: 'Papa', cantidad: '3', unidad: 'u' },
      { nombre: 'Zapallo', cantidad: '1', unidad: 'trozo' },
      { nombre: 'Choclo', cantidad: '1', unidad: 'u' },
    ],
  },
  {
    nombre: 'Quiche de Champiñón',
    categoria: 'Quiches y Tortillas',
    descripcion: 'Tarta salada con champiñones salteados y crema.',
    activo: true,
    ingredientes: [
      { nombre: 'Masa quiche', cantidad: '1', unidad: 'u' },
      { nombre: 'Champiñón', cantidad: '200', unidad: 'g' },
      { nombre: 'Crema', cantidad: '200', unidad: 'ml' },
      { nombre: 'Huevo', cantidad: '3', unidad: 'u' },
    ],
  },
  {
    nombre: 'Tortilla Española',
    categoria: 'Quiches y Tortillas',
    descripcion: 'Tortilla jugosa de papa y huevo a la española.',
    activo: true,
    ingredientes: [
      { nombre: 'Papa', cantidad: '4', unidad: 'u' },
      { nombre: 'Huevo', cantidad: '5', unidad: 'u' },
      { nombre: 'Cebolla', cantidad: '1', unidad: 'u' },
    ],
  },
  {
    // Ejemplo de plato inactivo (no aparece en el menú público).
    nombre: 'Charquicán',
    categoria: 'Otros Platos',
    descripcion: 'Guiso chileno de papa, zapallo y carne picada.',
    activo: false,
    ingredientes: [
      { nombre: 'Carne picada', cantidad: '300', unidad: 'g' },
      { nombre: 'Zapallo', cantidad: '1', unidad: 'trozo' },
      { nombre: 'Papa', cantidad: '2', unidad: 'u' },
    ],
  },
]

const PRODUCTOS_HORNEAR = [
  { nombre: 'Pie de Limón', descripcion: 'Base de yogurt y avena', precio: 8500, activo: true },
  { nombre: 'Brownie Nuez', descripcion: 'Con nueces', precio: 9000, activo: true },
  { nombre: 'Queque Manzana Canela', descripcion: 'Manzana y canela', precio: 7500, activo: true },
]

// fecha → capacidad. Los pedidos seedeados ajustarán pedidos_confirmados.
const CUPOS = [
  { fecha: HOY, capacidad: 5, activo: true },
  { fecha: D3, capacidad: 5, activo: true },
  { fecha: D5, capacidad: 8, activo: true },
  { fecha: D7, capacidad: 3, activo: true }, // se llenará por completo
  { fecha: D10, capacidad: 6, activo: true },
  { fecha: D14, capacidad: 10, activo: true },
  { fecha: PASADA, capacidad: 4, activo: true }, // pasada: visible sólo en admin
]

const PEDIDOS = [
  {
    nombre: 'María González', email: 'maria.gonzalez@example.com', telefono: '+56 9 1111 1111',
    comuna: 'Las Condes', direccion: 'Av. Apoquindo 1234', fecha_entrega: HOY,
    servicio: 'meal_prep', estado: 'en_preparacion', tipo_entrega: 'delivery',
    costo_despacho: 8000, total: 68000,
    platos: ['Lasaña Boloñesa', 'Pollo al Curry', 'Cazuela de Vacuno', 'Tortilla Española', 'Quiche de Champiñón'],
    restricciones: ['sin lactosa'],
  },
  {
    nombre: 'Pedro Soto', email: 'pedro.soto@example.com', telefono: '+56 9 2222 2222',
    comuna: 'Providencia', direccion: 'Av. Providencia 4321', fecha_entrega: D3,
    servicio: 'cocinera', estado: 'solicitud_recibida', tipo_entrega: 'domicilio',
    costo_despacho: 0, total: 55000,
    platos: ['Cazuela de Vacuno', 'Tortilla Española'],
    restricciones: [],
  },
  {
    nombre: 'Camila Rivas', email: 'camila.rivas@example.com', telefono: '+56 9 3333 3333',
    comuna: 'Ñuñoa', direccion: 'Irarrázaval 555', fecha_entrega: D3,
    servicio: 'meal_prep', estado: 'pagado', tipo_entrega: 'delivery',
    costo_despacho: 7000, total: 67000,
    platos: ['Pollo al Curry', 'Lasaña Boloñesa', 'Quiche de Champiñón', 'Cazuela de Vacuno', 'Tortilla Española'],
    restricciones: ['sin gluten'],
  },
  {
    nombre: 'Jorge Méndez', email: 'jorge.mendez@example.com', telefono: '+56 9 4444 4444',
    comuna: 'Vitacura', direccion: 'Av. Vitacura 7777', fecha_entrega: D5,
    servicio: 'cocinera', estado: 'entregado', tipo_entrega: 'domicilio',
    costo_despacho: 0, total: 55000,
    platos: ['Lasaña Boloñesa', 'Pollo al Curry'],
    restricciones: [],
  },
  {
    nombre: 'Antonia Fuentes', email: 'antonia.fuentes@example.com', telefono: '+56 9 5555 5555',
    comuna: 'La Reina', direccion: 'Av. Larraín 999', fecha_entrega: D7,
    servicio: 'meal_prep', estado: 'pagado', tipo_entrega: 'delivery',
    costo_despacho: 7000, total: 67000,
    platos: ['Cazuela de Vacuno', 'Tortilla Española', 'Quiche de Champiñón', 'Pollo al Curry', 'Lasaña Boloñesa'],
    restricciones: [],
  },
  {
    nombre: 'Diego Castro', email: 'diego.castro@example.com', telefono: '+56 9 6666 6666',
    comuna: 'Santiago', direccion: 'Alameda 1000', fecha_entrega: D7,
    servicio: 'meal_prep', estado: 'en_preparacion', tipo_entrega: 'delivery',
    costo_despacho: 5000, total: 65000,
    platos: ['Pollo al Curry', 'Lasaña Boloñesa', 'Cazuela de Vacuno', 'Tortilla Española', 'Quiche de Champiñón'],
    restricciones: ['vegetariano (sin carne en lo posible)'],
  },
  {
    nombre: 'Valentina Rojas', email: 'valentina.rojas@example.com', telefono: '+56 9 7777 7777',
    comuna: 'Ñuñoa', direccion: 'Av. Grecia 250', fecha_entrega: D7,
    servicio: 'cocinera', estado: 'solicitud_recibida', tipo_entrega: 'domicilio',
    costo_despacho: 0, total: 55000,
    platos: ['Cazuela de Vacuno', 'Quiche de Champiñón'],
    restricciones: [],
  },
]

async function seed() {
  if (process.env.NODE_ENV === 'production' && process.env.FORCE_SEED !== 'true') {
    throw new Error('Seed bloqueado en producción. Usa FORCE_SEED=true si realmente lo quieres.')
  }

  await runMigrations()

  await withTransaction(async (client) => {
    // Reset de las tablas de datos (no admin_users). RESTART IDENTITY reinicia los ids.
    await client.query('TRUNCATE pedidos, ingredientes, platos, cupos, productos_hornear RESTART IDENTITY CASCADE')

    // Platos + ingredientes
    for (const p of PLATOS) {
      const { rows } = await client.query(
        `INSERT INTO platos (nombre, descripcion, categoria, activo)
         VALUES ($1,$2,$3,$4) RETURNING id`,
        [p.nombre, p.descripcion, p.categoria, p.activo]
      )
      const platoId = rows[0].id
      for (const ing of p.ingredientes) {
        await client.query(
          `INSERT INTO ingredientes (plato_id, nombre, cantidad, unidad)
           VALUES ($1,$2,$3,$4)`,
          [platoId, ing.nombre, ing.cantidad, ing.unidad]
        )
      }
    }

    // Productos para hornear
    for (const ph of PRODUCTOS_HORNEAR) {
      await client.query(
        `INSERT INTO productos_hornear (nombre, descripcion, precio, activo)
         VALUES ($1,$2,$3,$4)`,
        [ph.nombre, ph.descripcion, ph.precio, ph.activo]
      )
    }

    // Cupos (pedidos_confirmados se calcula según los pedidos seedeados)
    const confirmadosPorFecha = PEDIDOS.reduce((acc, ped) => {
      acc[ped.fecha_entrega] = (acc[ped.fecha_entrega] || 0) + 1
      return acc
    }, {})
    for (const c of CUPOS) {
      await client.query(
        `INSERT INTO cupos (fecha, capacidad_maxima, pedidos_confirmados, activo)
         VALUES ($1,$2,$3,$4)`,
        [c.fecha, c.capacidad, confirmadosPorFecha[c.fecha] || 0, c.activo]
      )
    }

    // Pedidos
    for (const ped of PEDIDOS) {
      await client.query(
        `INSERT INTO pedidos
           (nombre, email, telefono, direccion, comuna, fecha_entrega,
            platos, restricciones, observaciones, tipo_entrega,
            costo_despacho, total, estado, servicio, productos_hornear)
         VALUES
           ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9,$10,$11,$12,$13,$14,$15::jsonb)`,
        [
          ped.nombre, ped.email, ped.telefono, ped.direccion, ped.comuna, ped.fecha_entrega,
          JSON.stringify(ped.platos), JSON.stringify(ped.restricciones), null, ped.tipo_entrega,
          ped.costo_despacho, ped.total, ped.estado, ped.servicio, JSON.stringify([]),
        ]
      )
    }
  })

  console.log('[seed] Datos de ejemplo cargados:')
  console.log(`        · ${PLATOS.length} platos (con ingredientes)`)
  console.log(`        · ${PRODUCTOS_HORNEAR.length} productos para hornear`)
  console.log(`        · ${CUPOS.length} cupos (hoy, futuros y 1 pasada)`)
  console.log(`        · ${PEDIDOS.length} pedidos en varios estados`)
}

seed()
  .then(() => pool.end())
  .then(() => {
    console.log('[seed] Listo.')
    process.exit(0)
  })
  .catch((err) => {
    console.error('[seed] Error:', err.message)
    pool.end().finally(() => process.exit(1))
  })
