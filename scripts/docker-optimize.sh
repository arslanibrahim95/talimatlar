#!/bin/bash

# =============================================================================
# DOCKER OPTIMIZATION SCRIPT
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    print_success "Docker is running"
}

# Function to enable BuildKit
enable_buildkit() {
    print_status "Enabling Docker BuildKit for faster builds..."
    export DOCKER_BUILDKIT=1
    export COMPOSE_DOCKER_CLI_BUILD=1
    print_success "BuildKit enabled"
}

# Function to clean up Docker resources
cleanup_docker() {
    print_status "Cleaning up Docker resources..."
    
    # Remove unused containers
    docker container prune -f
    
    # Remove unused images
    docker image prune -f
    
    # Remove unused volumes
    docker volume prune -f
    
    # Remove unused networks
    docker network prune -f
    
    print_success "Docker cleanup completed"
}

# Function to build optimized images
build_images() {
    print_status "Building optimized Docker images..."
    
    # Build AI Service
    print_status "Building AI Service..."
    docker build \
        --build-arg BUILDKIT_INLINE_CACHE=1 \
        --tag claude-ai:optimized \
        ./ai-service
    
    # Build Instruction Service
    print_status "Building Instruction Service..."
    docker build \
        --build-arg BUILDKIT_INLINE_CACHE=1 \
        --tag claude-instruction:optimized \
        ./instruction-service
    
    # Build Frontend
    print_status "Building Frontend..."
    docker build \
        --build-arg BUILDKIT_INLINE_CACHE=1 \
        --tag claude-frontend:optimized \
        ./frontend
    
    print_success "All images built successfully"
}

# Function to run security scan
security_scan() {
    print_status "Running security scan on images..."
    
    # Check if trivy is available
    if command -v trivy &> /dev/null; then
        print_status "Scanning AI Service image..."
        trivy image claude-ai:optimized
        
        print_status "Scanning Instruction Service image..."
        trivy image claude-instruction:optimized
        
        print_status "Scanning Frontend image..."
        trivy image claude-frontend:optimized
        
        print_success "Security scan completed"
    else
        print_warning "Trivy not found. Install trivy for security scanning."
    fi
}

# Function to show image sizes
show_image_sizes() {
    print_status "Docker image sizes:"
    docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | grep claude
}

# Function to start optimized services
start_services() {
    print_status "Starting optimized services..."
    docker-compose -f docker-compose.optimized.yml up -d
    print_success "Services started successfully"
}

# Function to show service status
show_status() {
    print_status "Service status:"
    docker-compose -f docker-compose.optimized.yml ps
}

# Function to show resource usage
show_resources() {
    print_status "Resource usage:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"
}

# Main function
main() {
    print_status "Starting Docker optimization process..."
    
    check_docker
    enable_buildkit
    cleanup_docker
    build_images
    security_scan
    show_image_sizes
    
    if [ "$1" = "--start" ]; then
        start_services
        show_status
        show_resources
    fi
    
    print_success "Docker optimization completed!"
    print_status "To start optimized services, run: $0 --start"
}

# Run main function with all arguments
main "$@"
