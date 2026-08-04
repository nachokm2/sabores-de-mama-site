import pg from 'pg'

// Crea la base de datos de test (idempotente) antes de correr la suite.
// Requiere un Postgres accesible (en dev: contenedor Docker en localhost:5433).
export async function setup() {
  // Mismo orden de resolución que el `test.env` de vitest.config.js: el CI provee
  // TEST_DATABASE_URL (Postgres del runner en :5432); globalSetup corre en el
  // proceso raíz y NO recibe el `test.env`, así que debe leerla directamente.
  // Antes solo miraba DATABASE_URL (ausente en CI) y caía al :5433 local → fallaba.
  const url =
    process.env.TEST_DATABASE_URL ||
    process.env.DATABASE_URL ||
    'postgresql://sdm:sdm_dev@localhost:5433/sabores_test'
  const u = new URL(url)
  const dbName = u.pathname.slice(1)

  // Nombre controlado (no parametrizable en CREATE DATABASE).
  if (!/^[a-z0-9_]+$/i.test(dbName)) {
    throw new Error(`Nombre de BD de test inválido: ${dbName}`)
  }

  // Conectar a la BD "postgres" del mismo servidor para poder crear la de test.
  u.pathname = '/postgres'
  const client = new pg.Client({ connectionString: u.toString(), ssl: false })
  try {
    await client.connect()
  } catch (err) {
    throw new Error(
      `No se pudo conectar a Postgres para crear la BD de test (${u.host}). ` +
        `¿Está corriendo el contenedor? Detalle: ${err.message}`
    )
  }
  const exists = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName])
  if (!exists.rows.length) {
    await client.query(`CREATE DATABASE ${dbName}`)
    console.log(`[test] Base de datos de test creada: ${dbName}`)
  }
  await client.end()
}
