# =============================================================================
# OPTIMIZED MULTI-STAGE DOCKERFILE FOR FRONTEND
# =============================================================================

# Base stage with common dependencies
FROM node:20-alpine AS base
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    curl \
    dumb-init \
    && rm -rf /var/cache/apk/*

# Dependencies stage
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production --frozen-lockfile \
    && npm cache clean --force \
    && rm -rf /tmp/*

# Build stage
FROM base AS builder
COPY package*.json ./
RUN npm ci --frozen-lockfile

COPY . .
RUN npm run build --no-type-check || npm run build --skip-type-check || npm run build \
    && rm -rf node_modules \
    && rm -rf src \
    && rm -rf public \
    && rm -rf .git

# Production stage
FROM nginx:1.25-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache \
    curl \
    dumb-init \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S nginx-user && \
    adduser -S nginx-user -u 1001 -G nginx-user

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy startup script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Set proper permissions
RUN chown -R nginx-user:nginx-user /usr/share/nginx/html \
    && chown -R nginx-user:nginx-user /var/cache/nginx \
    && chown -R nginx-user:nginx-user /var/log/nginx \
    && chown -R nginx-user:nginx-user /etc/nginx/conf.d

# Security: Remove unnecessary packages
RUN rm -rf /var/cache/apk/* /tmp/* /var/tmp/*

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:80/health || exit 1

# Expose port
EXPOSE 80

# Use non-root user
USER nginx-user

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["/docker-entrypoint.sh"]
