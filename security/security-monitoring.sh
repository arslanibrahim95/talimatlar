#!/bin/bash

# Claude Talimat Security Monitoring Script
# Real-time security monitoring and alerting

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
LOG_DIR="/home/igu/talimatlar/logs/security"
ALERT_EMAIL="admin@claude-talimat.com"
THRESHOLD_FAILED_LOGINS=5
THRESHOLD_REQUESTS_PER_MINUTE=100
THRESHOLD_ERROR_RATE=10

# Create log directory
mkdir -p "$LOG_DIR"

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_DIR/security-monitor.log"
}

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
    log "SUCCESS: $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    log "WARNING: $1"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    log "ERROR: $1"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
    log "INFO: $1"
}

# Function to send alert
send_alert() {
    local message="$1"
    local severity="$2"
    
    # Log the alert
    log "ALERT [$severity]: $message"
    
    # Send email alert (if configured)
    if [ -n "$ALERT_EMAIL" ]; then
        echo "Security Alert: $message" | mail -s "Claude Talimat Security Alert [$severity]" "$ALERT_EMAIL" 2>/dev/null || true
    fi
    
    # Send to system log
    logger -t "claude-security" "[$severity] $message"
}

# Monitor failed login attempts
monitor_failed_logins() {
    print_info "Monitoring failed login attempts..."
    
    local failed_logins=$(grep -c "Failed login" /var/log/auth.log 2>/dev/null || echo "0")
    local recent_failed=$(grep "Failed login" /var/log/auth.log 2>/dev/null | tail -10 | wc -l)
    
    if [ "$recent_failed" -gt "$THRESHOLD_FAILED_LOGINS" ]; then
        send_alert "High number of failed login attempts detected: $recent_failed" "HIGH"
    fi
    
    print_status "Failed login monitoring completed"
}

# Monitor HTTP requests
monitor_http_requests() {
    print_info "Monitoring HTTP requests..."
    
    if [ -f "/home/igu/talimatlar/logs/nginx/access.log" ]; then
        local requests_per_minute=$(tail -1000 /home/igu/talimatlar/logs/nginx/access.log | awk '{print $4}' | cut -d: -f1-2 | sort | uniq -c | tail -1 | awk '{print $1}')
        
        if [ "$requests_per_minute" -gt "$THRESHOLD_REQUESTS_PER_MINUTE" ]; then
            send_alert "High number of HTTP requests detected: $requests_per_minute per minute" "MEDIUM"
        fi
        
        # Check for suspicious patterns
        local suspicious_requests=$(grep -c "\.\./\.\./\.\./" /home/igu/talimatlar/logs/nginx/access.log 2>/dev/null || echo "0")
        if [ "$suspicious_requests" -gt "0" ]; then
            send_alert "Directory traversal attempts detected: $suspicious_requests" "HIGH"
        fi
    fi
    
    print_status "HTTP request monitoring completed"
}

# Monitor error rates
monitor_error_rates() {
    print_info "Monitoring error rates..."
    
    if [ -f "/home/igu/talimatlar/logs/nginx/access.log" ]; then
        local total_requests=$(tail -1000 /home/igu/talimatlar/logs/nginx/access.log | wc -l)
        local error_requests=$(tail -1000 /home/igu/talimatlar/logs/nginx/access.log | grep -E " [45][0-9][0-9] " | wc -l)
        
        if [ "$total_requests" -gt "0" ]; then
            local error_rate=$((error_requests * 100 / total_requests))
            
            if [ "$error_rate" -gt "$THRESHOLD_ERROR_RATE" ]; then
                send_alert "High error rate detected: $error_rate%" "MEDIUM"
            fi
        fi
    fi
    
    print_status "Error rate monitoring completed"
}

# Monitor system resources
monitor_system_resources() {
    print_info "Monitoring system resources..."
    
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
    local memory_usage=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
    local disk_usage=$(df / | tail -1 | awk '{print $5}' | cut -d'%' -f1)
    
    if [ "${cpu_usage%.*}" -gt "80" ]; then
        send_alert "High CPU usage detected: ${cpu_usage}%" "MEDIUM"
    fi
    
    if [ "$memory_usage" -gt "80" ]; then
        send_alert "High memory usage detected: ${memory_usage}%" "MEDIUM"
    fi
    
    if [ "$disk_usage" -gt "90" ]; then
        send_alert "High disk usage detected: ${disk_usage}%" "HIGH"
    fi
    
    print_status "System resource monitoring completed"
}

# Monitor Docker containers
monitor_docker_containers() {
    print_info "Monitoring Docker containers..."
    
    local running_containers=$(docker ps --format "table {{.Names}}" | tail -n +2 | wc -l)
    local total_containers=$(docker ps -a --format "table {{.Names}}" | tail -n +2 | wc -l)
    
    if [ "$running_containers" -lt "$total_containers" ]; then
        local stopped_containers=$((total_containers - running_containers))
        send_alert "Some Docker containers are stopped: $stopped_containers containers" "MEDIUM"
    fi
    
    # Check for containers with high resource usage
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" | tail -n +2 | while read container cpu mem; do
        cpu_num=$(echo "$cpu" | cut -d'%' -f1)
        if [ "${cpu_num%.*}" -gt "80" ]; then
            send_alert "Container $container has high CPU usage: $cpu" "MEDIUM"
        fi
    done
    
    print_status "Docker container monitoring completed"
}

# Monitor security logs
monitor_security_logs() {
    print_info "Monitoring security logs..."
    
    # Check for suspicious activities in system logs
    local suspicious_activities=$(grep -i -E "(hack|attack|exploit|malware|virus)" /var/log/syslog 2>/dev/null | wc -l)
    
    if [ "$suspicious_activities" -gt "0" ]; then
        send_alert "Suspicious activities detected in system logs: $suspicious_activities entries" "HIGH"
    fi
    
    # Check for privilege escalation attempts
    local privilege_escalation=$(grep -i -E "(sudo|su|root)" /var/log/auth.log 2>/dev/null | tail -10 | wc -l)
    
    if [ "$privilege_escalation" -gt "5" ]; then
        send_alert "Multiple privilege escalation attempts detected: $privilege_escalation" "HIGH"
    fi
    
    print_status "Security log monitoring completed"
}

# Generate security report
generate_security_report() {
    print_info "Generating security monitoring report..."
    
    local report_file="$LOG_DIR/security-report-$(date +%Y%m%d_%H%M%S).md"
    
    cat > "$report_file" << EOF
# 🔒 Claude Talimat Security Monitoring Report

**Generated:** $(date)
**Monitoring Period:** Last 24 hours

## 📊 System Status

### Resource Usage
- CPU Usage: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}')
- Memory Usage: $(free | grep Mem | awk '{printf "%.1f%%", $3/$2 * 100.0}')
- Disk Usage: $(df / | tail -1 | awk '{print $5}')

### Docker Containers
- Running: $(docker ps --format "table {{.Names}}" | tail -n +2 | wc -l)
- Total: $(docker ps -a --format "table {{.Names}}" | tail -n +2 | wc -l)

### Security Events
- Failed Logins: $(grep -c "Failed login" /var/log/auth.log 2>/dev/null || echo "0")
- HTTP Errors: $(grep -c " [45][0-9][0-9] " /home/igu/talimatlar/logs/nginx/access.log 2>/dev/null || echo "0")

## 🚨 Alerts Summary

$(grep "ALERT" "$LOG_DIR/security-monitor.log" 2>/dev/null | tail -10 || echo "No recent alerts")

## 📈 Recommendations

1. **Regular Updates:** Keep all packages and dependencies updated
2. **Monitoring:** Continue monitoring system resources and logs
3. **Backups:** Ensure regular backups are being performed
4. **Access Control:** Review and audit user access regularly

---
*Report generated by Claude Talimat Security Monitor*
EOF

    print_status "Security report generated: $report_file"
}

# Main monitoring function
main() {
    print_info "Starting security monitoring..."
    print_info "Log directory: $LOG_DIR"
    
    # Run all monitoring functions
    monitor_failed_logins
    monitor_http_requests
    monitor_error_rates
    monitor_system_resources
    monitor_docker_containers
    monitor_security_logs
    
    # Generate report
    generate_security_report
    
    print_status "Security monitoring completed successfully!"
    print_info "Logs saved to: $LOG_DIR"
}

# Run main function
main "$@"
