import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

// SSL: requerido por la mayoría de proveedores gestionados (Railway, Neon…).
// Se activa con PGSSL=true o automáticamente en producción.
const useSSL =
  process.env.PGSSL === 'true' || process.env.NODE_ENV === 'production'

if (!process.env.DATABASE_URL) {
  console.warn(
    '[db] ADVERTENCIA: DATABASE_URL no está definida. Configúrala en .env'
  )
}

// B4 de la auditoría: en producción se avisa si el certificado de la BD no se
// valida. NO se cambia el valor por defecto: activarlo a ciegas puede dejar la
// aplicación sin base de datos si el proveedor usa un certificado interno, y eso
// es un riesgo mucho mayor que el que cierra. El aviso deja el pendiente a la
// vista para probarlo de forma controlada (definir DB_SSL_STRICT=true y verificar
// que /api/health siga con db:true).
if (useSSL && process.env.DB_SSL_STRICT !== 'true' && process.env.NODE_ENV === 'production') {
  console.warn(
    '[db] TLS activo pero SIN validar el certificado (DB_SSL_STRICT no está en true). ' +
      'Mitigado por la red privada de Railway; para cerrarlo, probar DB_SSL_STRICT=true.'
  )
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Validación del certificado TLS: opt-in con DB_SSL_STRICT=true (requiere que
  // el proveedor use un certificado verificable / CA válida). Por defecto false
  // para no romper la conexión con el certificado interno de Railway. Nota: la
  // conexión de producción es por la red PRIVADA de Railway
  // (postgres.railway.internal), lo que ya reduce el riesgo de MITM.
  ssl: useSSL ? { rejectUnauthorized: process.env.DB_SSL_STRICT === 'true' } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  // Backstop: PostgreSQL aborta en el servidor cualquier query que supere 15s,
  // para no retener indefinidamente una de las 10 conexiones del pool. 15s es
  // holgado (las queries normales tardan <100ms; la migración inicial, <1s).
  statement_timeout: 15000,
  query_timeout: 20000,
})

pool.on('error', (err) => {
  console.error('[db] Error inesperado en cliente inactivo del pool:', err)
})

/**
 * Ejecuta una query usando el pool.
 * @param {string} text  SQL con placeholders $1, $2…
 * @param {Array}  params
 */
export function query(text, params) {
  return pool.query(text, params)
}

/**
 * Obtiene un cliente dedicado del pool (para transacciones BEGIN/COMMIT).
 * Recuerda llamar a client.release() al terminar.
 */
export function getClient() {
  return pool.connect()
}

/**
 * Helper de transacción: ejecuta `fn(client)` dentro de BEGIN/COMMIT,
 * haciendo ROLLBACK automático si algo lanza.
 */
export async function withTransaction(fn) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export default { pool, query, getClient, withTransaction }
