# Production Multi-Stage Dockerfile for Artisan Escrow Backend
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Compile Smart Contracts
COPY contracts ./contracts/
COPY scripts/compile-contract.js ./scripts/
RUN node scripts/compile-contract.js

# Production Stage
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Copy application files
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./
COPY src ./src
COPY contracts ./contracts
COPY scripts ./scripts

# Expose backend port
EXPOSE 5050

# Start server
CMD ["node", "src/server.js"]
