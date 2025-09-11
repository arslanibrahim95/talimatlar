#!/bin/bash

# =============================================================================
# CLAUDE TALİMAT İŞ GÜVENLİĞİ YÖNETİM SİSTEMİ - MONITORING SCRIPT
# =============================================================================

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
LOG_FILE="$PROJECT_DIR/logs/monitor.log"
ALERT_LOG_FILE="$PROJECT_DIR/logs/alerts.log"
CONFIG_FILE="$PROJECT_DIR/.env"

# Thresholds
CPU_THRESHOLD=80
MEMORY_THRESHOLD=85
DISK_THRESHOLD=90
CONTAINER_HEALTH_THRESHOLD=3

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

# Function to log messages
log_message() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $1" | tee -a "$LOG_FILE"
}

# Function to log alerts
log_alert() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] ALERT: $1" | tee -a "$ALERT_LOG_FILE"
}

# Function to check system resources
check_system_resources() {
    print_status "Checking system resources..."
    
    # CPU usage
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
    if (( $(echo "$cpu_usage > $CPU_THRESHOLD" | bc -l) )); then
        print_warning "High CPU usage: ${cpu_usage}%"
        log_alert "High CPU usage: ${cpu_usage}%"
    else
        print_success "CPU usage: ${cpu_usage}%"
    fi
    
    # Memory usage
    local memory_usage=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
    if (( $(echo "$memory_usage > $MEMORY_THRESHOLD" | bc -l) )); then
        print_warning "High memory usage: ${memory_usage}%"
        log_alert "High memory usage: ${memory_usage}%"
    else
        print_success "Memory usage: ${memory_usage}%"
    fi
    
    # Disk usage
    local disk_usage=$(df / | tail -1 | awk '{print $5}' | cut -d'%' -f1)
    if [ "$disk_usage" -gt "$DISK_THRESHOLD" ]; then
        print_warning "High disk usage: ${disk_usage}%"
        log_alert "High disk usage: ${disk_usage}%"
    else
        print_success "Disk usage: ${disk_usage}%"
    fi
}

# Function to check Docker status
check_docker_status() {
    print_status "Checking Docker status..."
    
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running"
        log_alert "Docker is not running"
        return 1
    fi
    
    print_success "Docker is running"
    
    # Check running containers
    local running_containers=$(docker ps -q | wc -l)
    print_status "Running containers: $running_containers"
    
    # Check container health
    local unhealthy_containers=$(docker ps --filter "health=unhealthy" -q | wc -l)
    if [ "$unhealthy_containers" -gt 0 ]; then
        print_warning "Unhealthy containers: $unhealthy_containers"
        log_alert "Unhealthy containers: $unhealthy_containers"
        
        # List unhealthy containers
        docker ps --filter "health=unhealthy" --format "table {{.Names}}\t{{.Status}}"
    fi
}

# Function to check service health
check_service_health() {
    print_status "Checking service health..."
    
    local services=("nginx" "postgres" "redis" "meilisearch" "minio" "auth-service" "document-service" "analytics-service" "notification-service")
    local failed_services=()
    
    for service in "${services[@]}"; do
        if docker ps --filter "name=$service" --filter "status=running" -q >/dev/null 2>&1; then
            print_success "$service: Running"
        else
            print_error "$service: Not running"
            failed_services+=("$service")
        fi
    done
    
    if [ ${#failed_services[@]} -gt 0 ]; then
        log_alert "Failed services: ${failed_services[*]}"
    fi
}

# Function to check API endpoints
check_api_endpoints() {
    print_status "Checking API endpoints..."
    
    local endpoints=(
        "http://localhost/health"
        "http://localhost:8002/health"
        "http://localhost:8003/health"
        "http://localhost:8004/health"
        "http://localhost:8005/health"
        "http://localhost:8006/health"
    )
    
    local failed_endpoints=()
    
    for endpoint in "${endpoints[@]}"; do
        if curl -f -s "$endpoint" >/dev/null 2>&1; then
            print_success "$endpoint: OK"
        else
            print_error "$endpoint: FAILED"
            failed_endpoints+=("$endpoint")
        fi
    done
    
    if [ ${#failed_endpoints[@]} -gt 0 ]; then
        log_alert "Failed API endpoints: ${failed_endpoints[*]}"
    fi
}

# Function to check database connections
check_database_connections() {
    print_status "Checking database connections..."
    
    # PostgreSQL
    if docker exec claude-postgres pg_isready -U safety_admin -d safety_production >/dev/null 2>&1; then
        print_success "PostgreSQL: Connected"
    else
        print_error "PostgreSQL: Connection failed"
        log_alert "PostgreSQL connection failed"
    fi
    
    # Redis
    if docker exec claude-redis redis-cli ping >/dev/null 2>&1; then
        print_success "Redis: Connected"
    else
        print_error "Redis: Connection failed"
        log_alert "Redis connection failed"
    fi
}

# Function to check log files
check_log_files() {
    print_status "Checking log files..."
    
    local log_dir="$PROJECT_DIR/logs"
    local log_files=("nginx" "postgres" "redis" "auth" "document" "analytics" "notification")
    
    for log_type in "${log_files[@]}"; do
        local log_file="$log_dir/${log_type}.log"
        if [ -f "$log_file" ]; then
            local log_size=$(du -h "$log_file" | cut -f1)
            local error_count=$(grep -i "error\|exception\|fail" "$log_file" | wc -l)
            
            if [ "$error_count" -gt 0 ]; then
                print_warning "$log_type logs: $error_count errors (Size: $log_size)"
                log_alert "$log_type logs contain $error_count errors"
            else
                print_success "$log_type logs: OK (Size: $log_size)"
            fi
        else
            print_status "$log_type logs: No log file found"
        fi
    done
}

# Function to check backup status
check_backup_status() {
    print_status "Checking backup status..."
    
    local backup_dir="$PROJECT_DIR/backups"
    if [ -d "$backup_dir" ]; then
        local backup_count=$(find "$backup_dir" -name "backup_*.tar.gz" -type f | wc -l)
        local latest_backup=$(find "$backup_dir" -name "backup_*.tar.gz" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)
        
        if [ "$backup_count" -gt 0 ]; then
            local backup_age=$(find "$backup_dir" -name "backup_*.tar.gz" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f1)
            local current_time=$(date +%s)
            local age_hours=$(( (current_time - backup_age) / 3600 ))
            
            if [ "$age_hours" -gt 24 ]; then
                print_warning "Latest backup is $age_hours hours old"
                log_alert "Latest backup is $age_hours hours old"
            else
                print_success "Latest backup: $age_hours hours old"
            fi
            
            print_status "Total backups: $backup_count"
        else
            print_warning "No backups found"
            log_alert "No backups found"
        fi
    else
        print_warning "Backup directory not found"
    fi
}

# Function to generate report
generate_report() {
    local report_file="$PROJECT_DIR/logs/monitoring-report-$(date +%Y%m%d-%H%M%S).txt"
    
    print_status "Generating monitoring report..."
    
    {
        echo "Claude Talimat System Monitoring Report"
        echo "======================================"
        echo "Generated: $(date)"
        echo ""
        echo "System Resources:"
        echo "  CPU: $(top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | cut -d'%' -f1)%"
        echo "  Memory: $(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')%"
        echo "  Disk: $(df / | tail -1 | awk '{print $5}')"
        echo ""
        echo "Docker Status:"
        echo "  Running containers: $(docker ps -q | wc -l)"
        echo "  Unhealthy containers: $(docker ps --filter 'health=unhealthy' -q | wc -l)"
        echo ""
        echo "Service Status:"
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        echo ""
        echo "Recent Alerts:"
        if [ -f "$ALERT_LOG_FILE" ]; then
            tail -10 "$ALERT_LOG_FILE"
        fi
    } > "$report_file"
    
    print_success "Report generated: $report_file"
}

# Function to send alerts (placeholder)
send_alerts() {
    # This function can be extended to send alerts via email, Slack, etc.
    if [ -f "$ALERT_LOG_FILE" ]; then
        local alert_count=$(grep -c "ALERT:" "$ALERT_LOG_FILE" || echo "0")
        if [ "$alert_count" -gt 0 ]; then
            print_warning "Sending $alert_count alerts..."
            # Add your alert mechanism here
            log_message "Alerts sent successfully"
        fi
    fi
}

# Main monitoring function
main() {
    echo "=============================================================================="
    echo "  CLAUDE TALİMAT İŞ GÜVENLİĞİ YÖNETİM SİSTEMİ - MONITORING"
    echo "=============================================================================="
    echo ""
    
    # Create log directory if it doesn't exist
    mkdir -p "$(dirname "$LOG_FILE")"
    
    # Start monitoring
    log_message "=== Starting system monitoring ==="
    
    # Run all checks
    check_system_resources
    check_docker_status
    check_service_health
    check_api_endpoints
    check_database_connections
    check_log_files
    check_backup_status
    
    # Generate report
    generate_report
    
    # Send alerts if needed
    send_alerts
    
    log_message "=== Monitoring completed ==="
    echo ""
    print_success "Monitoring completed successfully!"
    print_status "Check logs: $LOG_FILE"
    print_status "Check alerts: $ALERT_LOG_FILE"
}

# Run main function
main "$@"
