# Build stage
FROM node:20-alpine AS builder

# Accept build args
ARG VITE_API_HOST
ARG VITE_IS_SELF_HOSTED_DEPLOY

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY frontend ./frontend
COPY vite.config.ts ./
COPY tsconfig.json ./
COPY tsconfig.app.json ./
COPY tsconfig.node.json ./
COPY components.json ./

# Build the frontend
# If VITE_API_HOST is set (production), use it; otherwise defaults to http://localhost:8000 (local dev)
RUN pnpm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /app/frontend/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80