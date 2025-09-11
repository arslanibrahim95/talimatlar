#!/bin/bash

# =============================================================================
# VERSION CHECK AND OPTIMIZATION SCRIPT
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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to get version
get_version() {
    if command_exists "$1"; then
        "$1" --version 2>/dev/null | head -n1 || echo "Version not available"
    else
        echo "Not installed"
    fi
}

# Function to check Node.js version
check_node_version() {
    print_status "Checking Node.js version..."
    local node_version=$(get_version node)
    print_status "Node.js: $node_version"
    
    if command_exists node; then
        local major_version=$(node -v | cut -d'.' -f1 | sed 's/v//')
        if [ "$major_version" -lt 18 ]; then
            print_warning "Node.js version is below 18. Consider upgrading to Node.js 20 LTS"
        else
            print_success "Node.js version is compatible"
        fi
    fi
}

# Function to check Deno version
check_deno_version() {
    print_status "Checking Deno version..."
    local deno_version=$(get_version deno)
    print_status "Deno: $deno_version"
    
    if command_exists deno; then
        print_success "Deno is installed"
    else
        print_error "Deno is not installed. Please install Deno from https://deno.land"
    fi
}

# Function to check Go version
check_go_version() {
    print_status "Checking Go version..."
    local go_version=$(get_version go)
    print_status "Go: $go_version"
    
    if command_exists go; then
        print_success "Go is installed"
    else
        print_warning "Go is not installed. Installing via apt..."
        sudo apt update && sudo apt install -y golang-go
    fi
}

# Function to check Docker version
check_docker_version() {
    print_status "Checking Docker version..."
    local docker_version=$(get_version docker)
    print_status "Docker: $docker_version"
    
    if command_exists docker; then
        print_success "Docker is installed"
    else
        print_error "Docker is not installed. Please install Docker"
    fi
}

# Function to check Docker Compose version
check_docker_compose_version() {
    print_status "Checking Docker Compose version..."
    local compose_version=$(get_version docker-compose)
    if [ "$compose_version" = "Not installed" ]; then
        compose_version=$(docker compose version 2>/dev/null || echo "Not available")
    fi
    print_status "Docker Compose: $compose_version"
    
    if command_exists docker-compose || docker compose version >/dev/null 2>&1; then
        print_success "Docker Compose is available"
    else
        print_error "Docker Compose is not available"
    fi
}

# Function to check Python version
check_python_version() {
    print_status "Checking Python version..."
    local python_version=$(get_version python3)
    print_status "Python3: $python_version"
    
    if command_exists python3; then
        local major_version=$(python3 -c "import sys; print(sys.version_info.major)")
        local minor_version=$(python3 -c "import sys; print(sys.version_info.minor)")
        if [ "$major_version" -eq 3 ] && [ "$minor_version" -ge 11 ]; then
            print_success "Python version is compatible"
        else
            print_warning "Python version should be 3.11 or higher"
        fi
    else
        print_error "Python3 is not installed"
    fi
}

# Function to check npm version
check_npm_version() {
    print_status "Checking npm version..."
    local npm_version=$(get_version npm)
    print_status "npm: $npm_version"
    
    if command_exists npm; then
        print_success "npm is installed"
    else
        print_error "npm is not installed"
    fi
}

# Function to check package versions in package.json
check_package_versions() {
    print_status "Checking package.json versions..."
    
    if [ -f "package.json" ]; then
        print_status "Root package.json found"
        local node_engines=$(grep -A 2 '"engines"' package.json | grep node || echo "No engines specified")
        print_status "Node.js requirement: $node_engines"
    fi
    
    if [ -f "frontend/package.json" ]; then
        print_status "Frontend package.json found"
        local frontend_node_engines=$(grep -A 2 '"engines"' frontend/package.json | grep node || echo "No engines specified")
        print_status "Frontend Node.js requirement: $frontend_node_engines"
    fi
}

# Function to check for outdated packages
check_outdated_packages() {
    print_status "Checking for outdated packages..."
    
    if [ -f "package.json" ]; then
        print_status "Checking root dependencies..."
        npm outdated 2>/dev/null || print_warning "Some packages may be outdated"
    fi
    
    if [ -f "frontend/package.json" ]; then
        print_status "Checking frontend dependencies..."
        cd frontend
        npm outdated 2>/dev/null || print_warning "Some frontend packages may be outdated"
        cd ..
    fi
}

# Function to update Deno dependencies
update_deno_dependencies() {
    print_status "Updating Deno dependencies..."
    
    if [ -f "ai-service/deno.json" ]; then
        print_status "Updating AI service dependencies..."
        cd ai-service
        deno cache --reload deno.json 2>/dev/null || print_warning "Failed to update AI service dependencies"
        cd ..
    fi
    
    if [ -f "instruction-service/deno.json" ]; then
        print_status "Updating instruction service dependencies..."
        cd instruction-service
        deno cache --reload deno.json 2>/dev/null || print_warning "Failed to update instruction service dependencies"
        cd ..
    fi
}

# Function to update npm packages
update_npm_packages() {
    print_status "Updating npm packages..."
    
    if [ -f "package.json" ]; then
        print_status "Updating root dependencies..."
        npm update 2>/dev/null || print_warning "Failed to update root dependencies"
    fi
    
    if [ -f "frontend/package.json" ]; then
        print_status "Updating frontend dependencies..."
        cd frontend
        npm update 2>/dev/null || print_warning "Failed to update frontend dependencies"
        cd ..
    fi
}

# Function to check Docker images
check_docker_images() {
    print_status "Checking Docker images..."
    
    if command_exists docker; then
        print_status "Available Docker images:"
        docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | head -10
        
        print_status "Checking for outdated images..."
        docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.CreatedAt}}" | grep -E "(postgres|redis|nginx|node|python)" | head -5
    fi
}

# Function to provide optimization recommendations
provide_recommendations() {
    print_status "Optimization Recommendations:"
    echo ""
    echo "1. Update to latest LTS versions:"
    echo "   - Node.js: 20.x LTS (current: $(node -v 2>/dev/null || echo 'Not installed'))"
    echo "   - Deno: Latest stable (current: $(deno --version 2>/dev/null | head -n1 || echo 'Not installed'))"
    echo "   - Python: 3.12 (current: $(python3 --version 2>/dev/null || echo 'Not installed'))"
    echo ""
    echo "2. Docker optimizations:"
    echo "   - Use multi-stage builds"
    echo "   - Use Alpine Linux base images"
    echo "   - Implement proper caching strategies"
    echo ""
    echo "3. Performance optimizations:"
    echo "   - Enable gzip compression"
    echo "   - Use CDN for static assets"
    echo "   - Implement proper caching headers"
    echo "   - Use Redis for session storage"
    echo ""
    echo "4. Security optimizations:"
    echo "   - Regular security updates"
    echo "   - Use non-root users in containers"
    echo "   - Implement proper secrets management"
    echo "   - Regular dependency audits"
}

# Main execution
main() {
    print_status "Starting version check and optimization analysis..."
    echo ""
    
    check_node_version
    echo ""
    
    check_deno_version
    echo ""
    
    check_go_version
    echo ""
    
    check_docker_version
    echo ""
    
    check_docker_compose_version
    echo ""
    
    check_python_version
    echo ""
    
    check_npm_version
    echo ""
    
    check_package_versions
    echo ""
    
    check_outdated_packages
    echo ""
    
    check_docker_images
    echo ""
    
    provide_recommendations
    echo ""
    
    print_status "Version check completed!"
}

# Run main function
main "$@"
