#!/bin/bash

# =============================================================================
# CLAUDE TALİMAT İŞ GÜVENLİĞİ YÖNETİM SİSTEMİ - AUTOMATIC UPDATE SYSTEM
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$PROJECT_ROOT/logs/auto-update.log"
BACKUP_DIR="$PROJECT_ROOT/backups"
CONFIG_FILE="$PROJECT_ROOT/auto-update-config.json"
LOCK_FILE="/tmp/claude-talimat-auto-update.lock"

# Default configuration
DEFAULT_CONFIG='{
  "enabled": true,
  "updateInterval": "weekly",
  "backupBeforeUpdate": true,
  "notifyOnUpdate": true,
  "notifyOnError": true,
  "maxBackups": 10,
  "services": {
    "frontend": {
      "enabled": true,
      "updateDependencies": true,
      "rebuildImage": true
    },
    "auth-service": {
      "enabled": true,
      "updateDependencies": true,
      "rebuildImage": true
    },
    "analytics-service": {
      "enabled": true,
      "updateDependencies": true,
      "rebuildImage": true
    },
    "instruction-service": {
      "enabled": true,
      "updateDependencies": true,
      "rebuildImage": true
    },
    "ai-service": {
      "enabled": true,
      "updateDependencies": true,
      "rebuildImage": true
    }
  },
  "system": {
    "updatePackages": false,
    "updateDocker": true,
    "cleanupOldImages": true
  },
  "notifications": {
    "email": {
      "enabled": false,
      "recipients": []
    },
    "webhook": {
      "enabled": false,
      "url": ""
    }
  }
}'

# Logging functions
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}" | tee -a "$LOG_FILE"
}

log_info() {
    log "INFO" "${BLUE}$*${NC}"
}

log_success() {
    log "SUCCESS" "${GREEN}$*${NC}"
}

log_warning() {
    log "WARNING" "${YELLOW}$*${NC}"
}

log_error() {
    log "ERROR" "${RED}$*${NC}"
}

# Check if script is already running
check_lock() {
    if [ -f "$LOCK_FILE" ]; then
        local pid=$(cat "$LOCK_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            log_error "Auto-update is already running (PID: $pid)"
            exit 1
        else
            rm -f "$LOCK_FILE"
        fi
    fi
    echo $$ > "$LOCK_FILE"
}

# Cleanup function
cleanup() {
    rm -f "$LOCK_FILE"
    log_info "Cleanup completed"
}

# Set trap for cleanup
trap cleanup EXIT

# Load configuration
load_config() {
    if [ ! -f "$CONFIG_FILE" ]; then
        log_info "Creating default configuration file..."
        echo "$DEFAULT_CONFIG" > "$CONFIG_FILE"
    fi
    
    # Load configuration using jq if available, otherwise use basic parsing
    if command -v jq > /dev/null 2>&1; then
        ENABLED=$(jq -r '.enabled' "$CONFIG_FILE")
        UPDATE_INTERVAL=$(jq -r '.updateInterval' "$CONFIG_FILE")
        BACKUP_BEFORE_UPDATE=$(jq -r '.backupBeforeUpdate' "$CONFIG_FILE")
        NOTIFY_ON_UPDATE=$(jq -r '.notifyOnUpdate' "$CONFIG_FILE")
        NOTIFY_ON_ERROR=$(jq -r '.notifyOnError' "$CONFIG_FILE")
        MAX_BACKUPS=$(jq -r '.maxBackups' "$CONFIG_FILE")
    else
        # Basic parsing without jq
        ENABLED=$(grep -o '"enabled": *true' "$CONFIG_FILE" > /dev/null && echo "true" || echo "false")
        UPDATE_INTERVAL="weekly"
        BACKUP_BEFORE_UPDATE="true"
        NOTIFY_ON_UPDATE="true"
        NOTIFY_ON_ERROR="true"
        MAX_BACKUPS="10"
    fi
}

# Check if update should run based on interval
should_update() {
    local last_update_file="$PROJECT_ROOT/.last-update"
    local current_time=$(date +%s)
    
    if [ ! -f "$last_update_file" ]; then
        echo "$current_time" > "$last_update_file"
        return 0
    fi
    
    local last_update=$(cat "$last_update_file")
    local time_diff=$((current_time - last_update))
    
    case "$UPDATE_INTERVAL" in
        "daily")
            [ $time_diff -ge 86400 ] && return 0
            ;;
        "weekly")
            [ $time_diff -ge 604800 ] && return 0
            ;;
        "monthly")
            [ $time_diff -ge 2592000 ] && return 0
            ;;
        "always")
            return 0
            ;;
        *)
            return 1
            ;;
    esac
    
    return 1
}

# Create backup
create_backup() {
    if [ "$BACKUP_BEFORE_UPDATE" = "true" ]; then
        log_info "Creating backup before update..."
        
        local backup_timestamp=$(date +"%Y%m%d_%H%M%S")
        local backup_path="$BACKUP_DIR/auto-update-backup_$backup_timestamp"
        
        mkdir -p "$backup_path"
        
        # Backup database
        if docker ps | grep -q "claude-postgres\|claude-talimat-postgres"; then
            log_info "Backing up database..."
            local db_container=$(docker ps --format "table {{.Names}}" | grep -E "(claude-postgres|claude-talimat-postgres)" | head -1)
            docker exec "$db_container" pg_dump -U safety_admin safety_production > "$backup_path/database.sql" 2>/dev/null || \
            docker exec "$db_container" pg_dump -U claude_talimat claude_talimat > "$backup_path/database.sql" 2>/dev/null || \
            log_warning "Could not backup database"
        fi
        
        # Backup Redis data
        if docker ps | grep -q "claude-redis\|claude-talimat-redis"; then
            log_info "Backing up Redis data..."
            local redis_container=$(docker ps --format "table {{.Names}}" | grep -E "(claude-redis|claude-talimat-redis)" | head -1)
            docker exec "$redis_container" redis-cli --rdb /data/dump.rdb > /dev/null 2>&1 || log_warning "Could not backup Redis data"
            docker cp "$redis_container:/data/dump.rdb" "$backup_path/redis.rdb" 2>/dev/null || log_warning "Could not copy Redis dump"
        fi
        
        # Backup application data
        if [ -d "$PROJECT_ROOT/storage" ]; then
            cp -r "$PROJECT_ROOT/storage" "$backup_path/"
        fi
        
        # Backup configuration files
        cp -r "$PROJECT_ROOT"/*.yml "$PROJECT_ROOT"/*.json "$PROJECT_ROOT"/*.env* "$backup_path/" 2>/dev/null || true
        
        log_success "Backup created: $backup_path"
        
        # Cleanup old backups
        cleanup_old_backups
    fi
}

# Cleanup old backups
cleanup_old_backups() {
    log_info "Cleaning up old backups..."
    
    local backup_count=$(find "$BACKUP_DIR" -name "auto-update-backup_*" -type d | wc -l)
    
    if [ "$backup_count" -gt "$MAX_BACKUPS" ]; then
        local to_remove=$((backup_count - MAX_BACKUPS))
        find "$BACKUP_DIR" -name "auto-update-backup_*" -type d -printf '%T@ %p\n' | sort -n | head -n "$to_remove" | cut -d' ' -f2- | xargs rm -rf
        log_info "Removed $to_remove old backups"
    fi
}

# Update frontend dependencies
update_frontend() {
    log_info "Updating frontend dependencies..."
    
    cd "$PROJECT_ROOT/frontend"
    
    # Update package.json dependencies
    if [ -f "package.json" ]; then
        npm update
        log_success "Frontend dependencies updated"
    else
        log_warning "No package.json found in frontend directory"
    fi
}

# Update backend service dependencies
update_backend_service() {
    local service_name="$1"
    local service_path="$PROJECT_ROOT/$service_name"
    
    if [ ! -d "$service_path" ]; then
        log_warning "Service directory not found: $service_path"
        return 1
    fi
    
    log_info "Updating $service_name dependencies..."
    
    cd "$service_path"
    
    case "$service_name" in
        "ai-service"|"instruction-service")
            if [ -f "deno.json" ]; then
                deno cache --reload deno.json
                log_success "$service_name dependencies updated"
            else
                log_warning "No deno.json found for $service_name"
            fi
            ;;
        "services/analytics-service"|"services/document-service")
            if [ -f "requirements.txt" ]; then
                pip install -r requirements.txt --upgrade
                log_success "$service_name dependencies updated"
            else
                log_warning "No requirements.txt found for $service_name"
            fi
            ;;
        "services/notification-service")
            if [ -f "go.mod" ]; then
                go get -u ./...
                go mod tidy
                log_success "$service_name dependencies updated"
            else
                log_warning "No go.mod found for $service_name"
            fi
            ;;
    esac
}

# Update Docker images
update_docker_images() {
    log_info "Updating Docker images..."
    
    cd "$PROJECT_ROOT"
    
    # Pull latest base images
    docker pull postgres:16-alpine
    docker pull redis:7.4-alpine
    docker pull nginx:1.25-alpine
    
    # Rebuild application images
    docker-compose build --no-cache
    
    log_success "Docker images updated"
}

# Update system packages (Raspberry Pi)
update_system_packages() {
    if [ "$UPDATE_SYSTEM_PACKAGES" = "true" ]; then
        log_info "Updating system packages..."
        
        # Update package lists
        sudo apt-get update
        
        # Upgrade packages
        sudo apt-get upgrade -y
        
        # Clean up
        sudo apt-get autoremove -y
        sudo apt-get autoclean
        
        log_success "System packages updated"
    fi
}

# Update Docker itself
update_docker() {
    if [ "$UPDATE_DOCKER" = "true" ]; then
        log_info "Updating Docker..."
        
        # Get latest Docker installation script
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        rm get-docker.sh
        
        log_success "Docker updated"
    fi
}

# Cleanup old Docker images
cleanup_docker_images() {
    if [ "$CLEANUP_OLD_IMAGES" = "true" ]; then
        log_info "Cleaning up old Docker images..."
        
        # Remove unused images
        docker image prune -f
        
        # Remove unused containers
        docker container prune -f
        
        # Remove unused volumes
        docker volume prune -f
        
        # Remove unused networks
        docker network prune -f
        
        log_success "Docker cleanup completed"
    fi
}

# Restart services
restart_services() {
    log_info "Restarting services..."
    
    cd "$PROJECT_ROOT"
    
    # Stop services
    docker-compose down
    
    # Start services
    docker-compose up -d
    
    # Wait for services to be ready
    sleep 30
    
    log_success "Services restarted"
}

# Health check
health_check() {
    log_info "Performing health check..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s http://localhost:8080/health > /dev/null 2>&1; then
            log_success "Health check passed"
            return 0
        fi
        
        log_info "Health check attempt $attempt/$max_attempts"
        sleep 10
        attempt=$((attempt + 1))
    done
    
    log_error "Health check failed"
    return 1
}

# Send notification
send_notification() {
    local message="$1"
    local type="$2" # "success", "error", "info"
    
    if [ "$NOTIFY_ON_UPDATE" = "true" ] && [ "$type" = "success" ]; then
        # Send success notification
        log_info "Sending success notification: $message"
    elif [ "$NOTIFY_ON_ERROR" = "true" ] && [ "$type" = "error" ]; then
        # Send error notification
        log_info "Sending error notification: $message"
    fi
    
    # Webhook notification
    if [ "$WEBHOOK_ENABLED" = "true" ] && [ -n "$WEBHOOK_URL" ]; then
        curl -X POST "$WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"message\":\"$message\",\"type\":\"$type\",\"timestamp\":\"$(date -Iseconds)\"}" \
            > /dev/null 2>&1 || log_warning "Failed to send webhook notification"
    fi
}

# Rollback function
rollback() {
    log_error "Update failed, attempting rollback..."
    
    # Find latest backup
    local latest_backup=$(find "$BACKUP_DIR" -name "auto-update-backup_*" -type d | sort | tail -1)
    
    if [ -n "$latest_backup" ]; then
        log_info "Rolling back to: $latest_backup"
        
        # Restore database
        if [ -f "$latest_backup/database.sql" ]; then
            local db_container=$(docker ps --format "table {{.Names}}" | grep -E "(claude-postgres|claude-talimat-postgres)" | head -1)
            if [ -n "$db_container" ]; then
                docker exec -i "$db_container" psql -U safety_admin safety_production < "$latest_backup/database.sql" 2>/dev/null || \
                docker exec -i "$db_container" psql -U claude_talimat claude_talimat < "$latest_backup/database.sql" 2>/dev/null || \
                log_warning "Could not restore database"
            fi
        fi
        
        # Restore Redis data
        if [ -f "$latest_backup/redis.rdb" ]; then
            local redis_container=$(docker ps --format "table {{.Names}}" | grep -E "(claude-redis|claude-talimat-redis)" | head -1)
            if [ -n "$redis_container" ]; then
                docker cp "$latest_backup/redis.rdb" "$redis_container:/data/dump.rdb" 2>/dev/null || log_warning "Could not restore Redis data"
            fi
        fi
        
        # Restart services
        restart_services
        
        log_success "Rollback completed"
    else
        log_error "No backup found for rollback"
    fi
}

# Main update function
run_update() {
    log_info "Starting automatic update process..."
    
    # Load configuration
    load_config
    
    # Check if updates are enabled
    if [ "$ENABLED" != "true" ]; then
        log_info "Automatic updates are disabled"
        exit 0
    fi
    
    # Check if update should run
    if ! should_update; then
        log_info "Update not needed based on interval setting"
        exit 0
    fi
    
    # Create backup
    create_backup
    
    # Update frontend
    update_frontend
    
    # Update backend services
    update_backend_service "ai-service"
    update_backend_service "instruction-service"
    update_backend_service "services/analytics-service"
    update_backend_service "services/document-service"
    update_backend_service "services/notification-service"
    
    # Update Docker images
    update_docker_images
    
    # Update system packages
    update_system_packages
    
    # Update Docker
    update_docker
    
    # Cleanup old images
    cleanup_docker_images
    
    # Restart services
    restart_services
    
    # Health check
    if health_check; then
        # Update last update timestamp
        echo "$(date +%s)" > "$PROJECT_ROOT/.last-update"
        
        log_success "Automatic update completed successfully!"
        send_notification "Claude Talimat system updated successfully" "success"
    else
        log_error "Health check failed after update"
        rollback
        send_notification "Claude Talimat system update failed and was rolled back" "error"
        exit 1
    fi
}

# Show help
show_help() {
    echo "Claude Talimat Automatic Update System"
    echo "======================================"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --force          Force update regardless of interval"
    echo "  --config         Show current configuration"
    echo "  --test           Test configuration without running update"
    echo "  --help           Show this help message"
    echo ""
    echo "Configuration file: $CONFIG_FILE"
    echo "Log file: $LOG_FILE"
    echo ""
}

# Show configuration
show_config() {
    if [ -f "$CONFIG_FILE" ]; then
        echo "Current configuration:"
        cat "$CONFIG_FILE" | jq . 2>/dev/null || cat "$CONFIG_FILE"
    else
        echo "No configuration file found. Run the script once to create default configuration."
    fi
}

# Test configuration
test_config() {
    log_info "Testing configuration..."
    
    load_config
    
    echo "Configuration loaded successfully:"
    echo "  Enabled: $ENABLED"
    echo "  Update Interval: $UPDATE_INTERVAL"
    echo "  Backup Before Update: $BACKUP_BEFORE_UPDATE"
    echo "  Max Backups: $MAX_BACKUPS"
    echo ""
    
    # Test Docker
    if command -v docker > /dev/null 2>&1; then
        echo "✓ Docker is available"
    else
        echo "✗ Docker is not available"
    fi
    
    # Test Docker Compose
    if command -v docker-compose > /dev/null 2>&1; then
        echo "✓ Docker Compose is available"
    else
        echo "✗ Docker Compose is not available"
    fi
    
    # Test required directories
    for dir in "$PROJECT_ROOT/frontend" "$PROJECT_ROOT/ai-service" "$PROJECT_ROOT/instruction-service"; do
        if [ -d "$dir" ]; then
            echo "✓ Directory exists: $dir"
        else
            echo "✗ Directory missing: $dir"
        fi
    done
    
    log_success "Configuration test completed"
}

# Main function
main() {
    case "${1:-}" in
        --force)
            FORCE_UPDATE=true
            run_update
            ;;
        --config)
            show_config
            ;;
        --test)
            test_config
            ;;
        --help)
            show_help
            ;;
        "")
            check_lock
            run_update
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
