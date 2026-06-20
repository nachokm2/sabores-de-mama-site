# Sabores de Mamá · Backend

API REST en **Node.js + Express + PostgreSQL** para gestionar pedidos, platos,
cupos y administración de Sabores de Mamá.

## Requisitos

- Node.js ≥ 18
- PostgreSQL (local o gestionado: Railway, Neon, Supabase…)

## Puesta en marcha

```bash
cd backend
cp .env.example .env        # completa los valores
npm install
npm run migrate             # crea tablas + admin inicial (idempotente)
npm run seed                # (opcional) carga datos de ejemplo para el panel
npm run dev                 # arranca en http://localhost:4000
```

> `npm run seed` **resetea** las tablas de datos (platos, ingredientes, cupos,
> productos_hornear y pedidos) y carga un set de demo. No toca `admin_users`.
> En producción requiere `FORCE_SEED=true`.

El servidor también ejecuta las migraciones al arrancar si `RUN_MIGRATIONS=true`.

## Variables de entorno

Ver [`.env.example`](./.env.example). Las clave:

- `DATABASE_URL` — conexión a Postgres
- `JWT_SECRET`, `JWT_EXPIRES_IN` — firma de tokens
- `ADMIN_EMAIL`, `ADMIN_PASSWORD` — admin que se seedea en las migraciones
- `SMTP_*`, `MAIL_FROM` — envío de correos (si falta, se omite y se loguea)
- `BANK_*` — datos bancarios incluidos en el correo de "solicitud_recibida"
- `CORS_ORIGIN` — orígenes permitidos (coma-separados, `*` para todos)

## Endpoints

| Método | Ruta                       | Acceso     | Descripción                                  |
|--------|----------------------------|------------|----------------------------------------------|
| POST   | `/api/pedidos`             | Público*   | Crear pedido (reserva cupo + correo)         |
| GET    | `/api/pedidos`             | JWT        | Listar pedidos (filtros: estado, fecha…)     |
| GET    | `/api/pedidos/:id`         | JWT        | Detalle de pedido                            |
| PATCH  | `/api/pedidos/:id/estado`  | JWT        | Cambiar estado (dispara correo)              |
| GET    | `/api/platos`              | Público    | Platos activos + ingredientes                |
| POST   | `/api/platos`              | JWT        | Crear plato (+ ingredientes)                 |
| PUT    | `/api/platos/:id`          | JWT        | Editar plato (+ ingredientes)                |
| DELETE | `/api/platos/:id`          | JWT        | Soft-delete (activo = false)                 |
| GET    | `/api/cupos`               | Público    | Fechas futuras con cupos disponibles         |
| POST   | `/api/cupos`               | JWT        | Crear/editar cupo (upsert por fecha)         |
| POST   | `/api/auth/login`          | Público    | Login admin → JWT                            |
| POST   | `/api/correos/pedido/:id`  | JWT        | Reenviar correo de un pedido                 |
| GET    | `/api/health`              | Público    | Health check (Railway)                       |

\* Las rutas de pedidos están limitadas a **10 req/min por IP**.

## Reglas de negocio

1. **Reserva de cupo con lock optimista**: al crear un pedido se hace un
   `UPDATE` condicional atómico sobre `cupos` (`pedidos_confirmados < capacidad_maxima`).
   Ante dos pedidos simultáneos por el último cupo, sólo uno queda confirmado.
2. **Correos automáticos por estado**: `solicitud_recibida` (resumen + datos
   bancarios), `pagado` (confirmación + lista de ingredientes), `en_preparacion`,
   `entregado` (agradecimiento).
3. **`GET /api/cupos`** sólo devuelve fechas activas, a futuro y con cupos libres.

## Deploy en Railway

1. Crea un servicio desde el repo apuntando a `/backend` (o usa el `Dockerfile`).
2. Añade el plugin de **PostgreSQL** → expone `DATABASE_URL`.
3. Configura las variables de entorno (`JWT_SECRET`, `ADMIN_*`, `SMTP_*`, `CORS_ORIGIN`, `PGSSL=true`).
4. Railway usa el `Dockerfile`; el health check es `GET /api/health`.
