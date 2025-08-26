#!/bin/bash

# =============================================================================
# CLAUDE TALİMAT İŞ GÜVENLİĞİ YÖNETİM SİSTEMİ - SETUP SCRIPT
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

# Function to check system requirements
check_requirements() {
    print_status "Checking system requirements..."
    
    # Check Docker
    if ! command_exists docker; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check Docker Compose
    if ! command_exists docker-compose; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if Docker daemon is running
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker daemon is not running. Please start Docker first."
        exit 1
    fi
    
    print_success "System requirements check passed!"
}

# Function to create environment file
create_env_file() {
    print_status "Creating environment file..."
    
    if [ ! -f .env ]; then
        cp .env.example .env
        print_success "Environment file created from .env.example"
        print_warning "Please review and update .env file with your configuration"
    else
        print_warning "Environment file already exists, skipping..."
    fi
}

# Function to create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    # Create upload directories
    mkdir -p services/document-service/uploads
    mkdir -p services/analytics-service/logs
    mkdir -p services/notification-service/logs
    
    # Create log directories
    mkdir -p logs/nginx
    mkdir -p logs/postgresql
    mkdir -p logs/redis
    
    print_success "Directories created successfully!"
}

# Function to set proper permissions
set_permissions() {
    print_status "Setting proper permissions..."
    
    # Make scripts executable
    chmod +x infrastructure/scripts/*.sh
    chmod +x scripts/*.sh
    
    # Set proper permissions for upload directories
    chmod 755 services/document-service/uploads
    chmod 755 services/analytics-service/logs
    chmod 755 services/notification-service/logs
    
    print_success "Permissions set successfully!"
}

# Function to build and start services
start_services() {
    print_status "Building and starting services..."
    
    # Build images
    print_status "Building Docker images..."
    docker-compose build
    
    # Start services
    print_status "Starting services..."
    docker-compose up -d
    
    print_success "Services started successfully!"
}

# Function to wait for services to be ready
wait_for_services() {
    print_status "Waiting for services to be ready..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost/health >/dev/null 2>&1; then
            print_success "All services are ready!"
            return 0
        fi
        
        print_status "Waiting for services... (attempt $attempt/$max_attempts)"
        sleep 10
        attempt=$((attempt + 1))
    done
    
    print_error "Services failed to start within expected time"
    return 1
}

# Function to show service status
show_status() {
    print_status "Service status:"
    docker-compose ps
    
    echo ""
    print_status "Service URLs:"
    echo "  Frontend: http://localhost"
    echo "  Auth API: http://localhost/api/v1/auth"
    echo "  Document API: http://localhost/api/v1/documents"
    echo "  Analytics API: http://localhost/api/v1/analytics"
    echo "  Notification API: http://localhost/api/v1/notifications"
    echo "  Grafana: http://localhost:3000 (admin/admin123)"
    echo "  Prometheus: http://localhost:9090"
    echo "  MinIO Console: http://localhost:9001 (minioadmin/minioadmin123)"
}

# Function to run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    # Wait for PostgreSQL to be ready
    print_status "Waiting for PostgreSQL to be ready..."
    docker-compose exec -T postgres pg_isready -U safety_admin -d safety_production
    
    print_success "Database migrations completed!"
}

# Function to create initial data
create_initial_data() {
    print_status "Creating initial data..."
    
    # This will be handled by the init.sql script
    print_success "Initial data created successfully!"
}

# Function to show next steps
show_next_steps() {
    echo ""
    print_success "Setup completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Access the frontend at http://localhost"
    echo "2. Login with default credentials:"
    echo "   - Email: admin@orneksirket.com"
    echo "   - Password: admin123"
    echo "3. Review and update configuration in .env file"
    echo "4. Check service logs: docker-compose logs -f [service-name]"
    echo "5. Monitor system with Grafana: http://localhost:3000"
    echo ""
    echo "Useful commands:"
    echo "  - Stop services: docker-compose down"
    echo "  - View logs: docker-compose logs -f"
    echo "  - Restart services: docker-compose restart"
    echo "  - Update services: docker-compose pull && docker-compose up -d"
}

# Main setup function
main() {
    echo "=============================================================================="
    echo "  CLAUDE TALİMAT İŞ GÜVENLİĞİ YÖNETİM SİSTEMİ - SETUP"
    echo "=============================================================================="
    echo ""
    
    # Check if running as root
    if [ "$EUID" -eq 0 ]; then
        print_warning "Running as root. This is not recommended for security reasons."
        read -p "Do you want to continue? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # Run setup steps
    check_requirements
    create_env_file
    create_directories
    set_permissions
    start_services
    wait_for_services
    run_migrations
    create_initial_data
    show_status
    show_next_steps
}

# Run main function
main "$@"
