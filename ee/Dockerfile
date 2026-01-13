# NOTE: This Dockerfile must be built from the project root.
# Use: ./ee/build-docker.sh [image-name]
# Or:  docker build -f ee/Dockerfile -t skald-backend-ee .

# Build stage
FROM node:24-slim AS builder

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy ee package files
COPY ee/package.json ee/pnpm-lock.yaml ./ee/

# Copy backend package files
COPY backend/package.json backend/pnpm-lock.yaml ./backend/

# Install ee dependencies
WORKDIR /app/ee
RUN pnpm install --frozen-lockfile

# Install backend dependencies
WORKDIR /app/backend
RUN pnpm install --frozen-lockfile

# Copy source code
WORKDIR /app
COPY ee/tsconfig.json ./ee/
COPY ee/src ./ee/src
COPY backend/tsconfig.json ./backend/
COPY backend/src ./backend/src

# Build backend first (for migrations and shared code)
WORKDIR /app/backend
RUN pnpm build

# Build ee
WORKDIR /app/ee
RUN pnpm build

# Production stage
FROM node:24-slim

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy ee package files
COPY ee/package.json ee/pnpm-lock.yaml ./ee/

# Copy backend package files
COPY backend/package.json backend/pnpm-lock.yaml ./backend/

# Install only production dependencies for ee
WORKDIR /app/ee
RUN pnpm install --frozen-lockfile --prod

# Install only production dependencies for backend
WORKDIR /app/backend
RUN pnpm install --frozen-lockfile --prod

# Copy built files from builder stage
WORKDIR /app
COPY --from=builder /app/ee/dist ./ee/dist
COPY --from=builder /app/backend/dist ./backend/dist

# Copy mikro-orm config for migrations
COPY backend/src/mikro-orm.config.ts ./backend/src/mikro-orm.config.ts

# Copy startup script
COPY ee/start.sh ./start.sh
RUN chmod +x ./start.sh

WORKDIR /app/ee

EXPOSE 8080

# Run the enterprise server
CMD ["sh", "/app/start.sh"]
