# Multi-stage build for optimal image size
FROM node:22-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Install necessary build tools for native dependencies
RUN apk add --no-cache libc6-compat python3 make g++

FROM base AS builder

WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml turbo.json ./

# Copy all workspace packages
COPY packages ./packages
COPY apps/api ./apps/api

# Disable Husky hooks in Docker
ENV HUSKY=0

# Install dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma and ZenStack client only (skip schema generation that requires DB connection)
# Note: We skip 'pnpm generate' because it tries to bootstrap NestJS and connect to DB
# Instead, we only generate the Prisma client and let the app generate schema at runtime
RUN pnpm --filter @nexly/db prisma:generate

# Build the API
RUN pnpm --filter api build

# Production stage
FROM node:22-alpine AS runner

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Copy necessary files for production
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./

# Copy packages (db with generated Prisma client)
COPY --from=builder /app/packages/db ./packages/db

# Copy API package
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/graphql ./apps/api/graphql

# Disable Husky hooks in Docker
ENV HUSKY=0

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Generate ZenStack enhance function (creates files in node_modules/.zenstack)
# zenstack is now a production dependency, so it's available here
RUN pnpm --filter @nexly/db prisma:generate

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs && \
    chown -R nestjs:nodejs /app

USER nestjs

# Set environment to production
ENV NODE_ENV=production

EXPOSE 3001

# Start the application
# NestJS builds to dist/src/main.js (not dist/main.js)
CMD ["node", "apps/api/dist/src/main.js"]



