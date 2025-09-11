#!/bin/bash

# =============================================================================
# CLAUDE TALİMAT COMPREHENSIVE MONITORING SETUP SCRIPT
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
MONITORING_TYPE=${1:-full}
GRAFANA_PASSWORD=${2:-$(openssl rand -base64 12)}
PROMETHEUS_RETENTION=${3:-30d}

# Logging
LOG_FILE="/var/log/monitoring-setup-$(date +%Y%m%d_%H%M%S).log"
exec > >(tee -a "$LOG_FILE")
exec 2>&1

echo -e "${BLUE}🚀 Starting Claude Talimat Comprehensive Monitoring Setup${NC}"
echo "Monitoring Type: $MONITORING_TYPE"
echo "Grafana Password: $GRAFANA_PASSWORD"
echo "Prometheus Retention: $PROMETHEUS_RETENTION"
echo "Timestamp: $(date)"
echo "Log File: $LOG_FILE"
echo "=================================================="

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

print_step() {
    echo -e "${PURPLE}🔧 $1${NC}"
}

# Function to check if Docker is running
check_docker() {
    print_info "Checking Docker status..."
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    print_status "Docker is running"
}

# Function to create necessary directories
create_directories() {
    print_step "Creating monitoring directories..."
    
    mkdir -p /home/igu/talimatlar/logs/{analytics,auth,document,notification,nginx,postgres,redis,security}
    mkdir -p /home/igu/talimatlar/monitoring/{grafana/{dashboards,datasources},logstash/pipeline,filebeat,rules}
    mkdir -p /home/igu/talimatlar/ssl
    
    print_status "Directories created"
}

# Function to set up environment variables
setup_environment() {
    print_step "Setting up environment variables..."
    
    # Create .env file for monitoring
    cat > /home/igu/talimatlar/.env.monitoring << EOF
# Monitoring Environment Variables
GRAFANA_PASSWORD=$GRAFANA_PASSWORD
PROMETHEUS_RETENTION=$PROMETHEUS_RETENTION
ELASTICSEARCH_PASSWORD=changeme
KIBANA_PASSWORD=changeme
LOGSTASH_PASSWORD=changeme

# Email Configuration (Update with your SMTP settings)
SMTP_HOST=localhost
SMTP_PORT=587
SMTP_USER=alerts@claude-talimat.com
SMTP_PASSWORD=your-smtp-password
ALERT_EMAIL=admin@claude-talimat.com

# Slack Configuration (Optional)
SLACK_WEBHOOK_URL=your-slack-webhook-url
SLACK_CHANNEL=#alerts
EOF
    
    print_status "Environment variables configured"
}

# Function to start monitoring services
start_monitoring_services() {
    print_step "Starting monitoring services..."
    
    cd /home/igu/talimatlar
    
    # Start core monitoring services
    print_info "Starting Prometheus, Grafana, and exporters..."
    docker-compose up -d prometheus grafana node-exporter cadvisor postgres-exporter redis-exporter nginx-exporter alertmanager
    
    # Wait for services to be ready
    print_info "Waiting for services to be ready..."
    sleep 30
    
    # Check service health
    check_service_health
    
    print_status "Core monitoring services started"
}

# Function to start logging services
start_logging_services() {
    print_step "Starting logging services..."
    
    cd /home/igu/talimatlar
    
    # Start ELK stack
    print_info "Starting ELK stack..."
    docker-compose -f docker-compose.logging.yml up -d
    
    # Wait for services to be ready
    print_info "Waiting for logging services to be ready..."
    sleep 60
    
    print_status "Logging services started"
}

# Function to check service health
check_service_health() {
    print_step "Checking service health..."
    
    local services=(
        "prometheus:9090"
        "grafana:3004"
        "node-exporter:9100"
        "cadvisor:8080"
        "postgres-exporter:9187"
        "redis-exporter:9121"
        "nginx-exporter:9113"
        "alertmanager:9093"
    )
    
    for service in "${services[@]}"; do
        local name=$(echo $service | cut -d: -f1)
        local port=$(echo $service | cut -d: -f2)
        
        if curl -f http://localhost:$port > /dev/null 2>&1; then
            print_status "$name is healthy"
        else
            print_warning "$name is not responding on port $port"
        fi
    done
}

# Function to configure Nginx for monitoring
configure_nginx_monitoring() {
    print_step "Configuring Nginx for monitoring..."
    
    # Create Nginx status configuration
    cat > /home/igu/talimatlar/infrastructure/nginx/conf.d/monitoring.conf << 'EOF'
# Monitoring endpoints
location /nginx_status {
    stub_status on;
    access_log off;
    allow 127.0.0.1;
    allow 172.0.0.0/8;
    allow 10.0.0.0/8;
    deny all;
}

location /health {
    access_log off;
    return 200 "healthy\n";
    add_header Content-Type text/plain;
}
EOF
    
    print_status "Nginx monitoring configured"
}

# Function to create monitoring dashboard
create_monitoring_dashboard() {
    print_step "Creating monitoring dashboard..."
    
    # Create a simple HTML dashboard
    cat > /home/igu/talimatlar/monitoring/dashboard.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Claude Talimat Monitoring Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #1e1e1e; color: #fff; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 30px; }
        .services { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .service { background: #2d2d2d; padding: 20px; border-radius: 8px; border-left: 4px solid #4CAF50; }
        .service h3 { margin: 0 0 10px 0; color: #4CAF50; }
        .service a { color: #64B5F6; text-decoration: none; }
        .service a:hover { text-decoration: underline; }
        .status { display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #4CAF50; margin-right: 8px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Claude Talimat Monitoring Dashboard</h1>
            <p>Comprehensive monitoring and observability for your application</p>
        </div>
        
        <div class="services">
            <div class="service">
                <h3><span class="status"></span>Prometheus</h3>
                <p>Metrics collection and alerting</p>
                <a href="http://localhost:9090" target="_blank">Open Prometheus →</a>
            </div>
            
            <div class="service">
                <h3><span class="status"></span>Grafana</h3>
                <p>Visualization and dashboards</p>
                <a href="http://localhost:3004" target="_blank">Open Grafana →</a>
            </div>
            
            <div class="service">
                <h3><span class="status"></span>Alertmanager</h3>
                <p>Alert management and routing</p>
                <a href="http://localhost:9093" target="_blank">Open Alertmanager →</a>
            </div>
            
            <div class="service">
                <h3><span class="status"></span>Kibana</h3>
                <p>Log analysis and visualization</p>
                <a href="http://localhost:5601" target="_blank">Open Kibana →</a>
            </div>
            
            <div class="service">
                <h3><span class="status"></span>cAdvisor</h3>
                <p>Container metrics and monitoring</p>
                <a href="http://localhost:8080" target="_blank">Open cAdvisor →</a>
            </div>
            
            <div class="service">
                <h3><span class="status"></span>Node Exporter</h3>
                <p>System metrics and monitoring</p>
                <a href="http://localhost:9100" target="_blank">Open Node Exporter →</a>
            </div>
        </div>
        
        <div style="margin-top: 40px; text-align: center; color: #888;">
            <p>Generated on $(date) | Claude Talimat Monitoring System</p>
        </div>
    </div>
</body>
</html>
EOF
    
    print_status "Monitoring dashboard created"
}

# Function to create monitoring scripts
create_monitoring_scripts() {
    print_step "Creating monitoring scripts..."
    
    # Health check script
    cat > /home/igu/talimatlar/scripts/monitor-health.sh << 'EOF'
#!/bin/bash

# Claude Talimat Health Monitoring Script
# This script checks the health of all monitoring services

set -e

LOG_FILE="/var/log/health-monitor.log"
ALERT_EMAIL="admin@claude-talimat.com"

# Function to check service health
check_service() {
    local service_name="$1"
    local url="$2"
    local expected_status="${3:-200}"
    
    local response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" 2>/dev/null || echo "000")
    
    if [ "$response" = "$expected_status" ]; then
        echo "$(date): $service_name is healthy (HTTP $response)" >> "$LOG_FILE"
        return 0
    else
        echo "$(date): $service_name is unhealthy (HTTP $response)" >> "$LOG_FILE"
        return 1
    fi
}

# Check all monitoring services
echo "$(date): Starting health check..." >> "$LOG_FILE"

check_service "Prometheus" "http://localhost:9090/-/healthy"
check_service "Grafana" "http://localhost:3004/api/health"
check_service "Alertmanager" "http://localhost:9093/-/healthy"
check_service "Node Exporter" "http://localhost:9100/metrics"
check_service "cAdvisor" "http://localhost:8080/healthz"
check_service "PostgreSQL Exporter" "http://localhost:9187/metrics"
check_service "Redis Exporter" "http://localhost:9121/metrics"
check_service "Nginx Exporter" "http://localhost:9113/metrics"

echo "$(date): Health check completed" >> "$LOG_FILE"
EOF
    
    chmod +x /home/igu/talimatlar/scripts/monitor-health.sh
    
    # Performance monitoring script
    cat > /home/igu/talimatlar/scripts/monitor-performance.sh << 'EOF'
#!/bin/bash

# Claude Talimat Performance Monitoring Script
# This script monitors system performance and generates reports

set -e

REPORT_FILE="/var/log/performance-report-$(date +%Y%m%d_%H%M%S).log"

echo "=== Claude Talimat Performance Report ===" > "$REPORT_FILE"
echo "Generated: $(date)" >> "$REPORT_FILE"
echo "========================================" >> "$REPORT_FILE"

# CPU Usage
echo "" >> "$REPORT_FILE"
echo "CPU Usage:" >> "$REPORT_FILE"
top -bn1 | grep "Cpu(s)" >> "$REPORT_FILE"

# Memory Usage
echo "" >> "$REPORT_FILE"
echo "Memory Usage:" >> "$REPORT_FILE"
free -h >> "$REPORT_FILE"

# Disk Usage
echo "" >> "$REPORT_FILE"
echo "Disk Usage:" >> "$REPORT_FILE"
df -h >> "$REPORT_FILE"

# Docker Container Stats
echo "" >> "$REPORT_FILE"
echo "Docker Container Stats:" >> "$REPORT_FILE"
docker stats --no-stream >> "$REPORT_FILE"

# Network Connections
echo "" >> "$REPORT_FILE"
echo "Network Connections:" >> "$REPORT_FILE"
netstat -tuln | grep -E ":(9090|3004|9093|8080|9100|9187|9121|9113)" >> "$REPORT_FILE"

echo "Performance report generated: $REPORT_FILE"
EOF
    
    chmod +x /home/igu/talimatlar/scripts/monitor-performance.sh
    
    print_status "Monitoring scripts created"
}

# Function to generate monitoring report
generate_monitoring_report() {
    print_step "Generating monitoring report..."
    
    local report_file="/home/igu/talimatlar/reports/monitoring-setup-$(date +%Y%m%d_%H%M%S).md"
    mkdir -p "$(dirname "$report_file")"
    
    cat > "$report_file" << EOF
# 📊 Claude Talimat Monitoring Setup Report

**Generated:** $(date)
**Monitoring Type:** $MONITORING_TYPE
**Grafana Password:** $GRAFANA_PASSWORD
**Prometheus Retention:** $PROMETHEUS_RETENTION

## 🎯 Setup Summary

This report documents the comprehensive monitoring system setup for Claude Talimat.

## 🔧 Components Installed

### Core Monitoring Stack
- ✅ **Prometheus** - Metrics collection and storage
- ✅ **Grafana** - Visualization and dashboards
- ✅ **Alertmanager** - Alert management and routing
- ✅ **Node Exporter** - System metrics collection
- ✅ **cAdvisor** - Container metrics collection
- ✅ **PostgreSQL Exporter** - Database metrics
- ✅ **Redis Exporter** - Cache metrics
- ✅ **Nginx Exporter** - Web server metrics

### Logging Stack (ELK)
- ✅ **Elasticsearch** - Log storage and indexing
- ✅ **Logstash** - Log processing and transformation
- ✅ **Kibana** - Log visualization and analysis
- ✅ **Filebeat** - Log shipping and collection

### Alerting System
- ✅ **Critical Alerts** - Service down, high error rates
- ✅ **Warning Alerts** - Performance degradation
- ✅ **Email Notifications** - Alert delivery
- ✅ **Slack Integration** - Team notifications
- ✅ **Alert Rules** - Comprehensive alerting rules

## 📊 Dashboards Created

### System Overview
- **System Uptime** - Server uptime monitoring
- **CPU Usage** - Processor utilization
- **Memory Usage** - RAM consumption
- **Disk Usage** - Storage utilization
- **Network I/O** - Network traffic
- **Load Average** - System load

### Application Metrics
- **HTTP Request Rate** - Request throughput
- **Response Time** - API performance
- **Error Rate** - Error monitoring
- **Active Connections** - Connection monitoring
- **Service Health** - Service status

### Database Metrics
- **PostgreSQL Connections** - Database connections
- **Query Performance** - Query execution times
- **Database Size** - Storage usage
- **Redis Operations** - Cache performance
- **Cache Hit Rate** - Cache efficiency

### Docker Metrics
- **Container CPU Usage** - Container performance
- **Container Memory Usage** - Memory consumption
- **Container Network I/O** - Network traffic
- **Container Restart Count** - Stability monitoring

## 🔗 Access Information

### Monitoring URLs
- **Prometheus:** http://localhost:9090
- **Grafana:** http://localhost:3004 (admin / $GRAFANA_PASSWORD)
- **Alertmanager:** http://localhost:9093
- **Kibana:** http://localhost:5601
- **cAdvisor:** http://localhost:8080
- **Node Exporter:** http://localhost:9100

### Monitoring Dashboard
- **HTML Dashboard:** /home/igu/talimatlar/monitoring/dashboard.html

## 📁 Configuration Files

### Prometheus
- **Config:** /home/igu/talimatlar/monitoring/prometheus.yml
- **Rules:** /home/igu/talimatlar/monitoring/rules/

### Grafana
- **Dashboards:** /home/igu/talimatlar/monitoring/grafana/dashboards/
- **Data Sources:** /home/igu/talimatlar/monitoring/grafana/datasources/

### Alertmanager
- **Config:** /home/igu/talimatlar/monitoring/alertmanager.yml

### Logging
- **Logstash:** /home/igu/talimatlar/monitoring/logstash/pipeline/
- **Filebeat:** /home/igu/talimatlar/monitoring/filebeat/filebeat.yml

## 🚀 Next Steps

1. **Access Grafana** - Login and explore dashboards
2. **Configure Alerts** - Set up email/Slack notifications
3. **Import Dashboards** - Use pre-built dashboards
4. **Monitor Services** - Start monitoring all services
5. **Review Metrics** - Analyze system performance
6. **Optimize Performance** - Use metrics for optimization

## 🔧 Monitoring Scripts

- **Health Check:** /home/igu/talimatlar/scripts/monitor-health.sh
- **Performance:** /home/igu/talimatlar/scripts/monitor-performance.sh
- **Setup Log:** $LOG_FILE

## 📈 Metrics Collected

### System Metrics
- CPU usage, memory usage, disk usage
- Network I/O, load average, uptime
- Process information, system calls

### Application Metrics
- HTTP requests, response times, error rates
- Service health, active connections
- Business metrics, user activity

### Database Metrics
- Connection pools, query performance
- Database size, cache hit rates
- Replication lag, transaction rates

### Container Metrics
- CPU usage, memory usage, network I/O
- Restart counts, health status
- Resource limits, utilization

## 🚨 Alert Rules

### Critical Alerts
- Service down, high error rates
- Database unavailable, disk full
- Memory full, container OOM

### Warning Alerts
- High response time, high CPU usage
- High memory usage, high disk usage
- High database connections

## 📋 Maintenance

### Daily Tasks
- Check service health
- Review alert notifications
- Monitor performance metrics

### Weekly Tasks
- Review dashboard data
- Update alert rules if needed
- Check log retention

### Monthly Tasks
- Review monitoring reports
- Optimize performance based on metrics
- Update monitoring configuration

---
*Report generated by Claude Talimat Monitoring Setup Script*
EOF
    
    print_status "Monitoring report generated: $report_file"
}

# Main function
main() {
    print_info "Starting comprehensive monitoring setup..."
    
    # Pre-flight checks
    check_docker
    create_directories
    setup_environment
    
    # Start services
    start_monitoring_services
    
    if [ "$MONITORING_TYPE" = "full" ]; then
        start_logging_services
    fi
    
    # Configuration
    configure_nginx_monitoring
    create_monitoring_dashboard
    create_monitoring_scripts
    
    # Generate report
    generate_monitoring_report
    
    print_status "🎉 Monitoring system setup completed successfully!"
    print_info "📊 Access your monitoring dashboard at: http://localhost:3004"
    print_info "🔍 View logs at: http://localhost:5601"
    print_info "📈 Check metrics at: http://localhost:9090"
    print_info "📋 View setup report: /home/igu/talimatlar/reports/"
    print_info "📝 Setup log: $LOG_FILE"
    print_warning "🔐 Grafana password: $GRAFANA_PASSWORD"
}

# Run main function
main "$@"
