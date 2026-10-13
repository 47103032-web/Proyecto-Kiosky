# Imagen de produccion de la API de Kiosky.
# Solo lleva las dependencias de ejecucion: las pruebas corren en CI,
# no dentro del contenedor.
FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY src ./src

# No correr como root dentro del contenedor.
USER node

ENV NODE_ENV=production
EXPOSE 4000

CMD ["node", "src/server.js"]
