#!/bin/bash

# Health Check Script for Claude Talimat
# Monitors all services and provides detailed health status

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

# Service endpoints
declare -A SERVICES
SERVICES[frontend]="http://localhost:3000"
SERVICES[nginx]="http://localhost:8080"
SERVICES[auth]="http://localhost:8004/health"
SERVICES[analytics]="http://localhost:8003/health"
SERVICES[instruction]="http://localhost:8005/health"
SERVICES[ai]="http://localhost:8006/health"
SERVICES[notification]="http://localhost:8007/health"
SERVICES[postgres]="postgresql://claude:claude123@localhost:5433/claude_dev"
SERVICES[redis]="redis://localhost:6380"

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

# Check HTTP endpoint
check_http_endpoint() {
    local service=$1
    local url=$2
    local timeout=${3:-10}
    
    if curl -f -s --max-time $timeout "$url" > /dev/null 2>&1; then
        success "$service is healthy"
        return 0
    else
        error "$service is unhealthy (URL: $url)"
        return 1
    fi
}

# Check database connection
check_database() {
    local service=$1
    local connection_string=$2
    
    log "Checking $service database connection..."
    
    if command -v psql > /dev/null 2>&1; then
        if psql "$connection_string" -c "SELECT 1;" > /dev/null 2>&1; then
            success "$service database is healthy"
            return 0
        else
            error "$service database is unhealthy"
            return 1
        fi
    else
        warning "psql not found, skipping database check"
        return 0
    fi
}

# Check Redis connection
check_redis() {
    local service=$1
    local connection_string=$2
    
    log "Checking $service Redis connection..."
    
    if command -v redis-cli > /dev/null 2>&1; then
        if redis-cli -u "$connection_string" ping > /dev/null 2>&1; then
            success "$service Redis is healthy"
            return 0
        else
            error "$service Redis is unhealthy"
            return 1
        fi
    else
        warning "redis-cli not found, skipping Redis check"
        return 0
    fi
}

# Check Docker container
check_docker_container() {
    local container_name=$1
    local service_name=$2
    
    log "Checking $service_name Docker container..."
    
    if docker ps --format "table {{.Names}}" | grep -q "$container_name"; then
        if docker ps --filter "name=$container_name" --filter "status=running" --format "{{.Status}}" | grep -q "Up"; then
            success "$service_name container is running"
            return 0
        else
            error "$service_name container is not running"
            return 1
        fi
    else
        error "$service_name container not found"
        return 1
    fi
}

# Check system resources
check_system_resources() {
    log "Checking system resources..."
    
    # Check disk space
    local disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [[ $disk_usage -gt 90 ]]; then
        warning "Disk usage is high: ${disk_usage}%"
    else
        success "Disk usage is normal: ${disk_usage}%"
    fi
    
    # Check memory usage
    local memory_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    if [[ $memory_usage -gt 90 ]]; then
        warning "Memory usage is high: ${memory_usage}%"
    else
        success "Memory usage is normal: ${memory_usage}%"
    fi
    
    # Check CPU load
    local cpu_load=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    local cpu_cores=$(nproc)
    local cpu_usage=$(echo "scale=0; $cpu_load * 100 / $cpu_cores" | bc)
    
    if [[ $cpu_usage -gt 80 ]]; then
        warning "CPU usage is high: ${cpu_usage}%"
    else
        success "CPU usage is normal: ${cpu_usage}%"
    fi
}

# Check network connectivity
check_network() {
    log "Checking network connectivity..."
    
    # Check if we can reach external services
    if ping -c 1 8.8.8.8 > /dev/null 2>&1; then
        success "External network connectivity is working"
    else
        warning "External network connectivity issues"
    fi
    
    # Check if we can reach localhost
    if ping -c 1 localhost > /dev/null 2>&1; then
        success "Local network connectivity is working"
    else
        error "Local network connectivity issues"
        return 1
    fi
}

# Check logs for errors
check_logs() {
    local service=$1
    local log_file="$PROJECT_DIR/logs/$service"
    
    if [[ -f "$log_file" ]]; then
        log "Checking $service logs for errors..."
        
        # Check for error patterns in the last 100 lines
        local error_count=$(tail -100 "$log_file" | grep -i "error\|exception\|fatal" | wc -l)
        
        if [[ $error_count -gt 0 ]]; then
            warning "$service has $error_count errors in recent logs"
            echo "Recent errors:"
            tail -100 "$log_file" | grep -i "error\|exception\|fatal" | tail -5
        else
            success "$service logs look clean"
        fi
    else
        warning "Log file not found for $service: $log_file"
    fi
}

# Comprehensive health check
comprehensive_health_check() {
    log "Starting comprehensive health check for $ENVIRONMENT environment..."
    
    local failed_checks=0
    local total_checks=0
    
    # Check Docker containers
    log "Checking Docker containers..."
    for service in frontend nginx auth-service analytics-service instruction-service ai-service notification-service postgres redis; do
        ((total_checks++))
        if ! check_docker_container "claude-talimat_${service}_1" "$service"; then
            ((failed_checks++))
        fi
    done
    
    # Check HTTP endpoints
    log "Checking HTTP endpoints..."
    for service in "${!SERVICES[@]}"; do
        if [[ "$service" != "postgres" && "$service" != "redis" ]]; then
            ((total_checks++))
            if ! check_http_endpoint "$service" "${SERVICES[$service]}"; then
                ((failed_checks++))
            fi
        fi
    done
    
    # Check database
    ((total_checks++))
    if ! check_database "PostgreSQL" "${SERVICES[postgres]}"; then
        ((failed_checks++))
    fi
    
    # Check Redis
    ((total_checks++))
    if ! check_redis "Redis" "${SERVICES[redis]}"; then
        ((failed_checks++))
    fi
    
    # Check system resources
    check_system_resources
    
    # Check network
    check_network
    
    # Check logs
    log "Checking service logs..."
    for service in auth analytics instruction ai notification nginx postgres redis; do
        check_logs "$service"
    done
    
    # Summary
    echo ""
    log "Health Check Summary:"
    echo "Total checks: $total_checks"
    echo "Failed checks: $failed_checks"
    echo "Success rate: $(( (total_checks - failed_checks) * 100 / total_checks ))%"
    
    if [[ $failed_checks -eq 0 ]]; then
        success "All health checks passed!"
        return 0
    else
        error "$failed_checks health checks failed!"
        return 1
    fi
}

# Quick health check
quick_health_check() {
    log "Starting quick health check..."
    
    # Check main endpoints
    check_http_endpoint "Frontend" "http://localhost:3000"
    check_http_endpoint "API Gateway" "http://localhost:8080"
    check_http_endpoint "Auth Service" "http://localhost:8004/health"
    
    success "Quick health check completed"
}

# Continuous monitoring
continuous_monitoring() {
    local interval=${1:-30}
    
    log "Starting continuous monitoring (interval: ${interval}s)..."
    log "Press Ctrl+C to stop"
    
    while true; do
        echo ""
        log "=== Health Check at $(date) ==="
        
        if comprehensive_health_check; then
            success "All systems healthy"
        else
            error "Some systems unhealthy"
        fi
        
        sleep $interval
    done
}

# Main execution
main() {
    local action=${2:-comprehensive}
    
    log "Claude Talimat Health Check Script"
    log "Environment: $ENVIRONMENT"
    log "Action: $action"
    
    case $action in
        comprehensive)
            comprehensive_health_check
            ;;
        quick)
            quick_health_check
            ;;
        monitor)
            continuous_monitoring ${3:-30}
            ;;
        *)
            error "Invalid action: $action"
            echo "Valid actions: comprehensive, quick, monitor"
            exit 1
            ;;
    esac
}

# Help function
show_help() {
    echo "Claude Talimat Health Check Script"
    echo ""
    echo "Usage: $0 [ENVIRONMENT] [ACTION] [INTERVAL]"
    echo ""
    echo "Environments:"
    echo "  dev        - Development environment (default)"
    echo "  staging    - Staging environment"
    echo "  production - Production environment"
    echo ""
    echo "Actions:"
    echo "  comprehensive - Run comprehensive health check (default)"
    echo "  quick        - Run quick health check"
    echo "  monitor      - Run continuous monitoring"
    echo ""
    echo "Interval (for monitor action):"
    echo "  Number of seconds between checks (default: 30)"
    echo ""
    echo "Examples:"
    echo "  $0 dev comprehensive"
    echo "  $0 staging quick"
    echo "  $0 production monitor 60"
}

# Check for help flag
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    show_help
    exit 0
fi

# Run main function
main "$@"
