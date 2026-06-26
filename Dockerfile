# ============================================
# Stage 1: Build frontend
# ============================================
FROM node:22-alpine AS frontend-builder
WORKDIR /app/client

COPY client/package.json client/package-lock.json* ./
RUN npm ci
COPY client/ ./
RUN npm run build

# ============================================
# Stage 2: Production image
# ============================================
FROM node:22-alpine

RUN apk add --no-cache dumb-init
WORKDIR /app

# Copy server source
COPY server/ ./

# Install production deps (tsx included in dependencies)
RUN npm ci --omit=dev

# Copy built frontend to a known location
COPY --from=frontend-builder /app/client/dist ./client-dist

# Data directory
RUN mkdir -p /data
VOLUME /data

# Environment defaults
ENV NODE_ENV=production
ENV PORT=3001
ENV DB_PATH=/data/wg-agent.db
ENV CLIENT_DIST=/app/client-dist
ENV ADMIN_PASSWORD=wgagent123
ENV JWT_SECRET=change-me-to-random-string

EXPOSE 3001

CMD ["dumb-init", "npx", "tsx", "src/index.ts"]
