#!/bin/bash

# =============================================================================
# CLAUDE TALİMAT AUTO-UPDATE SERVICE SETUP
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SERVICE_NAME="claude-talimat-auto-update"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
TIMER_FILE="/etc/systemd/system/${SERVICE_NAME}.timer"
CRON_FILE="/etc/cron.d/${SERVICE_NAME}"

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

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

# Create systemd service
create_systemd_service() {
    log_info "Creating systemd service..."
    
    cat > "$SERVICE_FILE" << EOF
[Unit]
Description=Claude Talimat Automatic Update Service
After=network.target docker.service
Requires=docker.service

[Service]
Type=oneshot
User=root
Group=root
WorkingDirectory=$PROJECT_ROOT
ExecStart=$PROJECT_ROOT/scripts/auto-update.sh
StandardOutput=journal
StandardError=journal
SyslogIdentifier=claude-talimat-auto-update

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$PROJECT_ROOT

# Resource limits
MemoryLimit=512M
CPUQuota=50%

[Install]
WantedBy=multi-user.target
EOF

    log_success "Systemd service created"
}

# Create systemd timer
create_systemd_timer() {
    log_info "Creating systemd timer..."
    
    cat > "$TIMER_FILE" << EOF
[Unit]
Description=Run Claude Talimat Auto-Update Weekly
Requires=${SERVICE_NAME}.service

[Timer]
OnCalendar=weekly
Persistent=true
RandomizedDelaySec=3600

[Install]
WantedBy=timers.target
EOF

    log_success "Systemd timer created"
}

# Create cron job
create_cron_job() {
    log_info "Creating cron job..."
    
    cat > "$CRON_FILE" << EOF
# Claude Talimat Automatic Update Service
# Runs every Sunday at 3:00 AM
0 3 * * 0 root $PROJECT_ROOT/scripts/auto-update.sh >> $PROJECT_ROOT/logs/auto-update-cron.log 2>&1

# Health check every hour
0 * * * * root $PROJECT_ROOT/scripts/health-check.sh >> $PROJECT_ROOT/logs/health-check.log 2>&1
EOF

    chmod 644 "$CRON_FILE"
    log_success "Cron job created"
}

# Create health check script
create_health_check_script() {
    log_info "Creating health check script..."
    
    cat > "$PROJECT_ROOT/scripts/health-check.sh" << 'EOF'
#!/bin/bash

# Health check script for Claude Talimat
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_FILE="$PROJECT_ROOT/logs/health-check.log"

# Log function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') [HEALTH] $1" >> "$LOG_FILE"
}

# Check if services are running
check_services() {
    cd "$PROJECT_ROOT"
    
    # Check Docker containers
    if ! docker-compose ps | grep -q "Up"; then
        log "ERROR: Some services are not running"
        return 1
    fi
    
    # Check frontend
    if ! curl -f -s http://localhost:8080 > /dev/null 2>&1; then
        log "ERROR: Frontend is not accessible"
        return 1
    fi
    
    # Check auth service
    if ! curl -f -s http://localhost:8004/health > /dev/null 2>&1; then
        log "ERROR: Auth service is not healthy"
        return 1
    fi
    
    log "INFO: All services are healthy"
    return 0
}

# Main health check
if ! check_services; then
    log "ERROR: Health check failed, attempting restart"
    cd "$PROJECT_ROOT"
    docker-compose restart
    sleep 30
    
    if check_services; then
        log "INFO: Services recovered after restart"
    else
        log "ERROR: Services failed to recover"
        # Send notification here if configured
    fi
fi
EOF

    chmod +x "$PROJECT_ROOT/scripts/health-check.sh"
    log_success "Health check script created"
}

# Enable and start services
enable_services() {
    log_info "Enabling and starting services..."
    
    # Reload systemd
    systemctl daemon-reload
    
    # Enable and start timer
    systemctl enable "${SERVICE_NAME}.timer"
    systemctl start "${SERVICE_NAME}.timer"
    
    # Enable cron service
    systemctl enable cron
    
    log_success "Services enabled and started"
}

# Show status
show_status() {
    log_info "Service status:"
    
    echo -e "\n${BLUE}Systemd Timer Status:${NC}"
    systemctl status "${SERVICE_NAME}.timer" --no-pager
    
    echo -e "\n${BLUE}Next Run Time:${NC}"
    systemctl list-timers "${SERVICE_NAME}.timer" --no-pager
    
    echo -e "\n${BLUE}Cron Status:${NC}"
    systemctl status cron --no-pager
    
    echo -e "\n${BLUE}Recent Logs:${NC}"
    journalctl -u "${SERVICE_NAME}.service" --no-pager -n 10
}

# Show management commands
show_management_commands() {
    echo -e "\n${GREEN}Management Commands:${NC}"
    echo "• Check service status: systemctl status ${SERVICE_NAME}.timer"
    echo "• View logs: journalctl -u ${SERVICE_NAME}.service -f"
    echo "• Manual update: $PROJECT_ROOT/scripts/auto-update.sh --force"
    echo "• Interactive manager: $PROJECT_ROOT/scripts/update-manager.sh"
    echo "• Disable auto-updates: systemctl disable ${SERVICE_NAME}.timer"
    echo "• Enable auto-updates: systemctl enable ${SERVICE_NAME}.timer"
    echo "• Stop auto-updates: systemctl stop ${SERVICE_NAME}.timer"
    echo "• Start auto-updates: systemctl start ${SERVICE_NAME}.timer"
}

# Main setup function
main() {
    echo -e "${BLUE}Claude Talimat Auto-Update Service Setup${NC}"
    echo "=============================================="
    
    check_root
    create_systemd_service
    create_systemd_timer
    create_cron_job
    create_health_check_script
    enable_services
    show_status
    show_management_commands
    
    log_success "Auto-update service setup completed!"
    echo -e "\n${GREEN}Auto-updates are now configured to run weekly on Sundays at 3:00 AM${NC}"
}

# Show help
show_help() {
    echo "Claude Talimat Auto-Update Service Setup"
    echo "========================================"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --help    Show this help message"
    echo ""
    echo "This script sets up automatic updates for the Claude Talimat system."
    echo "It creates systemd services, timers, and cron jobs for automated maintenance."
    echo ""
    echo "Requirements:"
    echo "  - Must be run as root (use sudo)"
    echo "  - systemd must be available"
    echo "  - Docker and Docker Compose must be installed"
    echo ""
}

# Parse arguments
case "${1:-}" in
    --help)
        show_help
        exit 0
        ;;
    "")
        main
        ;;
    *)
        echo "Unknown option: $1"
        show_help
        exit 1
        ;;
esac
