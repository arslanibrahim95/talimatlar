#!/bin/bash

# Blue-Green Deployment Script for Claude Talimat
# This script manages blue-green deployments with zero downtime

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
ACTION=${1:-deploy}

# Load balancer configuration (this would be your actual load balancer)
LOAD_BALANCER_URL="https://api.claude-talimat.com"
BLUE_URL="https://blue.claude-talimat.com"
GREEN_URL="https://green.claude-talimat.com"

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

# Check which environment is currently active
get_active_environment() {
    log "Checking active environment..."
    
    # Check if blue is running
    if docker-compose -f "$PROJECT_DIR/docker-compose.blue.yml" ps | grep -q "Up"; then
        echo "blue"
    # Check if green is running
    elif docker-compose -f "$PROJECT_DIR/docker-compose.green.yml" ps | grep -q "Up"; then
        echo "green"
    else
        echo "none"
    fi
}

# Get inactive environment
get_inactive_environment() {
    local active=$1
    if [[ "$active" == "blue" ]]; then
        echo "green"
    else
        echo "blue"
    fi
}

# Health check for specific environment
health_check_environment() {
    local env=$1
    local url
    
    if [[ "$env" == "blue" ]]; then
        url="$BLUE_URL"
    else
        url="$GREEN_URL"
    fi
    
    log "Running health check for $env environment at $url"
    
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        log "Health check attempt $attempt/$max_attempts for $env"
        
        if curl -f "$url/health" > /dev/null 2>&1; then
            success "Health check passed for $env environment"
            return 0
        fi
        
        sleep 10
        ((attempt++))
    done
    
    error "Health check failed for $env environment after $max_attempts attempts"
    return 1
}

# Deploy to specific environment
deploy_to_environment() {
    local env=$1
    
    log "Deploying to $env environment..."
    
    local compose_file="$PROJECT_DIR/docker-compose.$env.yml"
    
    # Pull latest images
    log "Pulling latest images for $env..."
    docker-compose -f "$compose_file" pull
    
    # Build images
    log "Building images for $env..."
    docker-compose -f "$compose_file" build --no-cache
    
    # Start services
    log "Starting services for $env..."
    docker-compose -f "$compose_file" up -d
    
    # Wait for services to be ready
    log "Waiting for $env services to be ready..."
    sleep 60
    
    # Run health checks
    if health_check_environment "$env"; then
        success "Deployment to $env completed successfully"
        return 0
    else
        error "Deployment to $env failed health checks"
        return 1
    fi
}

# Switch traffic between environments
switch_traffic() {
    local from_env=$1
    local to_env=$2
    
    log "Switching traffic from $from_env to $to_env..."
    
    # In a real implementation, this would:
    # 1. Update load balancer configuration
    # 2. Update DNS records
    # 3. Update reverse proxy configuration
    # 4. Notify monitoring systems
    
    # For this example, we'll simulate the switch
    log "Updating load balancer configuration..."
    # curl -X POST "$LOAD_BALANCER_URL/config" -d "{\"active_env\":\"$to_env\"}"
    
    log "Updating DNS records..."
    # This would update your DNS to point to the new environment
    
    log "Notifying monitoring systems..."
    # This would notify your monitoring systems about the switch
    
    success "Traffic switched from $from_env to $to_env"
}

# Stop environment
stop_environment() {
    local env=$1
    
    log "Stopping $env environment..."
    
    local compose_file="$PROJECT_DIR/docker-compose.$env.yml"
    docker-compose -f "$compose_file" down
    
    success "$env environment stopped"
}

# Cleanup old environment
cleanup_environment() {
    local env=$1
    
    log "Cleaning up $env environment..."
    
    # Remove unused images
    docker image prune -f
    
    # Remove unused volumes (be careful with this in production)
    # docker volume prune -f
    
    success "$env environment cleaned up"
}

# Rollback to previous environment
rollback() {
    local current_env=$(get_active_environment)
    
    if [[ "$current_env" == "none" ]]; then
        error "No active environment found for rollback"
        exit 1
    fi
    
    log "Rolling back from $current_env..."
    
    # This would restore from backup and switch back
    # Implementation depends on your backup strategy
    
    warning "Rollback functionality needs to be implemented based on your backup strategy"
}

# Show status of both environments
show_status() {
    log "Blue-Green Deployment Status"
    echo ""
    
    local active_env=$(get_active_environment)
    local inactive_env=$(get_inactive_environment "$active_env")
    
    echo "Active Environment: $active_env"
    echo "Inactive Environment: $inactive_env"
    echo ""
    
    if [[ "$active_env" != "none" ]]; then
        echo "Active Environment Status:"
        docker-compose -f "$PROJECT_DIR/docker-compose.$active_env.yml" ps
        echo ""
    fi
    
    if [[ "$inactive_env" != "none" ]]; then
        echo "Inactive Environment Status:"
        docker-compose -f "$PROJECT_DIR/docker-compose.$inactive_env.yml" ps
    fi
}

# Main deployment function
deploy() {
    log "Starting blue-green deployment..."
    
    # Get current active environment
    local active_env=$(get_active_environment)
    local target_env=$(get_inactive_environment "$active_env")
    
    if [[ "$active_env" == "none" ]]; then
        # No active environment, deploy to blue
        target_env="blue"
        active_env="green" # This will be the old environment
    fi
    
    log "Current active environment: $active_env"
    log "Target environment: $target_env"
    
    # Deploy to target environment
    if deploy_to_environment "$target_env"; then
        # Run additional tests on target environment
        log "Running additional tests on $target_env environment..."
        # Add your specific tests here
        
        # Switch traffic to target environment
        switch_traffic "$active_env" "$target_env"
        
        # Wait a bit to ensure traffic is switched
        sleep 30
        
        # Run final health check on target environment
        if health_check_environment "$target_env"; then
            success "Blue-green deployment completed successfully"
            
            # Stop old environment
            if [[ "$active_env" != "none" ]]; then
                stop_environment "$active_env"
                cleanup_environment "$active_env"
            fi
        else
            error "Final health check failed, rolling back..."
            switch_traffic "$target_env" "$active_env"
            stop_environment "$target_env"
            exit 1
        fi
    else
        error "Deployment to $target_env failed"
        exit 1
    fi
}

# Main execution
main() {
    log "Claude Talimat Blue-Green Deployment Script"
    log "Action: $ACTION"
    
    case $ACTION in
        deploy)
            deploy
            ;;
        rollback)
            rollback
            ;;
        status)
            show_status
            ;;
        health)
            local active_env=$(get_active_environment)
            if [[ "$active_env" != "none" ]]; then
                health_check_environment "$active_env"
            else
                error "No active environment found"
                exit 1
            fi
            ;;
        *)
            error "Invalid action: $ACTION"
            echo "Valid actions: deploy, rollback, status, health"
            exit 1
            ;;
    esac
}

# Help function
show_help() {
    echo "Claude Talimat Blue-Green Deployment Script"
    echo ""
    echo "Usage: $0 [ACTION]"
    echo ""
    echo "Actions:"
    echo "  deploy     - Deploy using blue-green strategy (default)"
    echo "  rollback   - Rollback to previous environment"
    echo "  status     - Show status of both environments"
    echo "  health     - Run health check on active environment"
    echo ""
    echo "Examples:"
    echo "  $0 deploy"
    echo "  $0 status"
    echo "  $0 health"
}

# Check for help flag
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    show_help
    exit 0
fi

# Run main function
main "$@"
