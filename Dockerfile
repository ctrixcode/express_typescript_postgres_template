# Stage 1: Base image
FROM node:20-slim AS base
WORKDIR /app

# Stage 2: Development (used for local docker compose development)
FROM base AS development
COPY package*.json ./
RUN npm install
COPY . .
ARG PORT=4000
EXPOSE ${PORT}
CMD ["npm", "run", "dev"]

# Stage 3: Builder (compile TypeScript)
FROM base AS builder
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 4: Production (minimal footprint, non-root user)
FROM base AS production
ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled JavaScript output
COPY --chown=node:node --from=builder /app/dist ./dist

# Create logs directory owned by node user
RUN mkdir -p logs && chown -R node:node /app

# Run as non-root user (CIS Docker Benchmark & SOC 2)
USER node

ARG PORT=4000
EXPOSE ${PORT}

CMD ["node", "dist/server.js"]
