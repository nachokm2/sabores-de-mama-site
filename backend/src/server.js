import dotenv from 'dotenv'
import app from './app.js'
import { pool } from './models/index.js'
import { runMigrations } from './models/migrations.js'

dotenv.config()

const PORT = process.env.PORT || 4000

async function start() {
  // Guardia de secretos (C2): en producción NO arrancar con un JWT_SECRET
  // ausente, corto o de ejemplo. Falla cerrado para evitar tokens forjables.
  const jwtSecret = process.env.JWT_SECRET || ''
  if (
    process.env.NODE_ENV === 'production' &&
    (jwtSecret.length < 32 || /dev_secret|cambiar|1234567890|secret_para/i.test(jwtSecret))
  ) {
    console.error(
      '[server] JWT_SECRET ausente/débil/por defecto en producción. ' +
        'Configura un secreto aleatorio de ≥32 bytes en Railway. Abortando.'
    )
    process.exit(1)
  }

  // Migraciones idempotentes al arrancar (configurable con RUN_MIGRATIONS).
  if (process.env.RUN_MIGRATIONS !== 'false') {
    try {
      await runMigrations()
    } catch (err) {
      // No abortamos el arranque: el health check reportará db:false y los logs
      // mostrarán el problema (útil mientras se aprovisiona la BD en Railway).
      console.error('[server] Falló la migración inicial:', err.message)
    }
  }

  const server = app.listen(PORT, () => {
    console.log(`[server] Sabores de Mamá API escuchando en el puerto ${PORT}`)
  })

  // Cierre ordenado.
  const shutdown = (signal) => {
    console.log(`[server] ${signal} recibido. Cerrando...`)
    server.close(async () => {
      await pool.end().catch(() => {})
      process.exit(0)
    })
    // Forzar salida si no cierra en 10s.
    setTimeout(() => process.exit(1), 10_000).unref()
  }
  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}

start()
