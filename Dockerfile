# Stage 1: Build
FROM node:20-slim AS builder

WORKDIR /app

# Install build tools for node-pty
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY server/package.json server/
COPY client/package.json client/

# Install dependencies
RUN npm ci

# Copy source
COPY shared/ shared/
COPY server/ server/
COPY client/ client/

# Build
RUN npm run build -w shared
RUN npm run build -w server
RUN cd client && npx vite build

# Stage 2: Production
FROM node:20-slim

WORKDIR /app

# Install runtime dependencies for node-pty
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    && rm -rf /var/lib/apt/lists/*

# Copy package files and install production deps only
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY server/package.json server/
COPY client/package.json client/
RUN npm ci --omit=dev

# Copy built files
COPY --from=builder /app/shared/dist shared/dist
COPY --from=builder /app/server/dist server/dist
COPY --from=builder /app/client/dist client/dist

# Copy config files
COPY .env.example .env.example
COPY server/vitest.config.ts server/

# Create data directories
RUN mkdir -p data uploads certs

# Environment
ENV NODE_ENV=production
ENV PORT=3443

EXPOSE 3443

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3443/api/health || exit 1

CMD ["node", "server/dist/index.js"]
