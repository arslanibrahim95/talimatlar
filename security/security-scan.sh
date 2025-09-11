#!/bin/bash

# Claude Talimat Security Scanning Script
# Comprehensive security assessment for production deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCAN_DIR="/home/igu/talimatlar"
REPORT_DIR="/home/igu/talimatlar/security/reports"
LOG_FILE="/var/log/security-scan.log"

# Create report directory
mkdir -p "$REPORT_DIR"

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Install security tools
install_security_tools() {
    print_info "Installing security scanning tools..."
    
    # Install Trivy
    if ! command_exists trivy; then
        print_info "Installing Trivy..."
        sudo apt-get update
        sudo apt-get install -y wget apt-transport-https gnupg lsb-release
        wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | sudo apt-key add -
        echo "deb https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main" | sudo tee -a /etc/apt/sources.list.d/trivy.list
        sudo apt-get update
        sudo apt-get install -y trivy
    fi
    
    # Install Semgrep
    if ! command_exists semgrep; then
        print_info "Installing Semgrep..."
        pip3 install semgrep
    fi
    
    # Install Bandit (Python security linter)
    if ! command_exists bandit; then
        print_info "Installing Bandit..."
        pip3 install bandit
    fi
    
    # Install Gosec (Go security scanner)
    if ! command_exists gosec; then
        print_info "Installing Gosec..."
        go install github.com/securecodewarrior/gosec/v2/cmd/gosec@latest
    fi
    
    # Install Safety (Python dependency checker)
    if ! command_exists safety; then
        print_info "Installing Safety..."
        pip3 install safety
    fi
    
    print_status "Security tools installed successfully"
}

# Docker image security scan
scan_docker_images() {
    print_info "Scanning Docker images for vulnerabilities..."
    
    local images=(
        "claude-talimat-frontend:latest"
        "claude-talimat-auth:latest"
        "claude-talimat-document:latest"
        "claude-talimat-analytics:latest"
        "claude-talimat-notification:latest"
    )
    
    for image in "${images[@]}"; do
        print_info "Scanning image: $image"
        
        if docker images | grep -q "$image"; then
            trivy image --format json --output "$REPORT_DIR/trivy-$image.json" "$image"
            trivy image --format table --output "$REPORT_DIR/trivy-$image.txt" "$image"
            print_status "Scan completed for $image"
        else
            print_warning "Image $image not found, skipping..."
        fi
    done
}

# Code security scan
scan_code_security() {
    print_info "Scanning code for security vulnerabilities..."
    
    # Semgrep scan
    print_info "Running Semgrep security scan..."
    semgrep --config=auto --json --output="$REPORT_DIR/semgrep-results.json" "$SCAN_DIR"
    semgrep --config=auto --output="$REPORT_DIR/semgrep-results.txt" "$SCAN_DIR"
    
    # Python security scan
    if [ -d "$SCAN_DIR/services/document-service" ] || [ -d "$SCAN_DIR/services/analytics-service" ]; then
        print_info "Running Python security scan with Bandit..."
        
        for service in document-service analytics-service; do
            if [ -d "$SCAN_DIR/services/$service" ]; then
                bandit -r "$SCAN_DIR/services/$service" -f json -o "$REPORT_DIR/bandit-$service.json" || true
                bandit -r "$SCAN_DIR/services/$service" -f txt -o "$REPORT_DIR/bandit-$service.txt" || true
            fi
        done
    fi
    
    # Go security scan
    if [ -d "$SCAN_DIR/services/notification-service" ]; then
        print_info "Running Go security scan with Gosec..."
        gosec -fmt json -out "$REPORT_DIR/gosec-results.json" "$SCAN_DIR/services/notification-service/..." || true
        gosec -fmt text -out "$REPORT_DIR/gosec-results.txt" "$SCAN_DIR/services/notification-service/..." || true
    fi
    
    # JavaScript/TypeScript security scan
    if [ -d "$SCAN_DIR/frontend" ]; then
        print_info "Running JavaScript/TypeScript security scan..."
        cd "$SCAN_DIR/frontend"
        
        # ESLint security rules
        if [ -f "package.json" ]; then
            npm audit --json > "$REPORT_DIR/npm-audit.json" || true
            npm audit > "$REPORT_DIR/npm-audit.txt" || true
        fi
        
        cd "$SCAN_DIR"
    fi
    
    print_status "Code security scan completed"
}

# Dependency security scan
scan_dependencies() {
    print_info "Scanning dependencies for vulnerabilities..."
    
    # Python dependencies
    for service in document-service analytics-service; do
        if [ -f "$SCAN_DIR/services/$service/requirements.txt" ]; then
            print_info "Scanning Python dependencies for $service..."
            safety check --json --output "$REPORT_DIR/safety-$service.json" || true
            safety check --output "$REPORT_DIR/safety-$service.txt" || true
        fi
    done
    
    # Node.js dependencies
    if [ -f "$SCAN_DIR/frontend/package.json" ]; then
        print_info "Scanning Node.js dependencies..."
        cd "$SCAN_DIR/frontend"
        npm audit --json > "$REPORT_DIR/npm-audit.json" || true
        npm audit > "$REPORT_DIR/npm-audit.txt" || true
        cd "$SCAN_DIR"
    fi
    
    # Go dependencies
    if [ -d "$SCAN_DIR/services/notification-service" ]; then
        print_info "Scanning Go dependencies..."
        cd "$SCAN_DIR/services/notification-service"
        go list -json -m all > "$REPORT_DIR/go-dependencies.json" || true
        cd "$SCAN_DIR"
    fi
    
    print_status "Dependency security scan completed"
}

# Configuration security scan
scan_configuration() {
    print_info "Scanning configuration files for security issues..."
    
    # Check for hardcoded secrets
    print_info "Checking for hardcoded secrets..."
    grep -r -i "password\|secret\|key\|token" "$SCAN_DIR" --include="*.yml" --include="*.yaml" --include="*.json" --include="*.env*" | grep -v ".git" > "$REPORT_DIR/hardcoded-secrets.txt" || true
    
    # Check file permissions
    print_info "Checking file permissions..."
    find "$SCAN_DIR" -type f -perm /o+w -not -path "*/.git/*" > "$REPORT_DIR/world-writable-files.txt" || true
    
    # Check for sensitive files
    print_info "Checking for sensitive files..."
    find "$SCAN_DIR" -name "*.pem" -o -name "*.key" -o -name "*.p12" -o -name "*.pfx" -not -path "*/.git/*" > "$REPORT_DIR/sensitive-files.txt" || true
    
    # Check Docker configuration
    print_info "Checking Docker configuration security..."
    if [ -f "$SCAN_DIR/docker-compose.prod.yml" ]; then
        docker-compose -f "$SCAN_DIR/docker-compose.prod.yml" config > "$REPORT_DIR/docker-config.yml" || true
    fi
    
    print_status "Configuration security scan completed"
}

# Network security scan
scan_network_security() {
    print_info "Scanning network security..."
    
    # Check open ports
    print_info "Checking open ports..."
    netstat -tuln > "$REPORT_DIR/open-ports.txt" || true
    
    # Check listening services
    print_info "Checking listening services..."
    ss -tuln > "$REPORT_DIR/listening-services.txt" || true
    
    # Check firewall status
    print_info "Checking firewall status..."
    if command_exists ufw; then
        ufw status verbose > "$REPORT_DIR/ufw-status.txt" || true
    fi
    
    if command_exists iptables; then
        iptables -L -n > "$REPORT_DIR/iptables-rules.txt" || true
    fi
    
    print_status "Network security scan completed"
}

# Generate security report
generate_security_report() {
    print_info "Generating comprehensive security report..."
    
    local report_file="$REPORT_DIR/security-report-$(date +%Y%m%d_%H%M%S).md"
    
    cat > "$report_file" << EOF
# 🔒 Claude Talimat Security Assessment Report

**Generated:** $(date)
**Scan Duration:** $(date -d @$SECONDS -u +%H:%M:%S)
**Target:** $SCAN_DIR

## 📊 Executive Summary

This report contains the results of a comprehensive security assessment of the Claude Talimat application.

## 🔍 Scan Results

### Docker Image Vulnerabilities
EOF

    # Add Trivy results
    if [ -f "$REPORT_DIR/trivy-claude-talimat-frontend:latest.txt" ]; then
        echo "#### Frontend Image" >> "$report_file"
        echo '```' >> "$report_file"
        cat "$REPORT_DIR/trivy-claude-talimat-frontend:latest.txt" >> "$report_file"
        echo '```' >> "$report_file"
        echo "" >> "$report_file"
    fi

    cat >> "$report_file" << EOF

### Code Security Issues
EOF

    # Add Semgrep results
    if [ -f "$REPORT_DIR/semgrep-results.txt" ]; then
        echo "#### Static Analysis (Semgrep)" >> "$report_file"
        echo '```' >> "$report_file"
        head -50 "$REPORT_DIR/semgrep-results.txt" >> "$report_file"
        echo '```' >> "$report_file"
        echo "" >> "$report_file"
    fi

    cat >> "$report_file" << EOF

### Dependency Vulnerabilities
EOF

    # Add dependency scan results
    if [ -f "$REPORT_DIR/npm-audit.txt" ]; then
        echo "#### Node.js Dependencies" >> "$report_file"
        echo '```' >> "$report_file"
        cat "$REPORT_DIR/npm-audit.txt" >> "$report_file"
        echo '```' >> "$report_file"
        echo "" >> "$report_file"
    fi

    cat >> "$report_file" << EOF

### Configuration Issues
EOF

    # Add configuration issues
    if [ -f "$REPORT_DIR/hardcoded-secrets.txt" ]; then
        echo "#### Hardcoded Secrets" >> "$report_file"
        echo '```' >> "$report_file"
        cat "$REPORT_DIR/hardcoded-secrets.txt" >> "$report_file"
        echo '```' >> "$report_file"
        echo "" >> "$report_file"
    fi

    cat >> "$report_file" << EOF

## 🎯 Recommendations

1. **Immediate Actions:**
   - Review and fix all critical vulnerabilities
   - Remove hardcoded secrets from configuration files
   - Update dependencies with known vulnerabilities

2. **Short-term Actions:**
   - Implement automated security scanning in CI/CD pipeline
   - Set up security monitoring and alerting
   - Conduct regular security assessments

3. **Long-term Actions:**
   - Implement security training for development team
   - Establish security review process for code changes
   - Consider implementing additional security tools

## 📁 Detailed Reports

- Docker Image Scans: \`$REPORT_DIR/trivy-*.json\`
- Code Security Scans: \`$REPORT_DIR/semgrep-results.json\`
- Dependency Scans: \`$REPORT_DIR/*-audit.json\`
- Configuration Scans: \`$REPORT_DIR/*.txt\`

## 🔗 Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
- [Nginx Security Configuration](https://nginx.org/en/docs/http/ngx_http_core_module.html)

---
*Report generated by Claude Talimat Security Scanner*
EOF

    print_status "Security report generated: $report_file"
}

# Main function
main() {
    print_info "Starting comprehensive security scan..."
    print_info "Scan directory: $SCAN_DIR"
    print_info "Report directory: $REPORT_DIR"
    
    # Install security tools
    install_security_tools
    
    # Run security scans
    scan_docker_images
    scan_code_security
    scan_dependencies
    scan_configuration
    scan_network_security
    
    # Generate report
    generate_security_report
    
    print_status "Security scan completed successfully!"
    print_info "Reports saved to: $REPORT_DIR"
    print_info "Log file: $LOG_FILE"
}

# Run main function
main "$@"
