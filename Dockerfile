# Builder stage: install all dependencies and build the API
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Runtime stage: lean image with production-only dependencies
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install only production dependencies for the API runtime
COPY package*.json ./
RUN npm ci --omit=dev

# Bring built assets into the runtime image
COPY --from=builder /app/dist ./dist

# Start the API service
CMD ["npm", "start"]
