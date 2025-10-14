# Dockerfile for the memo-processing server
FROM node:24-slim

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code and config
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN pnpm build

# Expose any ports if needed (currently none for this service)

# Run the server
CMD ["pnpm", "start"]

