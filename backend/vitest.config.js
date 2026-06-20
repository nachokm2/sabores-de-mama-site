import { defineConfig } from 'vitest/config'

// Tests del backend (Node).
// - Los tests unitarios (mailService) mockean BD y Nodemailer.
// - Los tests de integración usan una BD de test real (sabores_test) en el
//   Postgres de Docker (localhost:5433). globalSetup la crea si no existe.
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/tests/**/*.{test,spec}.js'],
    globalSetup: ['./src/tests/globalSetup.js'],
    // Sin paralelismo entre archivos: comparten la BD de test y el limiter.
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      // Local (Docker en :5433) por defecto; CI lo sobreescribe con TEST_DATABASE_URL.
      DATABASE_URL: process.env.TEST_DATABASE_URL || 'postgresql://sdm:sdm_dev@localhost:5433/sabores_test',
      PGSSL: 'false',
      RUN_MIGRATIONS: 'false',
      JWT_SECRET: 'test_secret_para_vitest',
      JWT_EXPIRES_IN: '1h',
      // El test del rate limiter espera el límite por defecto (10).
      PEDIDOS_RATE_LIMIT: '10',
      ADMIN_EMAIL: 'admin@test.com',
      ADMIN_PASSWORD: 'test1234',
      ADMIN_NOMBRE: 'Admin Test',
      // SMTP vacío → los correos se omiten (además se mockean en integración).
      SMTP_HOST: '',
      SMTP_USER: '',
      SMTP_PASS: '',
    },
  },
})
