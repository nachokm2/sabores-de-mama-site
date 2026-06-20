# ─── Sabores de Mamá · Backend · Dockerfile (deploy en Railway) ───
FROM node:20-alpine

# Directorio de trabajo
WORKDIR /app

# Instalar dependencias primero (mejor cacheo de capas)
COPY package*.json ./
RUN npm ci --omit=dev

# Copiar el resto del código
COPY . .

# Railway inyecta PORT; por defecto 4000
ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

# Arranque (ejecuta migraciones idempotentes si RUN_MIGRATIONS=true)
CMD ["node", "src/server.js"]
