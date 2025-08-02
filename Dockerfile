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
    echo 'echo "Starting nginx on port 80..."' >> /start.sh && \
    echo 'nginx -g "daemon off;" &' >> /start.sh && \
    echo 'NGINX_PID=$!' >> /start.sh && \
    echo 'echo "Nginx started with PID: $NGINX_PID"' >> /start.sh && \
    echo 'sleep 2' >> /start.sh && \
    echo 'echo "Testing health check..."' >> /start.sh && \
    echo 'curl -f http://localhost/health || echo "Health check failed"' >> /start.sh && \
    echo 'wait $NGINX_PID' >> /start.sh && \
    chmod +x /start.sh

EXPOSE 80

CMD ["/start.sh"]