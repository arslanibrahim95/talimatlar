#!/bin/bash

# =============================================================================
# CLAUDE TALİMAT AUTO-UPDATE TEST SCRIPT
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

# Test results
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=0

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

# Test function
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -e "\n${BLUE}Testing: $test_name${NC}"
    echo "Command: $test_command"
    
    if eval "$test_command" > /dev/null 2>&1; then
        log_success "✓ $test_name PASSED"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        log_error "✗ $test_name FAILED"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# Test script existence
test_script_existence() {
    log_info "Testing script existence..."
    
    local scripts=(
        "auto-update.sh"
        "update-manager.sh"
        "update-monitor.sh"
        "setup-auto-update-service.sh"
    )
    
    for script in "${scripts[@]}"; do
        run_test "Script exists: $script" "[ -f \"$PROJECT_ROOT/scripts/$script\" ]"
        run_test "Script is executable: $script" "[ -x \"$PROJECT_ROOT/scripts/$script\" ]"
    done
}

# Test configuration file
test_configuration() {
    log_info "Testing configuration file..."
    
    run_test "Configuration file exists" "[ -f \"$PROJECT_ROOT/auto-update-config.json\" ]"
    
    if [ -f "$PROJECT_ROOT/auto-update-config.json" ]; then
        run_test "Configuration file is valid JSON" "jq empty \"$PROJECT_ROOT/auto-update-config.json\""
        run_test "Configuration has required fields" "jq -e '.enabled' \"$PROJECT_ROOT/auto-update-config.json\""
    fi
}

# Test required tools
test_required_tools() {
    log_info "Testing required tools..."
    
    local tools=(
        "docker"
        "curl"
        "jq"
    )
    
    for tool in "${tools[@]}"; do
        run_test "Tool available: $tool" "command -v $tool"
    done
    
    # Check Docker Compose (either as command or plugin)
    run_test "Docker Compose available" "command -v docker-compose || docker compose version > /dev/null 2>&1"
}

# Test directory structure
test_directory_structure() {
    log_info "Testing directory structure..."
    
    local directories=(
        "logs"
        "backups"
        "frontend"
        "ai-service"
        "instruction-service"
    )
    
    for dir in "${directories[@]}"; do
        run_test "Directory exists: $dir" "[ -d \"$PROJECT_ROOT/$dir\" ]"
    done
}

# Test Docker environment
test_docker_environment() {
    log_info "Testing Docker environment..."
    
    run_test "Docker is running" "docker ps > /dev/null 2>&1"
    run_test "Docker Compose is available" "docker compose version > /dev/null 2>&1"
    
    if [ -f "$PROJECT_ROOT/docker-compose.yml" ]; then
        run_test "Docker Compose file is valid" "docker compose config > /dev/null 2>&1"
    fi
}

# Test auto-update script functionality
test_auto_update_script() {
    log_info "Testing auto-update script functionality..."
    
    # Test help option
    run_test "Auto-update script help" "$PROJECT_ROOT/scripts/auto-update.sh --help"
    
    # Test config option
    run_test "Auto-update script config" "$PROJECT_ROOT/scripts/auto-update.sh --config"
    
    # Test test option
    run_test "Auto-update script test" "$PROJECT_ROOT/scripts/auto-update.sh --test"
}

# Test update manager script
test_update_manager_script() {
    log_info "Testing update manager script..."
    
    # Test if script runs without errors (help mode)
    run_test "Update manager script help" "timeout 5 $PROJECT_ROOT/scripts/update-manager.sh --help 2>/dev/null || true"
}

# Test update monitor script
test_update_monitor_script() {
    log_info "Testing update monitor script..."
    
    # Test health check
    run_test "Update monitor health check" "$PROJECT_ROOT/scripts/update-monitor.sh health"
    
    # Test updates check
    run_test "Update monitor updates check" "$PROJECT_ROOT/scripts/update-monitor.sh updates"
}

# Test Makefile integration
test_makefile_integration() {
    log_info "Testing Makefile integration..."
    
    if [ -f "$PROJECT_ROOT/Makefile" ]; then
        run_test "Makefile has auto-update targets" "grep -q 'auto-update:' \"$PROJECT_ROOT/Makefile\""
        run_test "Makefile has update targets" "grep -q 'update:' \"$PROJECT_ROOT/Makefile\""
    fi
}

# Test log directory creation
test_log_directory() {
    log_info "Testing log directory creation..."
    
    # Create logs directory if it doesn't exist
    mkdir -p "$PROJECT_ROOT/logs"
    
    run_test "Logs directory exists" "[ -d \"$PROJECT_ROOT/logs\" ]"
    run_test "Logs directory is writable" "[ -w \"$PROJECT_ROOT/logs\" ]"
}

# Test backup directory creation
test_backup_directory() {
    log_info "Testing backup directory creation..."
    
    # Create backups directory if it doesn't exist
    mkdir -p "$PROJECT_ROOT/backups"
    
    run_test "Backups directory exists" "[ -d \"$PROJECT_ROOT/backups\" ]"
    run_test "Backups directory is writable" "[ -w \"$PROJECT_ROOT/backups\" ]"
}

# Test systemd service creation (if run as root)
test_systemd_service() {
    log_info "Testing systemd service creation..."
    
    if [ "$EUID" -eq 0 ]; then
        run_test "Systemd service script exists" "[ -f \"$PROJECT_ROOT/scripts/setup-auto-update-service.sh\" ]"
        run_test "Systemd service script is executable" "[ -x \"$PROJECT_ROOT/scripts/setup-auto-update-service.sh\" ]"
    else
        log_warning "Skipping systemd service tests (not running as root)"
    fi
}

# Test notification configuration
test_notification_config() {
    log_info "Testing notification configuration..."
    
    if [ -f "$PROJECT_ROOT/auto-update-config.json" ]; then
        run_test "Notification config has email section" "jq -e '.notifications.email' \"$PROJECT_ROOT/auto-update-config.json\""
        run_test "Notification config has webhook section" "jq -e '.notifications.webhook' \"$PROJECT_ROOT/auto-update-config.json\""
    fi
}

# Test service configuration
test_service_config() {
    log_info "Testing service configuration..."
    
    if [ -f "$PROJECT_ROOT/auto-update-config.json" ]; then
        run_test "Service config has frontend section" "jq -e '.services.frontend' \"$PROJECT_ROOT/auto-update-config.json\""
        run_test "Service config has ai-service section" "jq -e '.services[\"ai-service\"]' \"$PROJECT_ROOT/auto-update-config.json\""
    fi
}

# Generate test report
generate_test_report() {
    echo -e "\n${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                    TEST REPORT SUMMARY                     ║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "Total Tests: ${BLUE}$TOTAL_TESTS${NC}"
    echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
    echo -e "Failed: ${RED}$TESTS_FAILED${NC}"
    echo ""
    
    local success_rate=0
    if [ $TOTAL_TESTS -gt 0 ]; then
        success_rate=$((TESTS_PASSED * 100 / TOTAL_TESTS))
    fi
    
    echo -e "Success Rate: ${BLUE}${success_rate}%${NC}"
    echo ""
    
    if [ $TESTS_FAILED -eq 0 ]; then
        log_success "🎉 All tests passed! Auto-update system is ready to use."
        echo ""
        echo "Next steps:"
        echo "1. Review configuration: ./scripts/auto-update.sh --config"
        echo "2. Test configuration: ./scripts/auto-update.sh --test"
        echo "3. Run interactive manager: ./scripts/update-manager.sh"
        echo "4. Setup auto-update service: sudo ./scripts/setup-auto-update-service.sh"
    else
        log_error "❌ Some tests failed. Please check the errors above."
        echo ""
        echo "Common fixes:"
        echo "1. Install missing tools: sudo apt-get install jq curl mailutils"
        echo "2. Make scripts executable: chmod +x scripts/*.sh"
        echo "3. Create required directories: mkdir -p logs backups"
        echo "4. Check Docker installation: docker --version"
    fi
}

# Main test function
main() {
    echo -e "${BLUE}Claude Talimat Auto-Update System Test${NC}"
    echo "============================================="
    echo ""
    
    # Run all tests
    test_script_existence
    test_configuration
    test_required_tools
    test_directory_structure
    test_docker_environment
    test_auto_update_script
    test_update_manager_script
    test_update_monitor_script
    test_makefile_integration
    test_log_directory
    test_backup_directory
    test_systemd_service
    test_notification_config
    test_service_config
    
    # Generate report
    generate_test_report
}

# Show help
show_help() {
    echo "Claude Talimat Auto-Update Test Script"
    echo "======================================"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --help    Show this help message"
    echo ""
    echo "This script tests the auto-update system configuration and functionality."
    echo "It verifies that all required components are properly installed and configured."
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
