FROM denoland/deno:1.35-alpine

# Set working directory
WORKDIR /app

# Copy deno configuration
COPY deno.json deno.jsonc ./

# Cache dependencies
RUN deno cache main.ts

# Copy source code
COPY . .

# Compile the application
RUN deno compile --allow-net --allow-env --allow-read --output claude-auth main.ts

# Create non-root user
RUN addgroup -g 1001 -S deno && \
    adduser -S deno -u 1001

# Change ownership of the app directory
RUN chown -R deno:deno /app

# Switch to non-root user
USER deno

# Expose port
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD deno run --allow-net https://deno.land/x/healthcheck@v1.0.0/healthcheck.ts http://localhost:8001/health

# Run the application
CMD ["./claude-auth"]
