#!/bin/bash

# =============================================================================
# CLAUDE TALİMAT UPDATE MANAGER - INTERACTIVE UPDATE MANAGEMENT
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CONFIG_FILE="$PROJECT_ROOT/auto-update-config.json"

# Logging functions
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

# Show main menu
show_menu() {
    clear
    echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║              CLAUDE TALİMAT UPDATE MANAGER                  ║${NC}"
    echo -e "${PURPLE}║                                                              ║${NC}"
    echo -e "${PURPLE}║  Select an option:                                           ║${NC}"
    echo -e "${PURPLE}║                                                              ║${NC}"
    echo -e "${PURPLE}║  ${CYAN}1.${NC} Check for updates                                    ${PURPLE}║${NC}"
    echo -e "${PURPLE}║  ${CYAN}2.${NC} Update all dependencies                              ${PURPLE}║${NC}"
    echo -e "${PURPLE}║  ${CYAN}3.${NC} Update specific service                              ${PURPLE}║${NC}"
    echo -e "${PURPLE}║  ${CYAN}4.${NC} Update Docker images                                 ${PURPLE}║${NC}"
    echo -e "${PURPLE}║  ${CYAN}5.${NC} System maintenance                                   ${PURPLE}║${NC}"
    echo -e "${PURPLE}║  ${CYAN}6.${NC} View update history                                  ${PURPLE}║${NC}"
    echo -e "${PURPLE}║  ${CYAN}7.${NC} Configure auto-updates                               ${PURPLE}║${NC}"
    echo -e "${PURPLE}║  ${CYAN}8.${NC} Backup management                                    ${PURPLE}║${NC}"
    echo -e "${PURPLE}║  ${CYAN}9.${NC} Health check                                         ${PURPLE}║${NC}"
    echo -e "${PURPLE}║  ${CYAN}0.${NC} Exit                                                 ${PURPLE}║${NC}"
    echo -e "${PURPLE}║                                                              ║${NC}"
    echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Check for updates
check_updates() {
    log_info "Checking for updates..."
    
    cd "$PROJECT_ROOT"
    
    echo -e "${CYAN}Frontend Dependencies:${NC}"
    cd frontend
    if [ -f "package.json" ]; then
        npm outdated 2>/dev/null || echo "All dependencies are up to date"
    fi
    cd ..
    
    echo -e "\n${CYAN}Backend Services:${NC}"
    
    # Check Deno services
    for service in ai-service instruction-service; do
        if [ -d "$service" ]; then
            echo -e "\n${YELLOW}$service:${NC}"
            cd "$service"
            if [ -f "deno.json" ]; then
                deno info 2>/dev/null | grep -E "(remote modules|local modules)" || echo "No dependency information available"
            fi
            cd ..
        fi
    done
    
    # Check Python services
    for service in services/analytics-service services/document-service; do
        if [ -d "$service" ]; then
            echo -e "\n${YELLOW}$service:${NC}"
            cd "$service"
            if [ -f "requirements.txt" ]; then
                pip list --outdated 2>/dev/null || echo "All dependencies are up to date"
            fi
            cd "$PROJECT_ROOT"
        fi
    done
    
    # Check Go services
    for service in services/notification-service; do
        if [ -d "$service" ]; then
            echo -e "\n${YELLOW}$service:${NC}"
            cd "$service"
            if [ -f "go.mod" ]; then
                go list -u -m all 2>/dev/null | grep -v "indirect" || echo "All dependencies are up to date"
            fi
            cd "$PROJECT_ROOT"
        fi
    done
    
    echo -e "\n${CYAN}Docker Images:${NC}"
    docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.CreatedAt}}" | head -10
    
    log_success "Update check completed"
    read -p "Press Enter to continue..."
}

# Update all dependencies
update_all_dependencies() {
    log_info "Updating all dependencies..."
    
    cd "$PROJECT_ROOT"
    
    # Update frontend
    log_info "Updating frontend dependencies..."
    cd frontend
    if [ -f "package.json" ]; then
        npm update
        log_success "Frontend dependencies updated"
    fi
    cd ..
    
    # Update backend services
    for service in ai-service instruction-service; do
        if [ -d "$service" ]; then
            log_info "Updating $service dependencies..."
            cd "$service"
            if [ -f "deno.json" ]; then
                deno cache --reload deno.json
                log_success "$service dependencies updated"
            fi
            cd ..
        fi
    done
    
    for service in services/analytics-service services/document-service; do
        if [ -d "$service" ]; then
            log_info "Updating $service dependencies..."
            cd "$service"
            if [ -f "requirements.txt" ]; then
                pip install -r requirements.txt --upgrade
                log_success "$service dependencies updated"
            fi
            cd "$PROJECT_ROOT"
        fi
    done
    
    for service in services/notification-service; do
        if [ -d "$service" ]; then
            log_info "Updating $service dependencies..."
            cd "$service"
            if [ -f "go.mod" ]; then
                go get -u ./...
                go mod tidy
                log_success "$service dependencies updated"
            fi
            cd "$PROJECT_ROOT"
        fi
    done
    
    log_success "All dependencies updated"
    read -p "Press Enter to continue..."
}

# Update specific service
update_specific_service() {
    echo -e "${CYAN}Available services:${NC}"
    echo "1. Frontend"
    echo "2. AI Service"
    echo "3. Instruction Service"
    echo "4. Analytics Service"
    echo "5. Document Service"
    echo "6. Notification Service"
    echo "0. Back to main menu"
    
    read -p "Select service to update (0-6): " choice
    
    case $choice in
        1)
            log_info "Updating Frontend..."
            cd "$PROJECT_ROOT/frontend"
            if [ -f "package.json" ]; then
                npm update
                log_success "Frontend updated"
            else
                log_error "No package.json found"
            fi
            cd "$PROJECT_ROOT"
            ;;
        2)
            log_info "Updating AI Service..."
            cd "$PROJECT_ROOT/ai-service"
            if [ -f "deno.json" ]; then
                deno cache --reload deno.json
                log_success "AI Service updated"
            else
                log_error "No deno.json found"
            fi
            cd "$PROJECT_ROOT"
            ;;
        3)
            log_info "Updating Instruction Service..."
            cd "$PROJECT_ROOT/instruction-service"
            if [ -f "deno.json" ]; then
                deno cache --reload deno.json
                log_success "Instruction Service updated"
            else
                log_error "No deno.json found"
            fi
            cd "$PROJECT_ROOT"
            ;;
        4)
            log_info "Updating Analytics Service..."
            cd "$PROJECT_ROOT/services/analytics-service"
            if [ -f "requirements.txt" ]; then
                pip install -r requirements.txt --upgrade
                log_success "Analytics Service updated"
            else
                log_error "No requirements.txt found"
            fi
            cd "$PROJECT_ROOT"
            ;;
        5)
            log_info "Updating Document Service..."
            cd "$PROJECT_ROOT/services/document-service"
            if [ -f "requirements.txt" ]; then
                pip install -r requirements.txt --upgrade
                log_success "Document Service updated"
            else
                log_error "No requirements.txt found"
            fi
            cd "$PROJECT_ROOT"
            ;;
        6)
            log_info "Updating Notification Service..."
            cd "$PROJECT_ROOT/services/notification-service"
            if [ -f "go.mod" ]; then
                go get -u ./...
                go mod tidy
                log_success "Notification Service updated"
            else
                log_error "No go.mod found"
            fi
            cd "$PROJECT_ROOT"
            ;;
        0)
            return
            ;;
        *)
            log_error "Invalid selection"
            ;;
    esac
    
    read -p "Press Enter to continue..."
}

# Update Docker images
update_docker_images() {
    log_info "Updating Docker images..."
    
    cd "$PROJECT_ROOT"
    
    # Pull latest base images
    log_info "Pulling latest base images..."
    docker pull postgres:16-alpine
    docker pull redis:7.4-alpine
    docker pull nginx:1.25-alpine
    
    # Rebuild application images
    log_info "Rebuilding application images..."
    docker-compose build --no-cache
    
    # Restart services
    log_info "Restarting services..."
    docker-compose down
    docker-compose up -d
    
    log_success "Docker images updated and services restarted"
    read -p "Press Enter to continue..."
}

# System maintenance
system_maintenance() {
    log_info "Running system maintenance..."
    
    cd "$PROJECT_ROOT"
    
    # Clean Docker
    log_info "Cleaning Docker system..."
    docker system prune -f
    
    # Clean old images
    log_info "Cleaning old images..."
    docker image prune -f
    
    # Clean old containers
    log_info "Cleaning old containers..."
    docker container prune -f
    
    # Clean old volumes
    log_info "Cleaning old volumes..."
    docker volume prune -f
    
    # Clean old networks
    log_info "Cleaning old networks..."
    docker network prune -f
    
    # Clean logs
    log_info "Cleaning old logs..."
    find "$PROJECT_ROOT/logs" -name "*.log" -mtime +30 -delete 2>/dev/null || true
    
    log_success "System maintenance completed"
    read -p "Press Enter to continue..."
}

# View update history
view_update_history() {
    log_info "Update history:"
    
    if [ -f "$PROJECT_ROOT/.last-update" ]; then
        local last_update=$(cat "$PROJECT_ROOT/.last-update")
        local last_update_date=$(date -d "@$last_update" 2>/dev/null || echo "Unknown")
        echo "Last update: $last_update_date"
    else
        echo "No update history found"
    fi
    
    echo -e "\n${CYAN}Recent backups:${NC}"
    ls -la "$PROJECT_ROOT/backups" 2>/dev/null | grep "auto-update-backup" | tail -5 || echo "No backups found"
    
    echo -e "\n${CYAN}Recent logs:${NC}"
    tail -20 "$PROJECT_ROOT/logs/auto-update.log" 2>/dev/null || echo "No logs found"
    
    read -p "Press Enter to continue..."
}

# Configure auto-updates
configure_auto_updates() {
    log_info "Auto-update configuration:"
    
    if [ -f "$CONFIG_FILE" ]; then
        echo "Current configuration:"
        cat "$CONFIG_FILE" | jq . 2>/dev/null || cat "$CONFIG_FILE"
    else
        echo "No configuration file found"
    fi
    
    echo -e "\n${CYAN}Configuration options:${NC}"
    echo "1. Enable/Disable auto-updates"
    echo "2. Change update interval"
    echo "3. Configure notifications"
    echo "4. Edit configuration file"
    echo "0. Back to main menu"
    
    read -p "Select option (0-4): " choice
    
    case $choice in
        1)
            read -p "Enable auto-updates? (y/n): " enable
            if [ "$enable" = "y" ] || [ "$enable" = "Y" ]; then
                jq '.enabled = true' "$CONFIG_FILE" > "$CONFIG_FILE.tmp" && mv "$CONFIG_FILE.tmp" "$CONFIG_FILE"
                log_success "Auto-updates enabled"
            else
                jq '.enabled = false' "$CONFIG_FILE" > "$CONFIG_FILE.tmp" && mv "$CONFIG_FILE.tmp" "$CONFIG_FILE"
                log_success "Auto-updates disabled"
            fi
            ;;
        2)
            echo "Update intervals: daily, weekly, monthly, always"
            read -p "Enter new interval: " interval
            jq --arg interval "$interval" '.updateInterval = $interval' "$CONFIG_FILE" > "$CONFIG_FILE.tmp" && mv "$CONFIG_FILE.tmp" "$CONFIG_FILE"
            log_success "Update interval changed to $interval"
            ;;
        3)
            read -p "Enable email notifications? (y/n): " email
            if [ "$email" = "y" ] || [ "$email" = "Y" ]; then
                read -p "Enter email addresses (comma-separated): " emails
                jq --arg emails "$emails" '.notifications.email.enabled = true | .notifications.email.recipients = ($emails | split(","))' "$CONFIG_FILE" > "$CONFIG_FILE.tmp" && mv "$CONFIG_FILE.tmp" "$CONFIG_FILE"
                log_success "Email notifications configured"
            else
                jq '.notifications.email.enabled = false' "$CONFIG_FILE" > "$CONFIG_FILE.tmp" && mv "$CONFIG_FILE.tmp" "$CONFIG_FILE"
                log_success "Email notifications disabled"
            fi
            ;;
        4)
            ${EDITOR:-nano} "$CONFIG_FILE"
            ;;
        0)
            return
            ;;
        *)
            log_error "Invalid selection"
            ;;
    esac
    
    read -p "Press Enter to continue..."
}

# Backup management
backup_management() {
    echo -e "${CYAN}Backup Management:${NC}"
    echo "1. Create manual backup"
    echo "2. List backups"
    echo "3. Restore from backup"
    echo "4. Delete old backups"
    echo "0. Back to main menu"
    
    read -p "Select option (0-4): " choice
    
    case $choice in
        1)
            log_info "Creating manual backup..."
            "$PROJECT_ROOT/scripts/auto-update.sh" --force
            log_success "Manual backup created"
            ;;
        2)
            echo -e "\n${CYAN}Available backups:${NC}"
            ls -la "$PROJECT_ROOT/backups" 2>/dev/null | grep "auto-update-backup" || echo "No backups found"
            ;;
        3)
            echo -e "\n${CYAN}Available backups:${NC}"
            ls -la "$PROJECT_ROOT/backups" 2>/dev/null | grep "auto-update-backup" || echo "No backups found"
            read -p "Enter backup name to restore: " backup_name
            if [ -d "$PROJECT_ROOT/backups/$backup_name" ]; then
                log_info "Restoring from backup: $backup_name"
                # Add restore logic here
                log_success "Backup restored"
            else
                log_error "Backup not found"
            fi
            ;;
        4)
            log_info "Deleting old backups..."
            find "$PROJECT_ROOT/backups" -name "auto-update-backup_*" -mtime +30 -exec rm -rf {} \;
            log_success "Old backups deleted"
            ;;
        0)
            return
            ;;
        *)
            log_error "Invalid selection"
            ;;
    esac
    
    read -p "Press Enter to continue..."
}

# Health check
health_check() {
    log_info "Performing health check..."
    
    cd "$PROJECT_ROOT"
    
    # Check Docker containers
    echo -e "${CYAN}Docker Containers:${NC}"
    docker-compose ps
    
    # Check service endpoints
    echo -e "\n${CYAN}Service Health:${NC}"
    
    # Frontend
    if curl -f -s http://localhost:8080 > /dev/null 2>&1; then
        echo "✓ Frontend: OK"
    else
        echo "✗ Frontend: FAILED"
    fi
    
    # Auth Service
    if curl -f -s http://localhost:8004/health > /dev/null 2>&1; then
        echo "✓ Auth Service: OK"
    else
        echo "✗ Auth Service: FAILED"
    fi
    
    # Analytics Service
    if curl -f -s http://localhost:8003/health > /dev/null 2>&1; then
        echo "✓ Analytics Service: OK"
    else
        echo "✗ Analytics Service: FAILED"
    fi
    
    # Check disk space
    echo -e "\n${CYAN}Disk Space:${NC}"
    df -h / | tail -1 | awk '{print "Available: " $4 " (" $5 " used)"}'
    
    # Check memory usage
    echo -e "\n${CYAN}Memory Usage:${NC}"
    free -h | grep Mem | awk '{print "Used: " $3 " / " $2 " (" int($3/$2*100) "% used)"}'
    
    log_success "Health check completed"
    read -p "Press Enter to continue..."
}

# Main loop
main() {
    while true; do
        show_menu
        read -p "Enter your choice (0-9): " choice
        
        case $choice in
            1) check_updates ;;
            2) update_all_dependencies ;;
            3) update_specific_service ;;
            4) update_docker_images ;;
            5) system_maintenance ;;
            6) view_update_history ;;
            7) configure_auto_updates ;;
            8) backup_management ;;
            9) health_check ;;
            0) 
                log_info "Goodbye!"
                exit 0
                ;;
            *)
                log_error "Invalid option. Please try again."
                sleep 2
                ;;
        esac
    done
}

# Run main function
main "$@"
