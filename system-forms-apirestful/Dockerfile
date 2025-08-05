# Construcción y producción: usar una imagen con herramientas de build
FROM node:20-alpine

WORKDIR /app

# Copiar package.json
COPY package*.json ./

# Instalar TODO (incluyendo devDependencies para poder hacer build)
RUN npm install

# Copiar código
COPY . .

# Hacer build
RUN npm run build

# Exponer puerto
EXPOSE 3000

# Ejecutar
CMD ["node", "dist/main"]