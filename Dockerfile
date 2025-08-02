# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Install curl for debugging
RUN apk add --no-cache curl

# Remove default nginx config
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy built app to nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Set proper permissions and create directories
RUN chmod -R 755 /usr/share/nginx/html && \
    mkdir -p /var/log/nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx /var/cache/nginx /usr/share/nginx/html

# Test nginx config
RUN nginx -t

# Create startup script
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'echo "=== Railway Nginx Startup ==="' >> /start.sh && \
    echo 'echo "Port: 80"' >> /start.sh && \
    echo 'echo "Health check: GET /"' >> /start.sh && \
    echo 'echo "Starting nginx..."' >> /start.sh && \
    echo 'nginx -g "daemon off;" &' >> /start.sh && \
    echo 'NGINX_PID=$!' >> /start.sh && \
    echo 'echo "Nginx PID: $NGINX_PID"' >> /start.sh && \
    echo 'sleep 5' >> /start.sh && \
    echo 'echo "Testing internal health check..."' >> /start.sh && \
    echo 'curl -v http://localhost/ || echo "Internal health check failed"' >> /start.sh && \
    echo 'echo "=== Ready for Railway health checks ==="' >> /start.sh && \
    echo 'wait $NGINX_PID' >> /start.sh && \
    chmod +x /start.sh

EXPOSE 80

CMD ["/start.sh"]