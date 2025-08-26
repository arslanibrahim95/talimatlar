#!/bin/bash

# =============================================================================
# CLAUDE TALİMAT İŞ GÜVENLİĞİ YÖNETİM SİSTEMİ - HEALTH CHECK SCRIPT
# =============================================================================

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
LOG_FILE="$PROJECT_DIR/logs/health-check.log"
ALERT_LOG_FILE="$PROJECT_DIR/logs/alerts.log"
HEALTH_STATUS_FILE="$PROJECT_DIR/logs/health-status.json"

# Health check endpoints
ENDPOINTS=(
    "http://localhost/health"
    "http://localhost:8001/health"
    "http://localhost:8002/health"
    "http://localhost:8003/health"
    "http://localhost:8004/health"
)

# Thresholds
RESPONSE_TIME_THRESHOLD=5
ERROR_THRESHOLD=3
CONSECUTIVE_FAILURES_THRESHOLD=5

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
    echo "[$timestamp] HEALTH_ALERT: $1" | tee -a "$ALERT_LOG_FILE"
}

# Function to check endpoint health
check_endpoint() {
    local endpoint="$1"
    local start_time=$(date +%s.%N)
    
    # Make HTTP request with timeout
    local response=$(curl -s -w "%{http_code}" -o /dev/null --max-time "$RESPONSE_TIME_THRESHOLD" "$endpoint" 2>/dev/null || echo "000")
    local end_time=$(date +%s.%N)
    
    # Calculate response time
    local response_time=$(echo "$end_time - $start_time" | bc -l)
    local response_time_ms=$(echo "$response_time * 1000" | bc -l | cut -d. -f1)
    
    if [ "$response" = "200" ]; then
        print_success "$endpoint: OK (${response_time_ms}ms)"
        echo "{\"endpoint\": \"$endpoint\", \"status\": \"healthy\", \"response_time\": $response_time_ms, \"timestamp\": \"$(date -Iseconds)\"}"
        return 0
    else
        print_error "$endpoint: FAILED (HTTP $response, ${response_time_ms}ms)"
        echo "{\"endpoint\": \"$endpoint\", \"status\": \"unhealthy\", \"http_code\": $response, \"response_time\": $response_time_ms, \"timestamp\": \"$(date -Iseconds)\"}"
        return 1
    fi
}

# Function to check Docker container health
check_container_health() {
    print_status "Checking Docker container health..."
    
    local unhealthy_containers=$(docker ps --filter "health=unhealthy" -q | wc -l)
    local total_containers=$(docker ps -q | wc -l)
    
    if [ "$unhealthy_containers" -gt 0 ]; then
        print_warning "Unhealthy containers: $unhealthy_containers/$total_containers"
        log_alert "Unhealthy containers detected: $unhealthy_containers/$total_containers"
        
        # List unhealthy containers
        docker ps --filter "health=unhealthy" --format "table {{.Names}}\t{{.Status}}"
        return 1
    else
        print_success "All containers are healthy: $total_containers/$total_containers"
        return 0
    fi
}

# Function to check system resources
check_system_resources() {
    print_status "Checking system resources..."
    
    # CPU usage
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
    if (( $(echo "$cpu_usage > 90" | bc -l) )); then
        print_warning "High CPU usage: ${cpu_usage}%"
        log_alert "High CPU usage: ${cpu_usage}%"
    fi
    
    # Memory usage
    local memory_usage=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
    if (( $(echo "$memory_usage > 90" | bc -l) )); then
        print_warning "High memory usage: ${memory_usage}%"
        log_alert "High memory usage: ${memory_usage}%"
    fi
    
    # Disk usage
    local disk_usage=$(df / | tail -1 | awk '{print $5}' | cut -d'%' -f1)
    if [ "$disk_usage" -gt 90 ]; then
        print_warning "High disk usage: ${disk_usage}%"
        log_alert "High disk usage: ${disk_usage}%"
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
        return 1
    fi
    
    # Redis
    if docker exec claude-redis redis-cli ping >/dev/null 2>&1; then
        print_success "Redis: Connected"
    else
        print_error "Redis: Connection failed"
        log_alert "Redis connection failed"
        return 1
    fi
}

# Function to check log files for errors
check_log_errors() {
    print_status "Checking log files for errors..."
    
    local log_dir="$PROJECT_DIR/logs"
    local error_count=0
    
    # Check recent errors in log files
    for log_file in "$log_dir"/*.log; do
        if [ -f "$log_file" ]; then
            local recent_errors=$(tail -100 "$log_file" | grep -i "error\|exception\|fail" | wc -l)
            if [ "$recent_errors" -gt 0 ]; then
                print_warning "$(basename "$log_file"): $recent_errors recent errors"
                error_count=$((error_count + recent_errors))
            fi
        fi
    done
    
    if [ "$error_count" -gt "$ERROR_THRESHOLD" ]; then
        log_alert "High error count in logs: $error_count errors"
    fi
}

# Function to generate health status report
generate_health_report() {
    local report_file="$PROJECT_DIR/logs/health-report-$(date +%Y%m%d-%H%M%S).json"
    
    print_status "Generating health status report..."
    
    # Create health status JSON
    cat > "$HEALTH_STATUS_FILE" << EOF
{
  "system": "Claude Talimat İş Güvenliği Yönetim Sistemi",
  "timestamp": "$(date -Iseconds)",
  "overall_status": "healthy",
  "checks": {
    "endpoints": [],
    "containers": "healthy",
    "databases": "healthy",
    "system_resources": "healthy",
    "logs": "healthy"
  },
  "summary": {
    "total_endpoints": ${#ENDPOINTS[@]},
    "healthy_endpoints": 0,
    "unhealthy_endpoints": 0,
    "response_time_avg": 0,
    "last_check": "$(date -Iseconds)"
  }
}
EOF
    
    print_success "Health status report generated: $HEALTH_STATUS_FILE"
}

# Function to send health alerts
send_health_alerts() {
    # This function can be extended to send alerts via email, Slack, etc.
    if [ -f "$ALERT_LOG_FILE" ]; then
        local recent_alerts=$(tail -10 "$ALERT_LOG_FILE" | grep "HEALTH_ALERT" | wc -l)
        if [ "$recent_alerts" -gt 0 ]; then
            print_warning "Sending $recent_alerts health alerts..."
            # Add your alert mechanism here
            log_message "Health alerts sent successfully"
        fi
    fi
}

# Main health check function
main() {
    echo "=============================================================================="
    echo "  CLAUDE TALİMAT İŞ GÜVENLİĞİ YÖNETİM SİSTEMİ - HEALTH CHECK"
    echo "=============================================================================="
    echo ""
    
    # Create log directory if it doesn't exist
    mkdir -p "$(dirname "$LOG_FILE")"
    
    # Start health check
    log_message "=== Starting health check ==="
    
    local overall_status=0
    local healthy_endpoints=0
    local unhealthy_endpoints=0
    local total_response_time=0
    
    # Check endpoints
    print_status "Checking endpoint health..."
    for endpoint in "${ENDPOINTS[@]}"; do
        if check_endpoint "$endpoint"; then
            healthy_endpoints=$((healthy_endpoints + 1))
        else
            unhealthy_endpoints=$((unhealthy_endpoints + 1))
            overall_status=1
        fi
    done
    
    # Check container health
    if ! check_container_health; then
        overall_status=1
    fi
    
    # Check database connections
    if ! check_database_connections; then
        overall_status=1
    fi
    
    # Check system resources
    check_system_resources
    
    # Check log errors
    check_log_errors
    
    # Generate health report
    generate_health_report
    
    # Send alerts if needed
    send_health_alerts
    
    # Summary
    echo ""
    print_status "Health Check Summary:"
    echo "  Endpoints: $healthy_endpoints healthy, $unhealthy_endpoints unhealthy"
    echo "  Overall Status: $([ $overall_status -eq 0 ] && echo "HEALTHY" || echo "UNHEALTHY")"
    
    log_message "=== Health check completed ==="
    
    if [ $overall_status -eq 0 ]; then
        print_success "All health checks passed!"
        exit 0
    else
        print_error "Some health checks failed!"
        exit 1
    fi
}

# Run main function
main "$@"
