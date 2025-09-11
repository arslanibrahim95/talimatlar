# =============================================================================
# OPTIMIZED DOCKERFILE FOR AI SERVICE
# =============================================================================

# Multi-stage build for Python optimization
FROM python:3.12-slim AS base

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Dependencies stage
FROM base AS deps
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt* ./
RUN pip install --no-cache-dir -r requirements.txt || \
    pip install --no-cache-dir fastapi uvicorn requests python-multipart

# Production stage
FROM base AS production
WORKDIR /app

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Copy dependencies from deps stage
COPY --from=deps /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=deps /usr/local/bin /usr/local/bin

# Copy application code
COPY . .

# Set proper permissions
RUN chown -R appuser:appuser /app

# Security: Remove unnecessary packages and files
RUN apt-get autoremove -y && apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8006/health || exit 1

# Expose port
EXPOSE 8006

# Use non-root user
USER appuser

# Run the application
CMD ["python", "main.py"]
