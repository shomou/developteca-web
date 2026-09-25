# ============================================================
# Etapa 1: compilación
# Node y los ~322MB de node_modules viven solo aquí.
# ============================================================
FROM node:24-alpine AS build

WORKDIR /build

# Igual que con el pom del backend: instalar dependencias en su propia capa para
# que Docker la reutilice mientras package-lock.json no cambie.
# npm ci (no npm install) instala exactamente lo del lock: builds reproducibles.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ============================================================
# Etapa 2: servir
# Angular compila a HTML/CSS/JS estáticos: no hace falta Node en ejecución,
# solo un servidor web. La imagen final pesa ~50MB en vez de ~400MB.
# ============================================================
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /build/dist/developteca-web/browser /usr/share/nginx/html

EXPOSE 80

# La imagen de nginx ya trae su propio CMD; no hace falta declararlo.
