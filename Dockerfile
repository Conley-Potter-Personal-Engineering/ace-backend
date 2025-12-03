# ---- Builder stage ----
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy full project
COPY . .

# Build Next.js and compile custom server
RUN npm run build

# ---- Runtime stage ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy necessary runtime files
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/dist ./dist

# Note: skip /public since this repo has none

# Expose API port
EXPOSE 3000

# Healthcheck for Railway CI smoke test
HEALTHCHECK --interval=30s --timeout=5s \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

# Entrypoint (Next.js custom server)
CMD ["node", "dist/server.cjs"]
