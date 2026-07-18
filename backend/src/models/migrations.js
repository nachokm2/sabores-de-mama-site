import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import { pool } from './index.js'

dotenv.config()

/**
 * Migraciones idempotentes: crean los tipos ENUM, las tablas, los índices
 * y un usuario admin inicial (si se definen ADMIN_EMAIL/ADMIN_PASSWORD).
 * Se pueden ejecutar tantas veces como sea necesario sin efectos secundarios.
 */

const SQL = `
-- ── Tipos ENUM (envueltos en DO para que sean idempotentes) ──
DO $$ BEGIN
  CREATE TYPE estado_pedido AS ENUM
    ('solicitud_recibida', 'pagado', 'en_preparacion', 'entregado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE servicio_tipo AS ENUM ('meal_prep', 'cocinera');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── platos ──
CREATE TABLE IF NOT EXISTS platos (
  id          SERIAL PRIMARY KEY,
  nombre      VARCHAR(150) NOT NULL,
  descripcion TEXT,
  categoria   VARCHAR(100),
  imagen      TEXT,
  activo      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── ingredientes (FK → platos) ──
CREATE TABLE IF NOT EXISTS ingredientes (
  id         SERIAL PRIMARY KEY,
  plato_id   INTEGER NOT NULL REFERENCES platos(id) ON DELETE CASCADE,
  nombre     VARCHAR(150) NOT NULL,
  cantidad   VARCHAR(100),
  unidad     VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── cupos (capacidad por fecha) ──
CREATE TABLE IF NOT EXISTS cupos (
  id                  SERIAL PRIMARY KEY,
  fecha               DATE NOT NULL UNIQUE,
  capacidad_maxima    INTEGER NOT NULL DEFAULT 0,
  pedidos_confirmados INTEGER NOT NULL DEFAULT 0,
  activo              BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT cupos_no_negativos CHECK (pedidos_confirmados >= 0)
);

-- ── comunas (cobertura + costo de despacho por comuna) ──
CREATE TABLE IF NOT EXISTS comunas (
  id             SERIAL PRIMARY KEY,
  nombre         VARCHAR(120) NOT NULL UNIQUE,
  costo_despacho INTEGER NOT NULL DEFAULT 0,
  activo         BOOLEAN NOT NULL DEFAULT true,
  meal_prep      BOOLEAN NOT NULL DEFAULT true,
  cocinera       BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── productos_hornear ──
CREATE TABLE IF NOT EXISTS productos_hornear (
  id          SERIAL PRIMARY KEY,
  nombre      VARCHAR(150) NOT NULL,
  descripcion TEXT,
  precio      NUMERIC(10,2) NOT NULL DEFAULT 0,
  imagen      TEXT,
  formato     VARCHAR(120),
  porciones   VARCHAR(80),
  activo      BOOLEAN NOT NULL DEFAULT true
);

-- ── pedidos ──
CREATE TABLE IF NOT EXISTS pedidos (
  id                SERIAL PRIMARY KEY,
  nombre            VARCHAR(150) NOT NULL,
  email             VARCHAR(150) NOT NULL,
  telefono          VARCHAR(50),
  direccion         VARCHAR(255),
  comuna            VARCHAR(100),
  fecha_entrega     DATE NOT NULL,
  platos            JSONB NOT NULL DEFAULT '[]'::jsonb,
  restricciones     JSONB NOT NULL DEFAULT '[]'::jsonb,
  observaciones     TEXT,
  tipo_entrega      VARCHAR(50),
  costo_despacho    NUMERIC(10,2) NOT NULL DEFAULT 0,
  total             NUMERIC(10,2) NOT NULL DEFAULT 0,
  estado            estado_pedido NOT NULL DEFAULT 'solicitud_recibida',
  servicio          servicio_tipo NOT NULL,
  productos_hornear JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── servicios_config (ajustes por servicio: precio base, etc.) ──
CREATE TABLE IF NOT EXISTS servicios_config (
  servicio    VARCHAR(30) PRIMARY KEY,
  precio_base INTEGER NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Semilla idempotente: precios base por defecto (la admin los ajusta luego).
INSERT INTO servicios_config (servicio, precio_base) VALUES
  ('meal_prep', 60000),
  ('cocinera',  55000)
ON CONFLICT (servicio) DO NOTHING;

-- ── admin_users ──
CREATE TABLE IF NOT EXISTS admin_users (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  nombre        VARCHAR(150),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Índices ──
CREATE INDEX IF NOT EXISTS idx_pedidos_estado        ON pedidos(estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_fecha_entrega ON pedidos(fecha_entrega);
CREATE INDEX IF NOT EXISTS idx_ingredientes_plato    ON ingredientes(plato_id);
CREATE INDEX IF NOT EXISTS idx_cupos_fecha           ON cupos(fecha);

-- ── Columnas añadidas (idempotente) ──
-- Lista de compras editable del flujo Cocinera a Domicilio.
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS lista_compras JSONB NOT NULL DEFAULT '[]'::jsonb;
-- Número de comensales (flujo Cocinera): escala ingredientes y porciones.
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS personas INTEGER;
-- Disponibilidad de cada comuna por servicio (para tablas ya existentes).
ALTER TABLE comunas ADD COLUMN IF NOT EXISTS meal_prep BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE comunas ADD COLUMN IF NOT EXISTS cocinera  BOOLEAN NOT NULL DEFAULT true;
-- Productos para hornear: foto, formato/cantidad y porciones (para tablas existentes).
ALTER TABLE productos_hornear ADD COLUMN IF NOT EXISTS imagen    TEXT;
ALTER TABLE productos_hornear ADD COLUMN IF NOT EXISTS formato   VARCHAR(120);
ALTER TABLE productos_hornear ADD COLUMN IF NOT EXISTS porciones VARCHAR(80);
-- Foto del plato.
ALTER TABLE platos ADD COLUMN IF NOT EXISTS imagen TEXT;
-- Usuarios: rol (admin|cliente), teléfono, dirección y recuperación de contraseña.
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS rol VARCHAR(20) NOT NULL DEFAULT 'admin';
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS telefono VARCHAR(50);
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS direccion VARCHAR(255);
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS reset_token_exp TIMESTAMPTZ;
-- Vincula una reserva/pedido a la cuenta del cliente (null = pedido público).
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS usuario_id INTEGER REFERENCES admin_users(id);
-- Comunas: costo y disponibilidad INDEPENDIENTES por servicio.
ALTER TABLE comunas ADD COLUMN IF NOT EXISTS costo_meal_prep  INTEGER;
ALTER TABLE comunas ADD COLUMN IF NOT EXISTS costo_cocinera   INTEGER;
ALTER TABLE comunas ADD COLUMN IF NOT EXISTS activo_meal_prep BOOLEAN;
ALTER TABLE comunas ADD COLUMN IF NOT EXISTS activo_cocinera  BOOLEAN;
-- Copia UNA sola vez desde el modelo anterior (luego quedan no-nulas).
UPDATE comunas SET
  costo_meal_prep  = COALESCE(costo_meal_prep,  costo_despacho),
  costo_cocinera   = COALESCE(costo_cocinera,   costo_despacho),
  activo_meal_prep = COALESCE(activo_meal_prep, activo AND meal_prep),
  activo_cocinera  = COALESCE(activo_cocinera,  activo AND cocinera)
WHERE costo_meal_prep IS NULL OR costo_cocinera IS NULL
   OR activo_meal_prep IS NULL OR activo_cocinera IS NULL;

-- Servicios adicionales configurables de Meal Prep (precio editable por la admin).
ALTER TABLE servicios_config ADD COLUMN IF NOT EXISTS costo_ingredientes INTEGER NOT NULL DEFAULT 0;
ALTER TABLE servicios_config ADD COLUMN IF NOT EXISTS costo_porcionado   INTEGER NOT NULL DEFAULT 0;
-- Semilla inicial sólo si siguen en 0 (no pisa valores ya ajustados por la admin).
UPDATE servicios_config SET costo_ingredientes = 1000 WHERE servicio = 'meal_prep' AND costo_ingredientes = 0;
UPDATE servicios_config SET costo_porcionado   = 3000 WHERE servicio = 'meal_prep' AND costo_porcionado   = 0;
-- Desglose de adicionales elegidos por el cliente en cada pedido.
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS adicionales JSONB NOT NULL DEFAULT '[]'::jsonb;
-- Foto de la entrega (obligatoria para pasar a "en_delivery"). Guarda la key del bucket.
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS foto_entrega TEXT;
-- Servicio por plato (un plato puede estar en Meal Prep, Cocinera o ambos).
ALTER TABLE platos ADD COLUMN IF NOT EXISTS meal_prep BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE platos ADD COLUMN IF NOT EXISTS cocinera  BOOLEAN NOT NULL DEFAULT true;
-- ¿El plato viene con un acompañamiento que el cliente elige? (los Acompañamientos
-- no cuentan para los 5 platos; son la guarnición de los que la llevan).
ALTER TABLE platos ADD COLUMN IF NOT EXISTS lleva_acompanamiento BOOLEAN NOT NULL DEFAULT false;
-- Cantidades EXACTAS por nº de personas (texto: admite "½", "A gusto", null).
ALTER TABLE ingredientes ADD COLUMN IF NOT EXISTS p1 TEXT;
ALTER TABLE ingredientes ADD COLUMN IF NOT EXISTS p2 TEXT;
ALTER TABLE ingredientes ADD COLUMN IF NOT EXISTS p3 TEXT;
ALTER TABLE ingredientes ADD COLUMN IF NOT EXISTS p4 TEXT;
ALTER TABLE ingredientes ADD COLUMN IF NOT EXISTS p5 TEXT;

-- Cupos: capacidad, confirmados y disponibilidad INDEPENDIENTES por servicio.
ALTER TABLE cupos ADD COLUMN IF NOT EXISTS capacidad_meal_prep   INTEGER;
ALTER TABLE cupos ADD COLUMN IF NOT EXISTS capacidad_cocinera    INTEGER;
ALTER TABLE cupos ADD COLUMN IF NOT EXISTS confirmados_meal_prep INTEGER;
ALTER TABLE cupos ADD COLUMN IF NOT EXISTS confirmados_cocinera  INTEGER;
ALTER TABLE cupos ADD COLUMN IF NOT EXISTS activo_meal_prep      BOOLEAN;
ALTER TABLE cupos ADD COLUMN IF NOT EXISTS activo_cocinera       BOOLEAN;
-- Copia UNA sola vez desde el modelo compartido. Los confirmados por servicio se
-- recalculan desde los pedidos reales (cada pedido ya lleva su servicio).
UPDATE cupos c SET
  capacidad_meal_prep   = COALESCE(c.capacidad_meal_prep,   c.capacidad_maxima),
  capacidad_cocinera    = COALESCE(c.capacidad_cocinera,    c.capacidad_maxima),
  confirmados_meal_prep = COALESCE(c.confirmados_meal_prep,
    (SELECT count(*) FROM pedidos p WHERE p.fecha_entrega = c.fecha AND p.servicio = 'meal_prep')),
  confirmados_cocinera  = COALESCE(c.confirmados_cocinera,
    (SELECT count(*) FROM pedidos p WHERE p.fecha_entrega = c.fecha AND p.servicio = 'cocinera')),
  activo_meal_prep      = COALESCE(c.activo_meal_prep, c.activo),
  activo_cocinera       = COALESCE(c.activo_cocinera,  c.activo)
WHERE c.capacidad_meal_prep IS NULL OR c.capacidad_cocinera IS NULL
   OR c.confirmados_meal_prep IS NULL OR c.confirmados_cocinera IS NULL
   OR c.activo_meal_prep IS NULL OR c.activo_cocinera IS NULL;
`

// Comunas del Gran Santiago (lista inicial de cobertura). El costo de despacho
// por defecto es configurable con COMUNA_COSTO_DEFAULT (la admin lo ajusta luego
// por comuna desde el panel).
const COMUNAS_INICIALES = [
  'Cerrillos', 'Cerro Navia', 'Conchalí', 'El Bosque', 'Estación Central', 'Huechuraba',
  'Independencia', 'La Cisterna', 'La Florida', 'La Granja', 'La Pintana', 'La Reina',
  'Las Condes', 'Lo Barnechea', 'Lo Espejo', 'Lo Prado', 'Macul', 'Maipú', 'Ñuñoa',
  'Pedro Aguirre Cerda', 'Peñalolén', 'Providencia', 'Pudahuel', 'Puente Alto', 'Quilicura',
  'Quinta Normal', 'Recoleta', 'Renca', 'San Joaquín', 'San Miguel', 'San Ramón',
  'Santiago', 'Vitacura',
]

async function seedComunas(client) {
  const { rows } = await client.query('SELECT COUNT(*)::int AS n FROM comunas')
  if (rows[0].n > 0) return // ya hay comunas: no re-sembrar
  const costo = Number(process.env.COMUNA_COSTO_DEFAULT) || 3000
  for (const nombre of COMUNAS_INICIALES) {
    await client.query(
      `INSERT INTO comunas
         (nombre, costo_despacho, activo,
          costo_meal_prep, costo_cocinera, activo_meal_prep, activo_cocinera)
       VALUES ($1, $2, true, $2, $2, true, true)
       ON CONFLICT (nombre) DO NOTHING`,
      [nombre, costo]
    )
  }
  console.log(`[migrate] ${COMUNAS_INICIALES.length} comunas sembradas (costo por defecto: ${costo}).`)
}

async function seedAdmin(client) {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  if (!email || !password) {
    console.log('[migrate] ADMIN_EMAIL/ADMIN_PASSWORD no definidos: se omite el seed de admin.')
    return
  }
  const hash = await bcrypt.hash(password, 10)
  const nombre = process.env.ADMIN_NOMBRE || 'Administradora'
  await client.query(
    `INSERT INTO admin_users (email, password_hash, nombre)
     VALUES ($1, $2, $3)
     ON CONFLICT (email) DO NOTHING`,
    [email.toLowerCase().trim(), hash, nombre]
  )
  console.log(`[migrate] Admin asegurado: ${email}`)
}

export async function runMigrations() {
  const client = await pool.connect()
  try {
    await client.query(SQL)
    // Nuevo estado "en_delivery" (Meal Prep). Va aparte porque ALTER TYPE ...
    // ADD VALUE no puede ejecutarse dentro de la transacción que crea el tipo.
    await client.query("ALTER TYPE estado_pedido ADD VALUE IF NOT EXISTS 'en_delivery'")
    await seedComunas(client)
    await seedAdmin(client)
    console.log('[migrate] Migraciones aplicadas correctamente.')
  } finally {
    client.release()
  }
}

// Permite ejecutar `node src/models/migrations.js` directamente.
const isMain =
  process.argv[1] && process.argv[1].endsWith('migrations.js')
if (isMain) {
  runMigrations()
    .then(() => {
      console.log('[migrate] Listo.')
      return pool.end()
    })
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[migrate] Error:', err)
      process.exit(1)
    })
}

export default runMigrations
