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
-- Disponibilidad de cada comuna por servicio (para tablas ya existentes).
ALTER TABLE comunas ADD COLUMN IF NOT EXISTS meal_prep BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE comunas ADD COLUMN IF NOT EXISTS cocinera  BOOLEAN NOT NULL DEFAULT true;
-- Productos para hornear: foto, formato/cantidad y porciones (para tablas existentes).
ALTER TABLE productos_hornear ADD COLUMN IF NOT EXISTS imagen    TEXT;
ALTER TABLE productos_hornear ADD COLUMN IF NOT EXISTS formato   VARCHAR(120);
ALTER TABLE productos_hornear ADD COLUMN IF NOT EXISTS porciones VARCHAR(80);
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
      `INSERT INTO comunas (nombre, costo_despacho, activo) VALUES ($1, $2, true)
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
