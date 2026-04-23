### Dependencies layer (better cache reuse in Dokploy builds)
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Permite inyectar VITE_API_URL (u otras env) desde Dokploy durante el build
ARG VITE_BUILD_MODE=production
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build -- --mode ${VITE_BUILD_MODE}

# ---------- Runtime ----------
FROM nginx:1.27-alpine AS production
ENV API_PROXY_URL=http://host.docker.internal:5000

# Copiar build de React
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/templates/default.conf.template

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
