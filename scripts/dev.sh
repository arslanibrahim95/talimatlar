#!/bin/bash

# =============================================================================
# CLAUDE TALİMAT İŞ GÜVENLİĞİ YÖNETİM SİSTEMİ - DEVELOPMENT SCRIPT
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

# Function to show usage
show_usage() {
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  start           Start all services in development mode"
    echo "  stop            Stop all services"
    echo "  restart         Restart all services"
    echo "  logs            Show service logs"
    echo "  status          Show service status"
    echo "  install         Install all dependencies"
    echo "  build           Build all services"
    echo "  test            Run all tests"
    echo "  lint            Run all linters"
    echo "  clean           Clean build artifacts"
    echo "  shell           Open shell for a service"
    echo "  frontend        Start only frontend"
    echo "  backend         Start only backend services"
    echo "  help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start                    # Start all services"
    echo "  $0 shell postgres           # Open PostgreSQL shell"
    echo "  $0 logs nginx               # Show Nginx logs"
    echo "  $0 frontend                 # Start only frontend"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
}

# Function to start all services
start_services() {
    print_status "Starting all services..."
    
    # Start infrastructure services first
    docker-compose up -d postgres redis meilisearch minio
    
    # Wait for infrastructure to be ready
    print_status "Waiting for infrastructure services to be ready..."
    sleep 10
    
    # Start backend services
    docker-compose up -d auth-service document-service analytics-service notification-service
    
    # Wait for backend services
    print_status "Waiting for backend services to be ready..."
    sleep 5
    
    # Start Nginx
    docker-compose up -d nginx
    
    print_success "All services started successfully!"
}

# Function to start frontend only
start_frontend() {
    print_status "Starting frontend in development mode..."
    
    cd frontend
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        print_status "Installing frontend dependencies..."
        npm install
    fi
    
    # Start frontend
    npm run dev
}

# Function to start backend services only
start_backend() {
    print_status "Starting backend services..."
    
    # Start infrastructure
    docker-compose up -d postgres redis meilisearch minio
    
    # Start backend services
    docker-compose up -d auth-service document-service analytics-service notification-service
    
    print_success "Backend services started!"
}

# Function to stop services
stop_services() {
    print_status "Stopping all services..."
    docker-compose down
    print_success "All services stopped!"
}

# Function to restart services
restart_services() {
    print_status "Restarting all services..."
    docker-compose restart
    print_success "All services restarted!"
}

# Function to show logs
show_logs() {
    local service="$1"
    
    if [ -z "$service" ]; then
        print_status "Showing all service logs..."
        docker-compose logs -f
    else
        print_status "Showing logs for $service..."
        docker-compose logs -f "$service"
    fi
}

# Function to show status
show_status() {
    print_status "Service status:"
    docker-compose ps
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing all dependencies..."
    
    # Install root dependencies
    npm install
    
    # Install frontend dependencies
    cd frontend
    npm install
    cd ..
    
    # Install backend dependencies
    cd services/auth-service
    deno cache --reload deno.json
    cd ../..
    
    cd services/document-service
    pip install -r requirements.txt
    cd ../..
    
    cd services/analytics-service
    pip install -r requirements.txt
    cd ../..
    
    cd services/notification-service
    go mod download
    cd ../..
    
    print_success "All dependencies installed!"
}

# Function to build services
build_services() {
    print_status "Building all services..."
    
    # Build frontend
    cd frontend
    npm run build
    cd ..
    
    # Build Docker images
    docker-compose build
    
    print_success "All services built successfully!"
}

# Function to run tests
run_tests() {
    print_status "Running all tests..."
    
    # Frontend tests
    cd frontend
    npm run test
    cd ..
    
    # Backend tests
    cd services/auth-service
    deno test
    cd ../..
    
    cd services/document-service
    python -m pytest
    cd ../..
    
    cd services/analytics-service
    python -m pytest
    cd ../..
    
    cd services/notification-service
    go test ./...
    cd ../..
    
    print_success "All tests completed!"
}

# Function to run linters
run_linters() {
    print_status "Running all linters..."
    
    # Frontend linting
    cd frontend
    npm run lint
    cd ..
    
    # Backend linting
    cd services/auth-service
    deno fmt --check
    deno lint
    cd ../..
    
    cd services/document-service
    python -m black --check .
    python -m flake8 .
    cd ../..
    
    cd services/analytics-service
    python -m black --check .
    python -m flake8 .
    cd ../..
    
    cd services/notification-service
    go fmt ./...
    go vet ./...
    cd ../..
    
    print_success "All linters completed!"
}

# Function to clean build artifacts
clean_artifacts() {
    print_status "Cleaning build artifacts..."
    
    # Clean frontend
    cd frontend
    rm -rf node_modules dist .vite
    cd ..
    
    # Clean backend
    cd services
    find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
    find . -type f -name '*.pyc' -delete 2>/dev/null || true
    cd ..
    
    # Clean Docker
    docker-compose down -v --remove-orphans
    docker system prune -f
    
    print_success "Build artifacts cleaned!"
}

# Function to open shell
open_shell() {
    local service="$1"
    
    if [ -z "$service" ]; then
        print_error "Please specify a service name"
        echo "Available services: postgres, redis, auth-service, document-service, analytics-service, notification-service"
        exit 1
    fi
    
    print_status "Opening shell for $service..."
    
    case "$service" in
        postgres)
            docker-compose exec postgres psql -U safety_admin -d safety_production
            ;;
        redis)
            docker-compose exec redis redis-cli
            ;;
        auth-service)
            docker-compose exec auth-service /bin/sh
            ;;
        document-service)
            docker-compose exec document-service /bin/bash
            ;;
        analytics-service)
            docker-compose exec analytics-service /bin/bash
            ;;
        notification-service)
            docker-compose exec notification-service /bin/sh
            ;;
        *)
            print_error "Unknown service: $service"
            exit 1
            ;;
    esac
}

# Function to check service health
check_health() {
    print_status "Checking service health..."
    
    local endpoints=(
        "http://localhost/health"
        "http://localhost:8001/health"
        "http://localhost:8002/health"
        "http://localhost:8003/health"
        "http://localhost:8004/health"
    )
    
    for endpoint in "${endpoints[@]}"; do
        if curl -f -s "$endpoint" >/dev/null 2>&1; then
            print_success "$endpoint: OK"
        else
            print_error "$endpoint: FAILED"
        fi
    done
}

# Main function
main() {
    local command="$1"
    local service="$2"
    
    # Check Docker
    check_docker
    
    case "$command" in
        start)
            start_services
            ;;
        stop)
            stop_services
            ;;
        restart)
            restart_services
            ;;
        logs)
            show_logs "$service"
            ;;
        status)
            show_status
            ;;
        install)
            install_dependencies
            ;;
        build)
            build_services
            ;;
        test)
            run_tests
            ;;
        lint)
            run_linters
            ;;
        clean)
            clean_artifacts
            ;;
        shell)
            open_shell "$service"
            ;;
        frontend)
            start_frontend
            ;;
        backend)
            start_backend
            ;;
        health)
            check_health
            ;;
        help|--help|-h)
            show_usage
            ;;
        "")
            show_usage
            ;;
        *)
            print_error "Unknown command: $command"
            show_usage
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
