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

# Test nginx config
RUN nginx -t

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]