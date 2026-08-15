# ─── Sabores de Mamá · Backend · Dockerfile (deploy en Railway) ───
# Node 22 LTS: Node 20 salió de soporte (EOL 2026-04-30) y dejó de recibir
# parches de seguridad del runtime. El AWS SDK v3 también exige >=22 desde 2027.
FROM node:22-alpine

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

# Sin privilegios: la imagen de Node ya trae el usuario `node`, pero si no se
# declara, el proceso corre como root y cualquier ejecución de código dentro del
# contenedor queda con uid 0. El puerto es > 1024, así que no hace falta root.
# Va DESPUÉS del npm ci (que sí necesita escribir node_modules) y del COPY.
USER node

# Arranque (ejecuta migraciones idempotentes si RUN_MIGRATIONS=true)
CMD ["node", "src/server.js"]
