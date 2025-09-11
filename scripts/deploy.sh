#!/bin/bash

# Claude Talimat Deployment Script
# Supports: dev, staging, production (blue-green)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENVIRONMENT=${1:-dev}
ACTION=${2:-deploy}

# Environment-specific configurations
declare -A ENV_CONFIGS
ENV_CONFIGS[dev]="docker-compose.dev.yml"
ENV_CONFIGS[staging]="docker-compose.staging.yml"
ENV_CONFIGS[production]="docker-compose.prod.yml"
ENV_CONFIGS[blue]="docker-compose.blue.yml"
ENV_CONFIGS[green]="docker-compose.green.yml"

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if environment is valid
validate_environment() {
    if [[ ! ${ENV_CONFIGS[$ENVIRONMENT]+_} ]]; then
        error "Invalid environment: $ENVIRONMENT"
        echo "Valid environments: ${!ENV_CONFIGS[@]}"
        exit 1
    fi
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    
    # Check if docker-compose is available
    if ! command -v docker-compose > /dev/null 2>&1; then
        error "docker-compose is not installed. Please install docker-compose and try again."
        exit 1
    fi
    
    # Check if environment file exists
    if [[ ! -f "$PROJECT_DIR/.env" ]]; then
        warning "Environment file .env not found. Using default values."
    fi
    
    success "Prerequisites check passed"
}

# Backup function
backup_data() {
    log "Creating backup..."
    
    BACKUP_DIR="$PROJECT_DIR/backups/backup_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # Backup database
    if [[ "$ENVIRONMENT" == "production" || "$ENVIRONMENT" == "blue" || "$ENVIRONMENT" == "green" ]]; then
        log "Backing up database..."
        docker-compose -f "$PROJECT_DIR/${ENV_CONFIGS[$ENVIRONMENT]}" exec -T postgres pg_dump -U claude claude_prod > "$BACKUP_DIR/database.sql" || true
    fi
    
    # Backup uploads
    if [[ -d "$PROJECT_DIR/storage/documents" ]]; then
        log "Backing up uploads..."
        cp -r "$PROJECT_DIR/storage/documents" "$BACKUP_DIR/" || true
    fi
    
    success "Backup created at $BACKUP_DIR"
}

# Health check function
health_check() {
    log "Running health checks..."
    
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        log "Health check attempt $attempt/$max_attempts"
        
        # Check if services are responding
        if curl -f http://localhost:8080/health > /dev/null 2>&1; then
            success "Health check passed"
            return 0
        fi
        
        sleep 10
        ((attempt++))
    done
    
    error "Health check failed after $max_attempts attempts"
    return 1
}

# Deploy function
deploy() {
    log "Starting deployment to $ENVIRONMENT environment..."
    
    local compose_file="$PROJECT_DIR/${ENV_CONFIGS[$ENVIRONMENT]}"
    
    # Create backup before deployment
    if [[ "$ENVIRONMENT" == "production" || "$ENVIRONMENT" == "blue" || "$ENVIRONMENT" == "green" ]]; then
        backup_data
    fi
    
    # Pull latest images
    log "Pulling latest images..."
    docker-compose -f "$compose_file" pull
    
    # Build images
    log "Building images..."
    docker-compose -f "$compose_file" build --no-cache
    
    # Stop existing services
    log "Stopping existing services..."
    docker-compose -f "$compose_file" down
    
    # Start services
    log "Starting services..."
    docker-compose -f "$compose_file" up -d
    
    # Wait for services to be ready
    log "Waiting for services to be ready..."
    sleep 30
    
    # Run health checks
    if health_check; then
        success "Deployment to $ENVIRONMENT completed successfully"
    else
        error "Deployment to $ENVIRONMENT failed health checks"
        rollback
        exit 1
    fi
}

# Blue-Green deployment
blue_green_deploy() {
    log "Starting blue-green deployment..."
    
    # Determine current active environment
    local current_env
    if docker-compose -f "$PROJECT_DIR/docker-compose.blue.yml" ps | grep -q "Up"; then
        current_env="blue"
        target_env="green"
    else
        current_env="green"
        target_env="blue"
    fi
    
    log "Current active environment: $current_env"
    log "Deploying to: $target_env"
    
    # Deploy to target environment
    ENVIRONMENT=$target_env
    deploy
    
    # Run additional tests on target environment
    log "Running additional tests on $target_env environment..."
    # Add your specific tests here
    
    # Switch traffic (this would typically involve load balancer configuration)
    log "Switching traffic to $target_env environment..."
    # In a real scenario, this would update your load balancer configuration
    
    # Stop old environment after successful switch
    log "Stopping $current_env environment..."
    docker-compose -f "$PROJECT_DIR/docker-compose.$current_env.yml" down
    
    success "Blue-green deployment completed successfully"
}

# Rollback function
rollback() {
    log "Starting rollback..."
    
    # This would restore from the latest backup
    # Implementation depends on your specific backup strategy
    
    warning "Rollback functionality needs to be implemented based on your backup strategy"
}

# Cleanup function
cleanup() {
    log "Cleaning up unused Docker resources..."
    
    # Remove unused images
    docker image prune -f
    
    # Remove unused volumes
    docker volume prune -f
    
    # Remove unused networks
    docker network prune -f
    
    success "Cleanup completed"
}

# Show status
show_status() {
    log "Showing status for $ENVIRONMENT environment..."
    
    local compose_file="$PROJECT_DIR/${ENV_CONFIGS[$ENVIRONMENT]}"
    docker-compose -f "$compose_file" ps
}

# Main execution
main() {
    log "Claude Talimat Deployment Script"
    log "Environment: $ENVIRONMENT"
    log "Action: $ACTION"
    
    validate_environment
    check_prerequisites
    
    case $ACTION in
        deploy)
            if [[ "$ENVIRONMENT" == "production" ]]; then
                blue_green_deploy
            else
                deploy
            fi
            ;;
        rollback)
            rollback
            ;;
        status)
            show_status
            ;;
        cleanup)
            cleanup
            ;;
        health)
            health_check
            ;;
        *)
            error "Invalid action: $ACTION"
            echo "Valid actions: deploy, rollback, status, cleanup, health"
            exit 1
            ;;
    esac
}

# Help function
show_help() {
    echo "Claude Talimat Deployment Script"
    echo ""
    echo "Usage: $0 [ENVIRONMENT] [ACTION]"
    echo ""
    echo "Environments:"
    echo "  dev        - Development environment"
    echo "  staging    - Staging environment"
    echo "  production - Production environment (blue-green deployment)"
    echo "  blue       - Blue environment (current production)"
    echo "  green      - Green environment (new production)"
    echo ""
    echo "Actions:"
    echo "  deploy     - Deploy the application (default)"
    echo "  rollback   - Rollback to previous version"
    echo "  status     - Show service status"
    echo "  cleanup    - Clean up unused Docker resources"
    echo "  health     - Run health checks"
    echo ""
    echo "Examples:"
    echo "  $0 dev deploy"
    echo "  $0 staging deploy"
    echo "  $0 production deploy"
    echo "  $0 blue status"
    echo "  $0 green health"
}

# Check for help flag
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    show_help
    exit 0
fi

# Run main function
main "$@"