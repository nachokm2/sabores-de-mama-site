# Despliegue a producción (Railway) — Checklist

Estado del proyecto verificado localmente antes de desplegar:

| Verificación | Resultado |
|---|---|
| Tests unitarios/integración frontend (`npm test`) | ✅ 103 |
| Tests backend (`cd backend && npm test`) | ✅ 20 |
| E2E (`npm run e2e`) | ✅ 10 |
| Build de producción (`npm run build`) | ✅ sin errores (chunk principal ~154 kB; rutas con code-splitting) |
| Audit de seguridad (ver más abajo) | ✅ |

> ⚠️ El deploy real a Railway requiere tus credenciales/proyecto y es una acción
> hacia afuera: **debes ejecutarlo tú** (o darme acceso). Abajo están los pasos exactos.

---

## 1. Variables de entorno

### Backend (servicio API)
| Variable | Notas |
|---|---|
| `DATABASE_URL` | La provee el plugin de PostgreSQL de Railway (automática) |
| `PGSSL` | `true` (Railway/Neon requieren SSL) |
| `NODE_ENV` | `production` |
| `RUN_MIGRATIONS` | `true` (migra al arrancar; idempotente) |
| `JWT_SECRET` | **secreto largo y aleatorio** |
| `JWT_EXPIRES_IN` | `8h` (opcional; default 8h) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NOMBRE` | admin inicial (se seedea en migraciones) |
| `CORS_ORIGIN` | **dominio del frontend** (p. ej. `https://saboresdemama.com`). Si falta, cae a `CLIENT_URL`. En producción evita `*`. |
| `CLIENT_URL` | URL pública del frontend (para enlaces de correo y fallback de CORS) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | envío de correos (si falta, se omite) |
| `BANCO_NOMBRE`, `BANCO_CUENTA`, `BANCO_TIPO`, `BANCO_RUT`, `BANCO_EMAIL`, `BANCO_BANCO` | datos bancarios del correo. (También se aceptan `BANK_TITULAR/BANK_NUMERO/BANK_TIPO_CUENTA/BANK_RUT/BANK_EMAIL/BANK_BANCO`.) |

### Frontend (build estático)
| Variable | Notas |
|---|---|
| `VITE_API_URL` | URL del backend + `/api` (p. ej. `https://api.saboresdemama.com/api`) |
| `VITE_DELIVERY_COST` | costo de despacho (p. ej. `5000`) |
| `VITE_MEAL_PREP_BASE` | precio base Meal Prep (default 60000) |
| `VITE_COCINERA_BASE` | precio base Cocinera (default 55000) |
| `VITE_BANK_TITULAR`, `VITE_BANK_BANCO`, `VITE_BANK_TIPO_CUENTA`, `VITE_BANK_NUMERO`, `VITE_BANK_RUT`, `VITE_BANK_EMAIL` | datos bancarios mostrados en la página de pago |

> Las `VITE_*` se incrustan en el build, así que deben estar definidas **antes** de `npm run build`.

---

## 2. Pasos de despliegue

1. **Backend primero**
   - Servicio desde el repo apuntando a `/backend` (usa el `Dockerfile`).
   - Agrega el plugin **PostgreSQL** → expone `DATABASE_URL`.
   - Configura las variables de entorno del backend (tabla de arriba).
   - Deploy. Healthcheck: **`GET /api/health` → 200** (`{"status":"ok","db":true}`).
   ```bash
   curl https://<backend-railway-url>/api/health
   ```
   - (Opcional) cargar el menú: `npm run seed:menu` desde una shell del servicio.

2. **Frontend después**
   - Servicio del repo (raíz). Build: `npm run build`, output `dist/`.
   - Configura `VITE_API_URL` apuntando al backend desplegado (con `/api`).
   - Verifica en el sitio que las llamadas a `${VITE_API_URL}` resuelven (Network 200).

3. **Verificación final (E2E contra producción)**
   ```bash
   E2E_BASE_URL=https://<frontend-url> \
   E2E_API_URL=https://<backend-url>/api \
   E2E_ADMIN_EMAIL=<admin> E2E_ADMIN_PASSWORD=<pass> \
   npm run e2e
   ```
   > Nota: los E2E crean pedidos/cupos reales vía la API. Úsalos contra **staging**,
   > no contra datos productivos sensibles.

---

## 3. Audit de seguridad (resultado)

- ✅ **Rutas de escritura `/api/` requieren JWT** (verificado con curl):
  `PATCH /pedidos/:id/estado`, `POST/PUT/DELETE /platos`, `POST /cupos`,
  `POST /productos-hornear`, `POST /correos/*`, `GET /pedidos` → **401** sin token.
- ✅ **Públicos** (sin token): `POST /api/pedidos`, `GET /api/platos`, `GET /api/cupos`.
- ✅ **Rutas `/admin/*` del frontend** están protegidas por `PrivateRoute` (redirige a
  `/admin/login` sin JWT válido); los datos que muestran provienen de endpoints con JWT.
- ✅ **JWT con expiración** configurada (`JWT_EXPIRES_IN`, default `8h`).
- ✅ **CORS** restringido por `CORS_ORIGIN` (fallback a `CLIENT_URL`); advierte si `*` en producción.
- ✅ **Sin credenciales productivas en el código** (grep): los únicos literales son
  fixtures de test (admin de test y BD de test local), no secretos de producción.

---

## 4. Performance

- **Hechas (código):** code-splitting por ruta (chunk principal 268 kB → **154 kB**),
  imágenes con `loading="lazy"` (hero con `fetchpriority="high"`), fuentes con carga
  **no bloqueante** (`preload` + `display=swap`).
- **Medición:** ejecuta Lighthouse contra la **URL de staging** (no en local; en una
  máquina cargada el resultado no es representativo):
  ```bash
  npx lighthouse https://<staging-url> --only-categories=performance --output=json
  ```
  Objetivo: Performance ≥ 80, LCP < 3 s.
- **Si LCP sigue alto:** el titular del Hero se revela con una animación JS (GSAP). Para
  LCP < 3 s conviene pintar el titular antes de la animación y/o servir el hero en WebP/AVIF.
