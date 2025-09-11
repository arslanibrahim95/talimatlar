#!/bin/sh

# Docker entrypoint script for production deployment

set -e

echo "🚀 Starting Claude Talimat Frontend..."

# Check if we're in production mode
if [ "$NODE_ENV" = "production" ]; then
    echo "📦 Production mode detected"
    
    # Validate required environment variables
    if [ -z "$API_BASE_URL" ]; then
        echo "⚠️  Warning: API_BASE_URL not set, using default"
        export API_BASE_URL="http://localhost:8000"
    fi
    
    # Generate runtime configuration
    echo "🔧 Generating runtime configuration..."
    cat > /usr/share/nginx/html/config.js << EOF
window.APP_CONFIG = {
    API_BASE_URL: '$API_BASE_URL',
    NODE_ENV: '$NODE_ENV',
    VERSION: '$APP_VERSION',
    BUILD_TIME: '$(date -u +"%Y-%m-%dT%H:%M:%SZ")',
    GIT_COMMIT: '$GIT_COMMIT'
};
EOF
    
    echo "✅ Runtime configuration generated"
else
    echo "🔧 Development mode detected"
fi

# Health check function
health_check() {
    echo "🏥 Performing health check..."
    
    # Check if nginx is running
    if ! pgrep nginx > /dev/null; then
        echo "❌ Nginx is not running"
        return 1
    fi
    
    # Check if the application is accessible
    if ! curl -f http://localhost:80/health > /dev/null 2>&1; then
        echo "❌ Application health check failed"
        return 1
    fi
    
    echo "✅ Health check passed"
    return 0
}

# Signal handlers for graceful shutdown
cleanup() {
    echo "🛑 Received shutdown signal, cleaning up..."
    
    # Stop nginx gracefully
    nginx -s quit
    
    # Wait for nginx to finish
    while pgrep nginx > /dev/null; do
        sleep 1
    done
    
    echo "✅ Cleanup completed"
    exit 0
}

# Set up signal handlers
trap cleanup SIGTERM SIGINT

# Start nginx
echo "🌐 Starting Nginx..."
nginx -g "daemon off;" &

# Wait for nginx to start
sleep 2

# Perform initial health check
if ! health_check; then
    echo "❌ Initial health check failed, exiting..."
    exit 1
fi

echo "🎉 Application started successfully!"

# Keep the container running and perform periodic health checks
while true; do
    sleep 30
    
    if ! health_check; then
        echo "❌ Health check failed, restarting nginx..."
        nginx -s reload
    fi
done
