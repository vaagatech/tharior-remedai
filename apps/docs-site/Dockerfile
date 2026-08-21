# ==============================================================================
# Discrete Dockerfile: Tharior Remedai Documentation Site
# Standalone Nginx Alpine static server
# ==============================================================================
FROM nginx:alpine-slim

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy documentation static assets
COPY . /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
