# ==============================================================================
# Discrete Dockerfile: Tharior Remedai Web Desk UI
# Multi-stage build: Node.js 20 build -> Nginx Alpine runtime
# ==============================================================================

# Stage 1: Build Web App
FROM node:20-slim AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./
RUN npm install

# Copy source code and build production bundle
COPY . .
RUN npm run build

# Stage 2: Production Nginx Serving
FROM nginx:alpine-slim

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled SPA static bundle from builder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
