#!/bin/bash

# =============================================================================
# CLAUDE TALİMAT UPDATE MONITOR - MONITORING AND NOTIFICATIONS
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
CONFIG_FILE="$PROJECT_ROOT/auto-update-config.json"
LOG_FILE="$PROJECT_ROOT/logs/update-monitor.log"
STATUS_FILE="$PROJECT_ROOT/.update-status"

# Load configuration
load_config() {
    if [ -f "$CONFIG_FILE" ]; then
        if command -v jq > /dev/null 2>&1; then
            EMAIL_ENABLED=$(jq -r '.notifications.email.enabled' "$CONFIG_FILE")
            EMAIL_RECIPIENTS=$(jq -r '.notifications.email.recipients[]' "$CONFIG_FILE" 2>/dev/null | tr '\n' ' ')
            WEBHOOK_ENABLED=$(jq -r '.notifications.webhook.enabled' "$CONFIG_FILE")
            WEBHOOK_URL=$(jq -r '.notifications.webhook.url' "$CONFIG_FILE")
        else
            EMAIL_ENABLED="false"
            EMAIL_RECIPIENTS=""
            WEBHOOK_ENABLED="false"
            WEBHOOK_URL=""
        fi
    else
        EMAIL_ENABLED="false"
        EMAIL_RECIPIENTS=""
        WEBHOOK_ENABLED="false"
        WEBHOOK_URL=""
    fi
}

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

# Send email notification
send_email() {
    local subject="$1"
    local body="$2"
    
    if [ "$EMAIL_ENABLED" = "true" ] && [ -n "$EMAIL_RECIPIENTS" ]; then
        for recipient in $EMAIL_RECIPIENTS; do
            echo "$body" | mail -s "$subject" "$recipient" 2>/dev/null || log_warning "Failed to send email to $recipient"
        done
        log_info "Email notification sent to: $EMAIL_RECIPIENTS"
    fi
}

# Send webhook notification
send_webhook() {
    local message="$1"
    local type="$2"
    
    if [ "$WEBHOOK_ENABLED" = "true" ] && [ -n "$WEBHOOK_URL" ]; then
        local payload=$(cat << EOF
{
    "text": "$message",
    "type": "$type",
    "timestamp": "$(date -Iseconds)",
    "system": "Claude Talimat",
    "version": "1.0.0"
}
EOF
        )
        
        curl -X POST "$WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "$payload" \
            --connect-timeout 10 \
            --max-time 30 \
            > /dev/null 2>&1 || log_warning "Failed to send webhook notification"
        
        log_info "Webhook notification sent"
    fi
}

# Send notification
send_notification() {
    local message="$1"
    local type="$2"
    local subject="$3"
    
    log_info "Sending notification: $message"
    
    # Send email
    send_email "$subject" "$message"
    
    # Send webhook
    send_webhook "$message" "$type"
}

# Check system health
check_system_health() {
    local health_status="healthy"
    local issues=()
    
    # Check Docker containers
    if ! docker ps | grep -q "claude"; then
        health_status="unhealthy"
        issues+=("No Claude containers running")
    fi
    
    # Check disk space
    local disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$disk_usage" -gt 90 ]; then
        health_status="unhealthy"
        issues+=("Disk usage is ${disk_usage}%")
    fi
    
    # Check memory usage
    local memory_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    if [ "$memory_usage" -gt 90 ]; then
        health_status="unhealthy"
        issues+=("Memory usage is ${memory_usage}%")
    fi
    
    # Check service endpoints
    if ! curl -f -s http://localhost:8080 > /dev/null 2>&1; then
        health_status="unhealthy"
        issues+=("Frontend not accessible")
    fi
    
    echo "$health_status"
    if [ ${#issues[@]} -gt 0 ]; then
        printf '%s\n' "${issues[@]}"
    fi
}

# Monitor update process
monitor_update() {
    local update_pid="$1"
    local start_time=$(date +%s)
    local max_duration=3600 # 1 hour
    
    log_info "Monitoring update process (PID: $update_pid)"
    
    while kill -0 "$update_pid" 2>/dev/null; do
        local current_time=$(date +%s)
        local elapsed=$((current_time - start_time))
        
        if [ $elapsed -gt $max_duration ]; then
            log_error "Update process exceeded maximum duration ($max_duration seconds)"
            kill -TERM "$update_pid" 2>/dev/null || true
            sleep 10
            kill -KILL "$update_pid" 2>/dev/null || true
            
            send_notification "Update process killed due to timeout" "error" "Claude Talimat Update Failed"
            return 1
        fi
        
        # Check system health during update
        local health_issues=$(check_system_health | tail -n +2)
        if [ -n "$health_issues" ]; then
            log_warning "Health issues detected during update: $health_issues"
        fi
        
        sleep 30
    done
    
    # Wait for process to complete
    wait "$update_pid"
    local exit_code=$?
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    if [ $exit_code -eq 0 ]; then
        log_success "Update completed successfully in ${duration} seconds"
        send_notification "Claude Talimat system updated successfully in ${duration} seconds" "success" "Claude Talimat Update Success"
        echo "success" > "$STATUS_FILE"
    else
        log_error "Update failed with exit code $exit_code after ${duration} seconds"
        send_notification "Claude Talimat system update failed with exit code $exit_code" "error" "Claude Talimat Update Failed"
        echo "failed" > "$STATUS_FILE"
    fi
    
    return $exit_code
}

# Check for available updates
check_updates_available() {
    local updates_available=false
    local update_info=()
    
    # Check frontend updates
    cd "$PROJECT_ROOT/frontend"
    if [ -f "package.json" ]; then
        local outdated=$(npm outdated --json 2>/dev/null | jq -r 'keys[]' 2>/dev/null | wc -l)
        if [ "$outdated" -gt 0 ]; then
            updates_available=true
            update_info+=("Frontend: $outdated packages")
        fi
    fi
    
    # Check backend services
    for service in ai-service instruction-service; do
        if [ -d "$PROJECT_ROOT/$service" ]; then
            cd "$PROJECT_ROOT/$service"
            if [ -f "deno.json" ]; then
                # Check for Deno updates (simplified)
                local cache_age=$(find . -name "deno.lock" -mtime +7 2>/dev/null | wc -l)
                if [ "$cache_age" -gt 0 ]; then
                    updates_available=true
                    update_info+=("$service: dependencies may be outdated")
                fi
            fi
        fi
    done
    
    # Check Python services
    for service in services/analytics-service services/document-service; do
        if [ -d "$PROJECT_ROOT/$service" ]; then
            cd "$PROJECT_ROOT/$service"
            if [ -f "requirements.txt" ]; then
                local outdated=$(pip list --outdated 2>/dev/null | wc -l)
                if [ "$outdated" -gt 1 ]; then
                    updates_available=true
                    update_info+=("$service: $((outdated-1)) packages")
                fi
            fi
        fi
    done
    
    # Check Go services
    for service in services/notification-service; do
        if [ -d "$PROJECT_ROOT/$service" ]; then
            cd "$PROJECT_ROOT/$service"
            if [ -f "go.mod" ]; then
                local outdated=$(go list -u -m all 2>/dev/null | grep -v "indirect" | wc -l)
                if [ "$outdated" -gt 0 ]; then
                    updates_available=true
                    update_info+=("$service: $outdated packages")
                fi
            fi
        fi
    done
    
    if [ "$updates_available" = "true" ]; then
        echo "true"
        printf '%s\n' "${update_info[@]}"
    else
        echo "false"
    fi
}

# Generate update report
generate_update_report() {
    local report_file="$PROJECT_ROOT/logs/update-report-$(date +%Y%m%d-%H%M%S).txt"
    
    {
        echo "Claude Talimat Update Report"
        echo "============================"
        echo "Generated: $(date)"
        echo ""
        
        echo "System Information:"
        echo "------------------"
        echo "OS: $(uname -s)"
        echo "Architecture: $(uname -m)"
        echo "Kernel: $(uname -r)"
        echo "Docker Version: $(docker --version 2>/dev/null || echo 'Not available')"
        echo "Docker Compose Version: $(docker-compose --version 2>/dev/null || echo 'Not available')"
        echo ""
        
        echo "Disk Usage:"
        echo "----------"
        df -h
        echo ""
        
        echo "Memory Usage:"
        echo "------------"
        free -h
        echo ""
        
        echo "Docker Containers:"
        echo "-----------------"
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        echo ""
        
        echo "Recent Updates:"
        echo "--------------"
        if [ -f "$PROJECT_ROOT/.last-update" ]; then
            local last_update=$(cat "$PROJECT_ROOT/.last-update")
            echo "Last update: $(date -d "@$last_update" 2>/dev/null || echo 'Unknown')"
        else
            echo "No update history found"
        fi
        echo ""
        
        echo "Available Updates:"
        echo "-----------------"
        check_updates_available | tail -n +2 || echo "No updates available"
        echo ""
        
        echo "Health Status:"
        echo "-------------"
        check_system_health
        echo ""
        
    } > "$report_file"
    
    log_info "Update report generated: $report_file"
    echo "$report_file"
}

# Send update report
send_update_report() {
    local report_file="$1"
    
    if [ "$EMAIL_ENABLED" = "true" ] && [ -n "$EMAIL_RECIPIENTS" ]; then
        for recipient in $EMAIL_RECIPIENTS; do
            mail -s "Claude Talimat Update Report" -a "$report_file" "$recipient" < /dev/null 2>/dev/null || log_warning "Failed to send report to $recipient"
        done
        log_info "Update report sent via email"
    fi
    
    if [ "$WEBHOOK_ENABLED" = "true" ] && [ -n "$WEBHOOK_URL" ]; then
        local report_content=$(cat "$report_file")
        send_webhook "Update Report Generated" "info"
        log_info "Update report notification sent via webhook"
    fi
}

# Main monitoring function
main() {
    local action="${1:-monitor}"
    
    # Load configuration
    load_config
    
    # Create logs directory
    mkdir -p "$(dirname "$LOG_FILE")"
    
    case "$action" in
        "monitor")
            if [ -n "$2" ]; then
                # Monitor specific process
                monitor_update "$2"
            else
                # General monitoring
                log_info "Starting update monitoring..."
                
                # Check for updates
                local updates_info=$(check_updates_available)
                if echo "$updates_info" | head -1 | grep -q "true"; then
                    log_info "Updates available:"
                    echo "$updates_info" | tail -n +2 | while read -r line; do
                        log_info "  - $line"
                    done
                    
                    send_notification "Updates available for Claude Talimat system" "info" "Claude Talimat Updates Available"
                else
                    log_info "No updates available"
                fi
                
                # Check system health
                local health_issues=$(check_system_health | tail -n +2)
                if [ -n "$health_issues" ]; then
                    log_warning "System health issues detected: $health_issues"
                    send_notification "System health issues detected: $health_issues" "warning" "Claude Talimat Health Alert"
                else
                    log_success "System health is good"
                fi
            fi
            ;;
        "report")
            local report_file=$(generate_update_report)
            send_update_report "$report_file"
            ;;
        "health")
            check_system_health
            ;;
        "updates")
            check_updates_available
            ;;
        *)
            echo "Usage: $0 {monitor|report|health|updates} [pid]"
            echo ""
            echo "Commands:"
            echo "  monitor [pid]  - Monitor update process or general system"
            echo "  report         - Generate and send update report"
            echo "  health         - Check system health"
            echo "  updates        - Check for available updates"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
