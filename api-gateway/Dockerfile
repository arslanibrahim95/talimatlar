FROM denoland/deno:1.40.0

# Set working directory
WORKDIR /app

# Copy dependency files
COPY deno.json .
COPY main.ts .

# Copy source files
COPY src/ ./src/

# Cache dependencies
RUN deno cache main.ts

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/gateway/health || exit 1

# Run the application
CMD ["deno", "run", "--allow-net", "--allow-env", "--allow-read", "--allow-write", "main.ts"]
