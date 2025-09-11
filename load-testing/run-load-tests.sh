#!/bin/bash

# Claude Talimat Load Testing Script
# This script runs comprehensive load tests using K6

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESULTS_DIR="$SCRIPT_DIR/results"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Create results directory
mkdir -p "$RESULTS_DIR"

echo -e "${BLUE}🚀 Claude Talimat Load Testing Suite${NC}"
echo -e "${BLUE}====================================${NC}"
echo ""

# Function to check if K6 is installed
check_k6() {
    if ! command -v k6 &> /dev/null; then
        echo -e "${RED}❌ K6 is not installed. Please install K6 first.${NC}"
        echo "Installation instructions:"
        echo "  Ubuntu/Debian: sudo apt-get install k6"
        echo "  macOS: brew install k6"
        echo "  Or download from: https://k6.io/docs/getting-started/installation/"
        exit 1
    fi
    echo -e "${GREEN}✅ K6 is installed${NC}"
}

# Function to check if services are running
check_services() {
    echo -e "${YELLOW}🔍 Checking service availability...${NC}"
    
    # Check frontend
    if curl -s -f "http://localhost:3000" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend (Port 3000) is running${NC}"
    else
        echo -e "${RED}❌ Frontend (Port 3000) is not running${NC}"
        echo "Please start the frontend service first"
    fi
    
    # Check PostgreSQL
    if pg_isready -h localhost -p 5433 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PostgreSQL (Port 5433) is running${NC}"
    else
        echo -e "${RED}❌ PostgreSQL (Port 5433) is not running${NC}"
        echo "Please start PostgreSQL first"
    fi
    
    # Check Redis
    if redis-cli -p 6380 ping > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Redis (Port 6380) is running${NC}"
    else
        echo -e "${RED}❌ Redis (Port 6380) is not running${NC}"
        echo "Please start Redis first"
    fi
    
    # Check API services (optional)
    if curl -s -f "http://localhost:8004/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Auth Service (Port 8004) is running${NC}"
    else
        echo -e "${YELLOW}⚠️  Auth Service (Port 8004) is not running (optional)${NC}"
    fi
    
    if curl -s -f "http://localhost:8003/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Analytics Service (Port 8003) is running${NC}"
    else
        echo -e "${YELLOW}⚠️  Analytics Service (Port 8003) is not running (optional)${NC}"
    fi
    
    echo ""
}

# Function to run load test
run_load_test() {
    echo -e "${BLUE}📊 Running Load Test...${NC}"
    echo "Duration: ~23 minutes"
    echo "Max Users: 50"
    echo ""
    
    k6 run \
        --out json="$RESULTS_DIR/load_test_$TIMESTAMP.json" \
        --out csv="$RESULTS_DIR/load_test_$TIMESTAMP.csv" \
        "$SCRIPT_DIR/k6-load-test.js"
    
    echo -e "${GREEN}✅ Load Test completed${NC}"
    echo ""
}

# Function to run stress test
run_stress_test() {
    echo -e "${BLUE}🔥 Running Stress Test...${NC}"
    echo "Duration: ~20 minutes"
    echo "Max Users: 100 (with spikes)"
    echo ""
    
    k6 run \
        --out json="$RESULTS_DIR/stress_test_$TIMESTAMP.json" \
        --out csv="$RESULTS_DIR/stress_test_$TIMESTAMP.csv" \
        "$SCRIPT_DIR/k6-stress-test.js"
    
    echo -e "${GREEN}✅ Stress Test completed${NC}"
    echo ""
}

# Function to run spike test
run_spike_test() {
    echo -e "${BLUE}⚡ Running Spike Test...${NC}"
    echo "Duration: ~15 minutes"
    echo "Max Users: 300 (with multiple spikes)"
    echo ""
    
    k6 run \
        --out json="$RESULTS_DIR/spike_test_$TIMESTAMP.json" \
        --out csv="$RESULTS_DIR/spike_test_$TIMESTAMP.csv" \
        "$SCRIPT_DIR/k6-spike-test.js"
    
    echo -e "${GREEN}✅ Spike Test completed${NC}"
    echo ""
}

# Function to generate summary report
generate_report() {
    echo -e "${BLUE}📋 Generating Test Summary Report...${NC}"
    
    REPORT_FILE="$RESULTS_DIR/load_test_summary_$TIMESTAMP.md"
    
    cat > "$REPORT_FILE" << EOF
# Claude Talimat Load Testing Summary

**Test Date:** $(date)
**Test Duration:** $(date -d @$(( $(date +%s) - START_TIME )) -u +%H:%M:%S)
**Results Directory:** $RESULTS_DIR

## Test Results

### Load Test
- **File:** load_test_$TIMESTAMP.json
- **CSV:** load_test_$TIMESTAMP.csv
- **Duration:** ~23 minutes
- **Max Users:** 50

### Stress Test
- **File:** stress_test_$TIMESTAMP.json
- **CSV:** stress_test_$TIMESTAMP.csv
- **Duration:** ~20 minutes
- **Max Users:** 100

### Spike Test
- **File:** spike_test_$TIMESTAMP.json
- **CSV:** spike_test_$TIMESTAMP.csv
- **Duration:** ~15 minutes
- **Max Users:** 300

## Analysis

To analyze the results:

1. **JSON Files:** Use K6's built-in analysis tools or import into Grafana
2. **CSV Files:** Import into Excel, Google Sheets, or any data analysis tool
3. **Key Metrics to Review:**
   - Response times (p95, p99)
   - Error rates
   - Throughput (requests per second)
   - System resource usage

## Recommendations

Based on the test results, consider:

1. **Performance Optimization:**
   - Database query optimization
   - Caching improvements
   - CDN implementation

2. **Scalability Improvements:**
   - Load balancing
   - Horizontal scaling
   - Database sharding

3. **Monitoring:**
   - Set up alerts for high response times
   - Monitor error rates
   - Track resource usage

## Next Steps

1. Review the test results
2. Identify performance bottlenecks
3. Implement optimizations
4. Re-run tests to validate improvements
5. Set up continuous performance monitoring

---
*Generated by Claude Talimat Load Testing Suite*
EOF

    echo -e "${GREEN}✅ Summary report generated: $REPORT_FILE${NC}"
    echo ""
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --load-only     Run only load test"
    echo "  --stress-only   Run only stress test"
    echo "  --spike-only    Run only spike test"
    echo "  --all           Run all tests (default)"
    echo "  --check-only    Only check services, don't run tests"
    echo "  --help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                    # Run all tests"
    echo "  $0 --load-only        # Run only load test"
    echo "  $0 --check-only       # Only check services"
}

# Main execution
main() {
    START_TIME=$(date +%s)
    
    # Parse command line arguments
    case "${1:-}" in
        --load-only)
            TEST_TYPE="load"
            ;;
        --stress-only)
            TEST_TYPE="stress"
            ;;
        --spike-only)
            TEST_TYPE="spike"
            ;;
        --all|"")
            TEST_TYPE="all"
            ;;
        --check-only)
            TEST_TYPE="check"
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Unknown option: $1${NC}"
            show_usage
            exit 1
            ;;
    esac
    
    # Check prerequisites
    check_k6
    check_services
    
    if [ "$TEST_TYPE" = "check" ]; then
        echo -e "${GREEN}✅ Service check completed${NC}"
        exit 0
    fi
    
    # Run tests based on type
    case "$TEST_TYPE" in
        load)
            run_load_test
            ;;
        stress)
            run_stress_test
            ;;
        spike)
            run_spike_test
            ;;
        all)
            run_load_test
            sleep 30  # Wait between tests
            run_stress_test
            sleep 30  # Wait between tests
            run_spike_test
            ;;
    esac
    
    # Generate summary report
    generate_report
    
    echo -e "${GREEN}🎉 All tests completed successfully!${NC}"
    echo -e "${BLUE}📁 Results saved in: $RESULTS_DIR${NC}"
    echo -e "${BLUE}📋 Summary report: $RESULTS_DIR/load_test_summary_$TIMESTAMP.md${NC}"
}

# Run main function
main "$@"
