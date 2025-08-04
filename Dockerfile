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

# Copy built app to nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Remove default nginx config and copy ours
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Set proper permissions
RUN chmod -R 755 /usr/share/nginx/html

# Create entrypoint script for Railway
RUN echo '#!/bin/sh' > /entrypoint.sh && \
    echo 'set -e' >> /entrypoint.sh && \
    echo 'export PORT=${PORT:-80}' >> /entrypoint.sh && \
    echo 'echo "Starting nginx on port $PORT"' >> /entrypoint.sh && \
    echo 'sed -i "s/listen 80;/listen $PORT;/g" /etc/nginx/conf.d/default.conf' >> /entrypoint.sh && \
    echo 'echo "Nginx config updated, starting server..."' >> /entrypoint.sh && \
    echo 'exec nginx -g "daemon off;"' >> /entrypoint.sh && \
    chmod +x /entrypoint.sh

# Test nginx config
RUN nginx -t

EXPOSE 80

CMD ["/entrypoint.sh"]