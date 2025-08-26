#!/bin/bash

# =============================================================================
# CLAUDE TALİMAT İŞ GÜVENLİĞİ YÖNETİM SİSTEMİ - CRON BACKUP SCRIPT
# =============================================================================

# This script is designed to be run by cron for automatic backups
# Add to crontab: 0 2 * * * /path/to/this/script/cron-backup.sh

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
LOG_FILE="$PROJECT_DIR/logs/backup-cron.log"
BACKUP_LOG_FILE="$PROJECT_DIR/logs/backup.log"

# Create log directory if it doesn't exist
mkdir -p "$(dirname "$LOG_FILE")"

# Function to log messages
log_message() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $1" | tee -a "$LOG_FILE"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        log_message "ERROR: Docker is not running"
        exit 1
    fi
}

# Function to check if services are running
check_services() {
    if ! docker-compose -f "$PROJECT_DIR/docker-compose.prod.yml" ps | grep -q "Up"; then
        log_message "ERROR: Production services are not running"
        exit 1
    fi
}

# Function to run backup
run_backup() {
    log_message "Starting scheduled backup..."
    
    cd "$PROJECT_DIR"
    
    # Run backup using docker-compose
    if docker-compose -f docker-compose.prod.yml --profile backup run --rm backup > "$BACKUP_LOG_FILE" 2>&1; then
        log_message "Backup completed successfully"
        
        # Get backup file info
        local backup_file=$(find backups -name "backup_*.tar.gz" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)
        if [ -n "$backup_file" ]; then
            local backup_size=$(du -h "$backup_file" | cut -f1)
            log_message "Backup file: $backup_file (Size: $backup_size)"
        fi
    else
        log_message "ERROR: Backup failed"
        log_message "Check backup log: $BACKUP_LOG_FILE"
        exit 1
    fi
}

# Function to cleanup old logs
cleanup_logs() {
    log_message "Cleaning up old log files..."
    
    # Keep only last 30 days of logs
    find "$PROJECT_DIR/logs" -name "*.log" -type f -mtime +30 -delete 2>/dev/null || true
    
    log_message "Log cleanup completed"
}

# Function to send notification (if configured)
send_notification() {
    # This function can be extended to send notifications via email, Slack, etc.
    # For now, just log the notification
    log_message "Backup notification would be sent here"
}

# Main execution
main() {
    log_message "=== Starting scheduled backup job ==="
    
    # Check prerequisites
    check_docker
    check_services
    
    # Run backup
    run_backup
    
    # Cleanup old logs
    cleanup_logs
    
    # Send notification
    send_notification
    
    log_message "=== Backup job completed successfully ==="
}

# Run main function
main "$@"
