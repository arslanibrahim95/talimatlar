#!/bin/bash

# =============================================================================
# CLAUDE TALİMAT PRODUCTION DEPLOYMENT SCRIPT
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="claude-talimat"
PRODUCTION_ENV_FILE="env.prod"
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"
BACKUP_DIR="./backups"
LOG_DIR="./logs"

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
        log_error "This script should not be run as root for security reasons"
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
    if ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if environment file exists
    if [[ ! -f "$PRODUCTION_ENV_FILE" ]]; then
        log_error "Production environment file $PRODUCTION_ENV_FILE not found!"
        exit 1
    fi
    
    # Check if docker-compose file exists
    if [[ ! -f "$DOCKER_COMPOSE_FILE" ]]; then
        log_error "Production Docker Compose file $DOCKER_COMPOSE_FILE not found!"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Create necessary directories
create_directories() {
    log_info "Creating necessary directories..."
    
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$LOG_DIR"/{nginx,postgres,redis,auth,document,analytics,notification}
    mkdir -p "./ssl"
    mkdir -p "./storage/documents"
    mkdir -p "./monitoring/grafana/dashboards"
    mkdir -p "./monitoring/grafana/datasources"
    mkdir -p "./monitoring/logstash/pipeline"
    
    log_success "Directories created"
}

# Backup existing data
backup_data() {
    log_info "Creating backup of existing data..."
    
    BACKUP_TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_PATH="$BACKUP_DIR/backup_$BACKUP_TIMESTAMP"
    
    mkdir -p "$BACKUP_PATH"
    
    # Backup database if it exists
    if docker ps | grep -q "claude-talimat-postgres"; then
        log_info "Backing up PostgreSQL database..."
        docker exec claude-talimat-postgres pg_dump -U claude_talimat claude_talimat > "$BACKUP_PATH/database.sql"
    fi
    
    # Backup Redis data if it exists
    if docker ps | grep -q "claude-talimat-redis"; then
        log_info "Backing up Redis data..."
        docker exec claude-talimat-redis redis-cli --rdb /data/dump.rdb
        docker cp claude-talimat-redis:/data/dump.rdb "$BACKUP_PATH/redis.rdb"
    fi
    
    # Backup application data
    if [[ -d "./storage" ]]; then
        cp -r ./storage "$BACKUP_PATH/"
    fi
    
    log_success "Backup created at $BACKUP_PATH"
}

# Generate SSL certificates (self-signed for development)
generate_ssl_certificates() {
    log_info "Generating SSL certificates..."
    
    if [[ ! -f "./ssl/cert.pem" ]] || [[ ! -f "./ssl/key.pem" ]]; then
        openssl req -x509 -newkey rsa:4096 -keyout ./ssl/key.pem -out ./ssl/cert.pem -days 365 -nodes \
            -subj "/C=TR/ST=Istanbul/L=Istanbul/O=Claude Talimat/OU=IT Department/CN=claude-talimat.com"
        log_success "SSL certificates generated"
    else
        log_info "SSL certificates already exist"
    fi
}

# Build and start services
deploy_services() {
    log_info "Building and starting production services..."
    
    # Stop existing services
    log_info "Stopping existing services..."
    docker compose -f "$DOCKER_COMPOSE_FILE" --env-file "$PRODUCTION_ENV_FILE" down || true
    
    # Build and start services
    log_info "Building Docker images..."
    docker compose -f "$DOCKER_COMPOSE_FILE" --env-file "$PRODUCTION_ENV_FILE" build --no-cache
    
    log_info "Starting services..."
    docker compose -f "$DOCKER_COMPOSE_FILE" --env-file "$PRODUCTION_ENV_FILE" up -d
    
    log_success "Services started"
}

# Wait for services to be healthy
wait_for_services() {
    log_info "Waiting for services to be healthy..."
    
    # Wait for database
    log_info "Waiting for PostgreSQL..."
    timeout 60 bash -c 'until docker exec claude-talimat-postgres pg_isready -U claude_talimat; do sleep 2; done'
    
    # Wait for Redis
    log_info "Waiting for Redis..."
    timeout 30 bash -c 'until docker exec claude-talimat-redis redis-cli ping; do sleep 2; done'
    
    # Wait for services
    log_info "Waiting for application services..."
    sleep 30
    
    log_success "All services are healthy"
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."
    
    # Wait for database to be ready
    sleep 10
    
    # Run migrations (if you have a migration script)
    if [[ -f "./scripts/migrate.sh" ]]; then
        ./scripts/migrate.sh
    else
        log_info "No migration script found, skipping migrations"
    fi
}

# Setup monitoring
setup_monitoring() {
    log_info "Setting up monitoring..."
    
    # Copy monitoring configurations
    if [[ -f "./monitoring/prometheus.yml" ]]; then
        log_info "Prometheus configuration found"
    else
        log_warning "Prometheus configuration not found"
    fi
    
    # Wait for monitoring services
    log_info "Waiting for monitoring services..."
    sleep 20
    
    log_success "Monitoring setup completed"
}

# Health check
health_check() {
    log_info "Performing health checks..."
    
    # Check if all containers are running
    if ! docker compose -f "$DOCKER_COMPOSE_FILE" --env-file "$PRODUCTION_ENV_FILE" ps | grep -q "Up"; then
        log_error "Some services are not running"
        docker compose -f "$DOCKER_COMPOSE_FILE" --env-file "$PRODUCTION_ENV_FILE" ps
        exit 1
    fi
    
    # Check service endpoints
    log_info "Checking service endpoints..."
    
    # Frontend
    if curl -f -s http://localhost:80 > /dev/null; then
        log_success "Frontend is accessible"
    else
        log_warning "Frontend is not accessible"
    fi
    
    # Auth Service
    if curl -f -s http://localhost:8004/health > /dev/null; then
        log_success "Auth service is healthy"
    else
        log_warning "Auth service is not healthy"
    fi
    
    # Analytics Service
    if curl -f -s http://localhost:8003/health > /dev/null; then
        log_success "Analytics service is healthy"
    else
        log_warning "Analytics service is not healthy"
    fi
    
    # Monitoring
    if curl -f -s http://localhost:9090 > /dev/null; then
        log_success "Prometheus is accessible"
    else
        log_warning "Prometheus is not accessible"
    fi
    
    if curl -f -s http://localhost:3000 > /dev/null; then
        log_success "Grafana is accessible"
    else
        log_warning "Grafana is not accessible"
    fi
    
    log_success "Health checks completed"
}

# Display deployment information
display_info() {
    log_success "🚀 Production deployment completed successfully!"
    echo ""
    echo "📊 Service URLs:"
    echo "  • Frontend: http://localhost:80"
    echo "  • Auth API: http://localhost:8004"
    echo "  • Document API: http://localhost:8002"
    echo "  • Analytics API: http://localhost:8003"
    echo "  • Notification API: http://localhost:8005"
    echo ""
    echo "📈 Monitoring URLs:"
    echo "  • Prometheus: http://localhost:9090"
    echo "  • Grafana: http://localhost:3000 (admin/ClaudeTalimat2024!Grafana)"
    echo "  • Kibana: http://localhost:5601"
    echo ""
    echo "🔧 Management Commands:"
    echo "  • View logs: docker compose -f $DOCKER_COMPOSE_FILE --env-file $PRODUCTION_ENV_FILE logs -f"
    echo "  • Stop services: docker compose -f $DOCKER_COMPOSE_FILE --env-file $PRODUCTION_ENV_FILE down"
    echo "  • Restart services: docker compose -f $DOCKER_COMPOSE_FILE --env-file $PRODUCTION_ENV_FILE restart"
    echo ""
    echo "📁 Important Directories:"
    echo "  • Logs: $LOG_DIR"
    echo "  • Backups: $BACKUP_DIR"
    echo "  • SSL Certificates: ./ssl"
    echo "  • Document Storage: ./storage"
    echo ""
}

# Main deployment function
main() {
    echo "🚀 Starting Claude Talimat Production Deployment..."
    echo "=================================================="
    
    check_root
    check_prerequisites
    create_directories
    backup_data
    generate_ssl_certificates
    deploy_services
    wait_for_services
    run_migrations
    setup_monitoring
    health_check
    display_info
    
    log_success "🎉 Deployment completed successfully!"
}

# Run main function
main "$@"
