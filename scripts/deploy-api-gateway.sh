#!/bin/bash

# =============================================================================
# API Gateway Deployment Script
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_GATEWAY_DIR="./api-gateway"
DOCKER_COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_error "This script should not be run as root"
        exit 1
    fi
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if API Gateway directory exists
    if [ ! -d "$API_GATEWAY_DIR" ]; then
        log_error "API Gateway directory not found: $API_GATEWAY_DIR"
        exit 1
    fi
    
    # Check if docker-compose.yml exists
    if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
        log_error "Docker Compose file not found: $DOCKER_COMPOSE_FILE"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Check environment configuration
check_environment() {
    log_info "Checking environment configuration..."
    
    if [ ! -f "$ENV_FILE" ]; then
        log_warning "Environment file not found. Creating from example..."
        if [ -f "env.example" ]; then
            cp env.example .env
            log_warning "Please update .env file with your configuration"
        else
            log_error "No environment file found. Please create .env file"
            exit 1
        fi
    fi
    
    # Check required environment variables
    source .env
    
    if [ -z "$JWT_SECRET" ]; then
        log_error "JWT_SECRET is not set in .env file"
        exit 1
    fi
    
    if [ "$JWT_SECRET" = "your-super-secret-jwt-key-here-change-this-in-production" ]; then
        log_warning "JWT_SECRET is using default value. Please change it in production!"
    fi
    
    log_success "Environment configuration check passed"
}

# Build API Gateway
build_api_gateway() {
    log_info "Building API Gateway..."
    
    cd "$API_GATEWAY_DIR"
    
    # Check if deno.json exists
    if [ ! -f "deno.json" ]; then
        log_error "deno.json not found in API Gateway directory"
        exit 1
    fi
    
    # Check if main.ts exists
    if [ ! -f "main.ts" ]; then
        log_error "main.ts not found in API Gateway directory"
        exit 1
    fi
    
    cd ..
    
    # Build Docker image
    log_info "Building Docker image for API Gateway..."
    docker-compose build api-gateway
    
    log_success "API Gateway build completed"
}

# Deploy API Gateway
deploy_api_gateway() {
    log_info "Deploying API Gateway..."
    
    # Stop existing API Gateway if running
    log_info "Stopping existing API Gateway..."
    docker-compose stop api-gateway 2>/dev/null || true
    
    # Remove existing API Gateway container
    log_info "Removing existing API Gateway container..."
    docker-compose rm -f api-gateway 2>/dev/null || true
    
    # Start API Gateway
    log_info "Starting API Gateway..."
    docker-compose up -d api-gateway
    
    log_success "API Gateway deployment completed"
}

# Wait for API Gateway to be ready
wait_for_api_gateway() {
    log_info "Waiting for API Gateway to be ready..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:8080/gateway/health &>/dev/null; then
            log_success "API Gateway is ready!"
            return 0
        fi
        
        log_info "Attempt $attempt/$max_attempts - API Gateway not ready yet, waiting..."
        sleep 2
        ((attempt++))
    done
    
    log_error "API Gateway failed to start within expected time"
    return 1
}

# Test API Gateway
test_api_gateway() {
    log_info "Testing API Gateway..."
    
    # Test health endpoint
    log_info "Testing health endpoint..."
    if curl -f http://localhost:8080/gateway/health; then
        log_success "Health endpoint test passed"
    else
        log_error "Health endpoint test failed"
        return 1
    fi
    
    # Test metrics endpoint
    log_info "Testing metrics endpoint..."
    if curl -f http://localhost:8080/gateway/metrics; then
        log_success "Metrics endpoint test passed"
    else
        log_error "Metrics endpoint test failed"
        return 1
    fi
    
    # Test services endpoint
    log_info "Testing services endpoint..."
    if curl -f http://localhost:8080/gateway/services; then
        log_success "Services endpoint test passed"
    else
        log_error "Services endpoint test failed"
        return 1
    fi
    
    log_success "All API Gateway tests passed"
}

# Show deployment status
show_status() {
    log_info "Deployment Status:"
    echo "=================="
    
    # Show running containers
    log_info "Running containers:"
    docker-compose ps
    
    echo ""
    
    # Show API Gateway logs
    log_info "API Gateway logs (last 20 lines):"
    docker-compose logs --tail=20 api-gateway
    
    echo ""
    
    # Show health status
    log_info "API Gateway health status:"
    curl -s http://localhost:8080/gateway/health | jq . 2>/dev/null || curl -s http://localhost:8080/gateway/health
}

# Cleanup function
cleanup() {
    log_info "Cleaning up..."
    # Add any cleanup tasks here
}

# Main deployment function
main() {
    log_info "Starting API Gateway deployment..."
    
    # Set trap for cleanup
    trap cleanup EXIT
    
    # Run deployment steps
    check_root
    check_prerequisites
    check_environment
    build_api_gateway
    deploy_api_gateway
    
    if wait_for_api_gateway; then
        test_api_gateway
        show_status
        log_success "API Gateway deployment completed successfully!"
    else
        log_error "API Gateway deployment failed"
        exit 1
    fi
}

# Handle command line arguments
case "${1:-}" in
    "build")
        check_prerequisites
        build_api_gateway
        ;;
    "deploy")
        check_prerequisites
        check_environment
        deploy_api_gateway
        ;;
    "test")
        test_api_gateway
        ;;
    "status")
        show_status
        ;;
    "logs")
        docker-compose logs -f api-gateway
        ;;
    "stop")
        log_info "Stopping API Gateway..."
        docker-compose stop api-gateway
        log_success "API Gateway stopped"
        ;;
    "restart")
        log_info "Restarting API Gateway..."
        docker-compose restart api-gateway
        log_success "API Gateway restarted"
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  build     Build API Gateway Docker image"
        echo "  deploy    Deploy API Gateway"
        echo "  test      Test API Gateway endpoints"
        echo "  status    Show deployment status"
        echo "  logs      Show API Gateway logs"
        echo "  stop      Stop API Gateway"
        echo "  restart   Restart API Gateway"
        echo "  help      Show this help message"
        echo ""
        echo "If no command is specified, full deployment will be performed."
        ;;
    "")
        main
        ;;
    *)
        log_error "Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac
