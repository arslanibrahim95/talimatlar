FROM denoland/deno:1.40.0

WORKDIR /app

# Copy dependencies
COPY deno.json deno.lock ./

# Copy source code
COPY . .

# Cache dependencies
RUN deno cache main.ts

# Expose port
EXPOSE 8008

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD deno eval "fetch('http://localhost:8008/health').then(r => r.ok).catch(() => false)"

# Run the application
CMD ["deno", "run", "--allow-net", "--allow-env", "--allow-read", "--allow-write", "main.ts"]
