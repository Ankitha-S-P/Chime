# Stage 1 — Build the React app
FROM node:20-alpine AS build
WORKDIR /app
COPY client/package*.json ./
RUN npm ci
COPY client/ .
# VITE_API_URL is empty so all requests go through Nginx on the same host
ENV VITE_API_URL=""
RUN npm run build

# Stage 2 — Serve with Nginx + act as reverse proxy to backend
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
