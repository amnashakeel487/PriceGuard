# --- Build Stage ---
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy sources and compile
COPY . .
RUN npm run build

# --- Serve Stage ---
FROM nginx:stable-alpine

# Copy built assets from build container
COPY --from=build /app/dist /usr/share/nginx/html

# Copy Custom Nginx configuration to support React SPA client-side routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
