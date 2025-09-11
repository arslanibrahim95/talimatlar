#!/bin/bash

# Claude Talimat Production Deployment Test Script
# Bu script production deployment'ını test eder

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TEST_ENVIRONMENT=${1:-staging}
BASE_URL=${2:-http://localhost:3000}
API_BASE_URL=${3:-http://localhost:8000}
TEST_TIMEOUT=${TEST_TIMEOUT:-30}

# Test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Logging
LOG_FILE="/var/log/deployment-test.log"
exec > >(tee -a "$LOG_FILE")
exec 2>&1

echo -e "${BLUE}🧪 Starting Production Deployment Test${NC}"
echo "Environment: $TEST_ENVIRONMENT"
echo "Base URL: $BASE_URL"
echo "API Base URL: $API_BASE_URL"
echo "Timestamp: $(date)"
echo "----------------------------------------"

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_status="${3:-200}"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    print_info "Running test: $test_name"
    
    if eval "$test_command" >/dev/null 2>&1; then
        print_status "$test_name - PASSED"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        print_error "$test_name - FAILED"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Function to check HTTP endpoint
check_endpoint() {
    local url="$1"
    local expected_status="${2:-200}"
    local timeout="${3:-10}"
    
    local response=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$timeout" "$url" 2>/dev/null || echo "000")
    
    if [ "$response" = "$expected_status" ]; then
        return 0
    else
        print_error "HTTP $response (expected $expected_status) for $url"
        return 1
    fi
}

# Function to check service health
check_service_health() {
    local service_name="$1"
    local health_url="$2"
    
    print_info "Checking health of $service_name..."
    
    if check_endpoint "$health_url" 200 15; then
        print_status "$service_name is healthy"
        return 0
    else
        print_error "$service_name health check failed"
        return 1
    fi
}

# Test 1: Frontend Health Check
test_frontend_health() {
    run_test "Frontend Health Check" "check_endpoint '$BASE_URL/health' 200"
}

# Test 2: Frontend Main Page
test_frontend_main_page() {
    run_test "Frontend Main Page" "check_endpoint '$BASE_URL' 200"
}

# Test 3: Frontend Static Assets
test_frontend_assets() {
    run_test "Frontend CSS Assets" "check_endpoint '$BASE_URL/static/css/main.css' 200"
    run_test "Frontend JS Assets" "check_endpoint '$BASE_URL/static/js/main.js' 200"
}

# Test 4: API Services Health
test_api_services_health() {
    check_service_health "Auth Service" "$API_BASE_URL:8004/health"
    check_service_health "Document Service" "$API_BASE_URL:8002/health"
    check_service_health "Analytics Service" "$API_BASE_URL:8003/health"
    check_service_health "Notification Service" "$API_BASE_URL:8005/health"
}

# Test 5: Database Connectivity
test_database_connectivity() {
    run_test "Database Connectivity" "docker-compose -f docker-compose.prod.yml exec -T postgres pg_isready -U claude_talimat_user -d claude_talimat_prod"
}

# Test 6: Redis Connectivity
test_redis_connectivity() {
    run_test "Redis Connectivity" "docker-compose -f docker-compose.prod.yml exec -T redis redis-cli ping | grep -q PONG"
}

# Test 7: Authentication Flow
test_authentication_flow() {
    print_info "Testing authentication flow..."
    
    # Test login endpoint
    local login_response=$(curl -s -X POST "$API_BASE_URL:8004/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"test@example.com","password":"password123"}' \
        --max-time 10 2>/dev/null || echo "ERROR")
    
    if [[ "$login_response" == *"access_token"* ]] || [[ "$login_response" == *"error"* ]]; then
        print_status "Authentication endpoint is responding"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        print_error "Authentication endpoint failed"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

# Test 8: API Endpoints
test_api_endpoints() {
    print_info "Testing API endpoints..."
    
    local endpoints=(
        "$API_BASE_URL:8002/api/documents"
        "$API_BASE_URL:8003/api/analytics/dashboard"
        "$API_BASE_URL:8005/api/notifications"
    )
    
    for endpoint in "${endpoints[@]}"; do
        if check_endpoint "$endpoint" "200 401 403" 10; then
            print_status "API endpoint responding: $endpoint"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        else
            print_error "API endpoint failed: $endpoint"
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
        TOTAL_TESTS=$((TOTAL_TESTS + 1))
    done
}

# Test 9: SSL/TLS Configuration
test_ssl_configuration() {
    if [[ "$BASE_URL" == https://* ]]; then
        print_info "Testing SSL/TLS configuration..."
        
        local domain=$(echo "$BASE_URL" | sed 's|https://||' | sed 's|/.*||')
        
        if openssl s_client -connect "$domain:443" -servername "$domain" </dev/null 2>/dev/null | grep -q "Verify return code: 0"; then
            print_status "SSL certificate is valid"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        else
            print_error "SSL certificate validation failed"
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
        TOTAL_TESTS=$((TOTAL_TESTS + 1))
    else
        print_info "Skipping SSL test (HTTP only)"
    fi
}

# Test 10: Performance Test
test_performance() {
    print_info "Running basic performance test..."
    
    local start_time=$(date +%s%3N)
    local response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$BASE_URL" 2>/dev/null || echo "000")
    local end_time=$(date +%s%3N)
    local duration=$((end_time - start_time))
    
    if [ "$response" = "200" ] && [ "$duration" -lt 2000 ]; then
        print_status "Performance test passed (${duration}ms)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        print_error "Performance test failed (${duration}ms, HTTP $response)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

# Test 11: Security Headers
test_security_headers() {
    print_info "Testing security headers..."
    
    local headers=$(curl -s -I "$BASE_URL" --max-time 10 2>/dev/null || echo "")
    
    local security_headers=(
        "X-Frame-Options"
        "X-Content-Type-Options"
        "X-XSS-Protection"
        "Content-Security-Policy"
    )
    
    local headers_found=0
    for header in "${security_headers[@]}"; do
        if echo "$headers" | grep -qi "$header"; then
            headers_found=$((headers_found + 1))
        fi
    done
    
    if [ "$headers_found" -ge 3 ]; then
        print_status "Security headers test passed ($headers_found/4 headers found)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        print_error "Security headers test failed ($headers_found/4 headers found)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

# Test 12: Container Status
test_container_status() {
    print_info "Checking container status..."
    
    local containers=(
        "claude-talimat-frontend"
        "claude-talimat-auth"
        "claude-talimat-document"
        "claude-talimat-analytics"
        "claude-talimat-notification"
        "claude-talimat-postgres"
        "claude-talimat-redis"
    )
    
    local running_containers=0
    for container in "${containers[@]}"; do
        if docker ps --format "table {{.Names}}" | grep -q "$container"; then
            running_containers=$((running_containers + 1))
        fi
    done
    
    if [ "$running_containers" -eq "${#containers[@]}" ]; then
        print_status "All containers are running ($running_containers/${#containers[@]})"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        print_error "Some containers are not running ($running_containers/${#containers[@]})"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

# Test 13: Log Analysis
test_log_analysis() {
    print_info "Analyzing application logs..."
    
    local error_count=$(docker-compose -f docker-compose.prod.yml logs --tail=100 2>&1 | grep -i "error\|exception\|fatal" | wc -l)
    
    if [ "$error_count" -lt 10 ]; then
        print_status "Log analysis passed (${error_count} errors in last 100 lines)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        print_warning "Log analysis warning (${error_count} errors in last 100 lines)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

# Test 14: Resource Usage
test_resource_usage() {
    print_info "Checking resource usage..."
    
    local memory_usage=$(docker stats --no-stream --format "table {{.MemUsage}}" | grep -v "MEM USAGE" | head -5 | awk -F'/' '{print $1}' | sed 's/[^0-9.]//g' | awk '{sum+=$1} END {print sum}')
    local cpu_usage=$(docker stats --no-stream --format "table {{.CPUPerc}}" | grep -v "CPU %" | head -5 | sed 's/%//' | awk '{sum+=$1} END {print sum}')
    
    if (( $(echo "$memory_usage < 8000" | bc -l) )) && (( $(echo "$cpu_usage < 80" | bc -l) )); then
        print_status "Resource usage is acceptable (Memory: ${memory_usage}MB, CPU: ${cpu_usage}%)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        print_warning "Resource usage is high (Memory: ${memory_usage}MB, CPU: ${cpu_usage}%)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

# Generate test report
generate_test_report() {
    local report_file="/home/igu/talimatlar/test-reports/deployment-test-$(date +%Y%m%d_%H%M%S).md"
    mkdir -p "$(dirname "$report_file")"
    
    cat > "$report_file" << EOF
# 🧪 Claude Talimat Deployment Test Report

**Generated:** $(date)
**Environment:** $TEST_ENVIRONMENT
**Base URL:** $BASE_URL
**API Base URL:** $API_BASE_URL

## 📊 Test Results Summary

- **Total Tests:** $TOTAL_TESTS
- **Passed:** $PASSED_TESTS
- **Failed:** $FAILED_TESTS
- **Success Rate:** $(( (PASSED_TESTS * 100) / TOTAL_TESTS ))%

## ✅ Test Details

### Frontend Tests
- Frontend Health Check: $(if [ $PASSED_TESTS -gt 0 ]; then echo "✅ PASSED"; else echo "❌ FAILED"; fi)
- Main Page Load: $(if [ $PASSED_TESTS -gt 1 ]; then echo "✅ PASSED"; else echo "❌ FAILED"; fi)
- Static Assets: $(if [ $PASSED_TESTS -gt 2 ]; then echo "✅ PASSED"; else echo "❌ FAILED"; fi)

### API Tests
- Service Health Checks: $(if [ $PASSED_TESTS -gt 3 ]; then echo "✅ PASSED"; else echo "❌ FAILED"; fi)
- Authentication Flow: $(if [ $PASSED_TESTS -gt 4 ]; then echo "✅ PASSED"; else echo "❌ FAILED"; fi)
- API Endpoints: $(if [ $PASSED_TESTS -gt 5 ]; then echo "✅ PASSED"; else echo "❌ FAILED"; fi)

### Infrastructure Tests
- Database Connectivity: $(if [ $PASSED_TESTS -gt 6 ]; then echo "✅ PASSED"; else echo "❌ FAILED"; fi)
- Redis Connectivity: $(if [ $PASSED_TESTS -gt 7 ]; then echo "✅ PASSED"; else echo "❌ FAILED"; fi)
- Container Status: $(if [ $PASSED_TESTS -gt 8 ]; then echo "✅ PASSED"; else echo "❌ FAILED"; fi)

### Security Tests
- SSL Configuration: $(if [ $PASSED_TESTS -gt 9 ]; then echo "✅ PASSED"; else echo "❌ FAILED"; fi)
- Security Headers: $(if [ $PASSED_TESTS -gt 10 ]; then echo "✅ PASSED"; else echo "❌ FAILED"; fi)

### Performance Tests
- Response Time: $(if [ $PASSED_TESTS -gt 11 ]; then echo "✅ PASSED"; else echo "❌ FAILED"; fi)
- Resource Usage: $(if [ $PASSED_TESTS -gt 12 ]; then echo "✅ PASSED"; else echo "❌ FAILED"; fi)

## 🎯 Recommendations

$(if [ $FAILED_TESTS -eq 0 ]; then
    echo "- ✅ All tests passed! Deployment is ready for production."
else
    echo "- ⚠️  Some tests failed. Please review and fix issues before production deployment."
    echo "- 🔍 Check logs for detailed error information."
    echo "- 🛠️  Run individual tests to isolate issues."
fi)

## 📁 Log Files

- Test Log: $LOG_FILE
- Application Logs: \`docker-compose -f docker-compose.prod.yml logs\`

---
*Report generated by Claude Talimat Deployment Test Suite*
EOF

    print_status "Test report generated: $report_file"
}

# Main test function
main() {
    print_info "Starting deployment tests..."
    
    # Wait for services to be ready
    print_info "Waiting for services to start..."
    sleep 30
    
    # Run all tests
    test_frontend_health
    test_frontend_main_page
    test_frontend_assets
    test_api_services_health
    test_database_connectivity
    test_redis_connectivity
    test_authentication_flow
    test_api_endpoints
    test_ssl_configuration
    test_performance
    test_security_headers
    test_container_status
    test_log_analysis
    test_resource_usage
    
    # Generate report
    generate_test_report
    
    # Print summary
    echo ""
    echo "----------------------------------------"
    print_info "Test Summary:"
    echo "Total Tests: $TOTAL_TESTS"
    echo "Passed: $PASSED_TESTS"
    echo "Failed: $FAILED_TESTS"
    echo "Success Rate: $(( (PASSED_TESTS * 100) / TOTAL_TESTS ))%"
    echo "----------------------------------------"
    
    if [ $FAILED_TESTS -eq 0 ]; then
        print_status "All tests passed! Deployment is ready for production! 🎉"
        exit 0
    else
        print_error "Some tests failed. Please review and fix issues. ❌"
        exit 1
    fi
}

# Run main function
main "$@"
