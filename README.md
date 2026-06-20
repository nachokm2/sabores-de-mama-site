# Sabores de Mamá 🍲

[![CI](https://github.com/nachokm2/sabores-de-mama-site/actions/workflows/ci.yml/badge.svg)](https://github.com/nachokm2/sabores-de-mama-site/actions/workflows/ci.yml)

Comida casera chilena a domicilio. Sitio público + flujos de pedido (Meal Prep y
Cocinera a Domicilio) con panel de administración, sobre un backend Express/PostgreSQL.

## Stack

- **Frontend:** React 18 · Vite 5 · Tailwind CSS 3 · React Router 6 · Framer Motion / GSAP
- **Backend:** Express 4 (ESM) · PostgreSQL (`pg`) · JWT · Nodemailer
- **Tests:** Vitest + React Testing Library (frontend) · Vitest + Supertest (backend) · Playwright (E2E)

## Estructura

```
.
├── src/                 # Frontend (páginas, secciones, flujos de pedido, UI)
├── backend/             # API Express + PostgreSQL + panel admin
├── e2e/                 # Tests end-to-end (Playwright)
├── DEPLOY.md            # Checklist de despliegue a Railway
└── .github/workflows/   # CI (lint + unit + backend + e2e)
```

## Desarrollo local

**Requisitos:** Node 20+ y Docker (para Postgres).

```bash
# 1) Postgres de desarrollo (puerto 5433 para no chocar con un Postgres local)
docker run -d --name sdm-postgres -p 5433:5432 \
  -e POSTGRES_USER=sdm -e POSTGRES_PASSWORD=sdm_dev -e POSTGRES_DB=sabores_de_mama postgres:16-alpine

# 2) Backend
cd backend
cp .env.example .env        # ajusta credenciales si hace falta
npm install
npm run seed:menu           # carga platos + ingredientes
npm run dev                 # API en http://localhost:4000

# 3) Frontend (en otra terminal, desde la raíz)
npm install
npm run dev                 # sitio en http://localhost:5173
```

Las variables `VITE_*` (incl. `VITE_API_URL`) van en un `.env.local` en la raíz.

## Tests y calidad

```bash
npm run lint        # ESLint (frontend + backend + e2e)
npm test            # tests unitarios del frontend (Vitest + RTL)
cd backend && npm test   # tests del backend (requiere Postgres)
npm run e2e         # E2E (Playwright) contra el stack local
```

La **CI** (GitHub Actions) corre los cuatro en cada push y PR, levantando Postgres
para los jobs de backend y E2E. Ver [.github/workflows/ci.yml](.github/workflows/ci.yml).

## Despliegue

Pasos, variables de entorno y verificación post-deploy en **[DEPLOY.md](DEPLOY.md)**
(Railway: backend + Postgres, luego frontend).
