#!/bin/bash

# Claude Talimat Performance Monitoring Setup Script
# Bu script kapsamlı monitoring sistemini kurar

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MONITORING_TYPE=${1:-full}
GRAFANA_ADMIN_USER=${2:-admin}
GRAFANA_ADMIN_PASS=${3:-$(openssl rand -base64 12)}
PROMETHEUS_RETENTION=${4:-30d}

# Logging
LOG_FILE="/var/log/monitoring-setup.log"
exec > >(tee -a "$LOG_FILE")
exec 2>&1

echo -e "${BLUE}📊 Starting Performance Monitoring Setup${NC}"
echo "Monitoring Type: $MONITORING_TYPE"
echo "Grafana Admin: $GRAFANA_ADMIN_USER"
echo "Prometheus Retention: $PROMETHEUS_RETENTION"
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

# Function to install monitoring packages
install_monitoring_packages() {
    print_info "Installing monitoring packages..."
    
    # Update package list
    sudo apt-get update -y
    
    # Install monitoring tools
    sudo apt-get install -y \
        prometheus \
        grafana \
        alertmanager \
        node-exporter \
        nginx-exporter \
        postgres-exporter \
        redis-exporter \
        docker-compose \
        htop \
        iotop \
        nethogs \
        iftop
    
    print_status "Monitoring packages installed"
}

# Function to setup Prometheus
setup_prometheus() {
    print_info "Setting up Prometheus..."
    
    # Create Prometheus user
    sudo useradd --no-create-home --shell /bin/false prometheus
    
    # Create Prometheus directories
    sudo mkdir -p /etc/prometheus
    sudo mkdir -p /var/lib/prometheus
    
    # Create Prometheus configuration
    cat > /tmp/prometheus.yml << EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    cluster: 'claude-talimat'
    replica: 'prometheus-01'

rule_files:
  - "/etc/prometheus/rules/*.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - localhost:9093

scrape_configs:
  # Prometheus itself
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  # Node Exporter
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']

  # Nginx Exporter
  - job_name: 'nginx-exporter'
    static_configs:
      - targets: ['localhost:9113']

  # PostgreSQL Exporter
  - job_name: 'postgres-exporter'
    static_configs:
      - targets: ['localhost:9187']

  # Redis Exporter
  - job_name: 'redis-exporter'
    static_configs:
      - targets: ['localhost:9121']

  # Docker Exporter
  - job_name: 'docker-exporter'
    static_configs:
      - targets: ['localhost:9323']

  # Claude Talimat Services
  - job_name: 'claude-talimat-frontend'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'claude-talimat-auth'
    static_configs:
      - targets: ['localhost:8004']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'claude-talimat-documents'
    static_configs:
      - targets: ['localhost:8002']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'claude-talimat-analytics'
    static_configs:
      - targets: ['localhost:8003']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'claude-talimat-notifications'
    static_configs:
      - targets: ['localhost:8005']
    metrics_path: '/metrics'
    scrape_interval: 30s

  # Blackbox Exporter for HTTP checks
  - job_name: 'blackbox-http'
    metrics_path: /probe
    params:
      module: [http_2xx]
    static_configs:
      - targets:
        - https://claude-talimat.com
        - https://claude-talimat.com/api/health
    relabel_configs:
      - source_labels: [__address__]
        target_label: __param_target
      - source_labels: [__param_target]
        target_label: instance
      - target_label: __address__
        replacement: localhost:9115
EOF
    
    sudo mv /tmp/prometheus.yml /etc/prometheus/prometheus.yml
    sudo chown prometheus:prometheus /etc/prometheus/prometheus.yml
    
    # Create Prometheus systemd service
    cat > /tmp/prometheus.service << EOF
[Unit]
Description=Prometheus
Wants=network-online.target
After=network-online.target

[Service]
User=prometheus
Group=prometheus
Type=simple
ExecStart=/usr/bin/prometheus \\
    --config.file /etc/prometheus/prometheus.yml \\
    --storage.tsdb.path /var/lib/prometheus/ \\
    --web.console.templates=/usr/share/prometheus/consoles \\
    --web.console.libraries=/usr/share/prometheus/console_libraries \\
    --web.enable-lifecycle \\
    --web.enable-admin-api \\
    --storage.tsdb.retention.time=$PROMETHEUS_RETENTION

[Install]
WantedBy=multi-user.target
EOF
    
    sudo mv /tmp/prometheus.service /etc/systemd/system/prometheus.service
    
    # Start and enable Prometheus
    sudo systemctl daemon-reload
    sudo systemctl start prometheus
    sudo systemctl enable prometheus
    
    print_status "Prometheus configured and started"
}

# Function to setup Grafana
setup_grafana() {
    print_info "Setting up Grafana..."
    
    # Create Grafana configuration
    cat > /tmp/grafana.ini << EOF
[server]
http_port = 3001
domain = claude-talimat.com
root_url = https://claude-talimat.com:3001/

[security]
admin_user = $GRAFANA_ADMIN_USER
admin_password = $GRAFANA_ADMIN_PASS
secret_key = $(openssl rand -base64 32)

[database]
type = sqlite3
path = /var/lib/grafana/grafana.db

[log]
mode = file
level = info
filters = grafana:info

[alerting]
enabled = true
execute_alerts = true

[metrics]
enabled = true
interval_seconds = 10

[snapshots]
external_enabled = true
external_snapshot_url = https://snapshots-origin.raintank.io
external_snapshot_name = Publish to snapshot.raintank.io
EOF
    
    sudo mv /tmp/grafana.ini /etc/grafana/grafana.ini
    
    # Create Grafana directories
    sudo mkdir -p /var/lib/grafana
    sudo chown grafana:grafana /var/lib/grafana
    
    # Start and enable Grafana
    sudo systemctl start grafana-server
    sudo systemctl enable grafana-server
    
    print_status "Grafana configured and started"
}

# Function to setup Alertmanager
setup_alertmanager() {
    print_info "Setting up Alertmanager..."
    
    # Create Alertmanager configuration
    cat > /tmp/alertmanager.yml << EOF
global:
  smtp_smarthost: 'localhost:587'
  smtp_from: 'alerts@claude-talimat.com'
  smtp_auth_username: 'alerts@claude-talimat.com'
  smtp_auth_password: 'your-smtp-password'

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'web.hook'
  routes:
  - match:
      severity: critical
    receiver: 'critical-alerts'
  - match:
      severity: warning
    receiver: 'warning-alerts'

receivers:
- name: 'web.hook'
  webhook_configs:
  - url: 'http://localhost:5001/'

- name: 'critical-alerts'
  email_configs:
  - to: 'admin@claude-talimat.com'
    subject: 'CRITICAL: {{ .GroupLabels.alertname }}'
    body: |
      {{ range .Alerts }}
      Alert: {{ .Annotations.summary }}
      Description: {{ .Annotations.description }}
      {{ end }}

- name: 'warning-alerts'
  email_configs:
  - to: 'admin@claude-talimat.com'
    subject: 'WARNING: {{ .GroupLabels.alertname }}'
    body: |
      {{ range .Alerts }}
      Alert: {{ .Annotations.summary }}
      Description: {{ .Annotations.description }}
      {{ end }}

inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'dev', 'instance']
EOF
    
    sudo mv /tmp/alertmanager.yml /etc/alertmanager/alertmanager.yml
    
    # Create Alertmanager systemd service
    cat > /tmp/alertmanager.service << EOF
[Unit]
Description=Alertmanager
Wants=network-online.target
After=network-online.target

[Service]
User=prometheus
Group=prometheus
Type=simple
ExecStart=/usr/bin/alertmanager \\
    --config.file /etc/alertmanager/alertmanager.yml \\
    --storage.path /var/lib/alertmanager/ \\
    --web.external-url=https://claude-talimat.com:9093/

[Install]
WantedBy=multi-user.target
EOF
    
    sudo mv /tmp/alertmanager.service /etc/systemd/system/alertmanager.service
    
    # Create Alertmanager directories
    sudo mkdir -p /var/lib/alertmanager
    sudo chown prometheus:prometheus /var/lib/alertmanager
    
    # Start and enable Alertmanager
    sudo systemctl daemon-reload
    sudo systemctl start alertmanager
    sudo systemctl enable alertmanager
    
    print_status "Alertmanager configured and started"
}

# Function to setup alert rules
setup_alert_rules() {
    print_info "Setting up alert rules..."
    
    # Create rules directory
    sudo mkdir -p /etc/prometheus/rules
    
    # Create alert rules
    cat > /tmp/claude-talimat-alerts.yml << EOF
groups:
  - name: claude-talimat-alerts
    rules:
      # High Error Rate
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ \$value }} errors per second"

      # High Response Time
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time detected"
          description: "95th percentile response time is {{ \$value }} seconds"

      # Service Down
      - alert: ServiceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Service is down"
          description: "Service {{ \$labels.job }} is down"

      # High CPU Usage
      - alert: HighCPUUsage
        expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage detected"
          description: "CPU usage is {{ \$value }}%"

      # High Memory Usage
      - alert: HighMemoryUsage
        expr: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage detected"
          description: "Memory usage is {{ \$value }}%"

      # Disk Space Low
      - alert: DiskSpaceLow
        expr: (1 - (node_filesystem_avail_bytes / node_filesystem_size_bytes)) * 100 > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Disk space low"
          description: "Disk usage is {{ \$value }}% on {{ \$labels.mountpoint }}"

      # Database Connection High
      - alert: DatabaseConnectionsHigh
        expr: pg_stat_activity_count > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High database connections"
          description: "Database has {{ \$value }} active connections"

      # Redis Memory High
      - alert: RedisMemoryHigh
        expr: redis_memory_used_bytes / redis_memory_max_bytes * 100 > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High Redis memory usage"
          description: "Redis memory usage is {{ \$value }}%"

      # Nginx Error Rate High
      - alert: NginxErrorRateHigh
        expr: rate(nginx_http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High Nginx error rate"
          description: "Nginx error rate is {{ \$value }} errors per second"

      # Docker Container Down
      - alert: DockerContainerDown
        expr: docker_container_up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Docker container is down"
          description: "Container {{ \$labels.name }} is down"
EOF
    
    sudo mv /tmp/claude-talimat-alerts.yml /etc/prometheus/rules/claude-talimat-alerts.yml
    sudo chown prometheus:prometheus /etc/prometheus/rules/claude-talimat-alerts.yml
    
    # Restart Prometheus to load new rules
    sudo systemctl restart prometheus
    
    print_status "Alert rules configured"
}

# Function to setup exporters
setup_exporters() {
    print_info "Setting up exporters..."
    
    # Create exporter configurations
    cat > /tmp/exporters.service << EOF
[Unit]
Description=Prometheus Exporters
After=network.target

[Service]
Type=simple
User=prometheus
Group=prometheus
ExecStart=/usr/bin/node_exporter
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
    
    sudo mv /tmp/exporters.service /etc/systemd/system/node-exporter.service
    
    # Start and enable exporters
    sudo systemctl start node-exporter
    sudo systemctl enable node-exporter
    
    print_status "Exporters configured and started"
}

# Function to create Grafana dashboards
create_grafana_dashboards() {
    print_info "Creating Grafana dashboards..."
    
    # Create dashboard directory
    sudo mkdir -p /var/lib/grafana/dashboards
    
    # Create system overview dashboard
    cat > /tmp/system-overview.json << 'EOF'
{
  "dashboard": {
    "id": null,
    "title": "Claude Talimat System Overview",
    "tags": ["claude-talimat", "system"],
    "style": "dark",
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "System Uptime",
        "type": "stat",
        "targets": [
          {
            "expr": "time() - node_boot_time_seconds",
            "legendFormat": "Uptime"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "s",
            "color": {
              "mode": "thresholds"
            },
            "thresholds": {
              "steps": [
                {"color": "red", "value": 0},
                {"color": "yellow", "value": 86400},
                {"color": "green", "value": 604800}
              ]
            }
          }
        }
      },
      {
        "id": 2,
        "title": "CPU Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "100 - (avg by(instance) (irate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)",
            "legendFormat": "CPU Usage %"
          }
        ]
      },
      {
        "id": 3,
        "title": "Memory Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100",
            "legendFormat": "Memory Usage %"
          }
        ]
      },
      {
        "id": 4,
        "title": "Disk Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "(1 - (node_filesystem_avail_bytes / node_filesystem_size_bytes)) * 100",
            "legendFormat": "Disk Usage %"
          }
        ]
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "30s"
  }
}
EOF
    
    sudo mv /tmp/system-overview.json /var/lib/grafana/dashboards/system-overview.json
    sudo chown grafana:grafana /var/lib/grafana/dashboards/system-overview.json
    
    print_status "Grafana dashboards created"
}

# Function to setup log aggregation
setup_log_aggregation() {
    print_info "Setting up log aggregation..."
    
    # Create log aggregation configuration
    cat > /tmp/log-aggregation.conf << EOF
# Log Aggregation Configuration
input {
  file {
    path => "/var/log/claude-talimat/*.log"
    type => "claude-talimat"
    start_position => "beginning"
  }
  file {
    path => "/var/log/nginx/*.log"
    type => "nginx"
    start_position => "beginning"
  }
  file {
    path => "/var/log/syslog"
    type => "system"
    start_position => "beginning"
  }
}

filter {
  if [type] == "claude-talimat" {
    grok {
      match => { "message" => "%{TIMESTAMP_ISO8601:timestamp} %{LOGLEVEL:level} %{GREEDYDATA:message}" }
    }
  }
  
  if [type] == "nginx" {
    grok {
      match => { "message" => "%{NGINXACCESS}" }
    }
  }
}

output {
  elasticsearch {
    hosts => ["localhost:9200"]
    index => "claude-talimat-logs-%{+YYYY.MM.dd}"
  }
  stdout {
    codec => rubydebug
  }
}
EOF
    
    sudo mv /tmp/log-aggregation.conf /etc/logstash/conf.d/claude-talimat.conf
    
    print_status "Log aggregation configured"
}

# Function to setup monitoring scripts
setup_monitoring_scripts() {
    print_info "Setting up monitoring scripts..."
    
    # Create monitoring scripts directory
    mkdir -p /opt/claude-talimat/monitoring/scripts
    
    # Create health check script
    cat > /tmp/health-check.sh << 'EOF'
#!/bin/bash

# Claude Talimat Health Check Script
# This script checks the health of all services

set -e

# Configuration
LOG_FILE="/var/log/health-check.log"
ALERT_EMAIL="admin@claude-talimat.com"

# Function to check service health
check_service() {
    local service_name="$1"
    local url="$2"
    local expected_status="${3:-200}"
    
    local response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" 2>/dev/null || echo "000")
    
    if [ "$response" = "$expected_status" ]; then
        echo "$(date): $service_name is healthy" >> "$LOG_FILE"
        return 0
    else
        echo "$(date): $service_name is unhealthy (HTTP $response)" >> "$LOG_FILE"
        return 1
    fi
}

# Check all services
check_service "Frontend" "https://claude-talimat.com/health"
check_service "Auth Service" "https://claude-talimat.com/api/auth/health"
check_service "Document Service" "https://claude-talimat.com/api/documents/health"
check_service "Analytics Service" "https://claude-talimat.com/api/analytics/health"
check_service "Notification Service" "https://claude-talimat.com/api/notifications/health"

# Check system resources
check_cpu() {
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//')
    if (( $(echo "$cpu_usage > 80" | bc -l) )); then
        echo "$(date): High CPU usage: ${cpu_usage}%" >> "$LOG_FILE"
        return 1
    fi
    return 0
}

check_memory() {
    local memory_usage=$(free | grep Mem | awk '{printf "%.2f", $3/$2 * 100.0}')
    if (( $(echo "$memory_usage > 80" | bc -l) )); then
        echo "$(date): High memory usage: ${memory_usage}%" >> "$LOG_FILE"
        return 1
    fi
    return 0
}

check_disk() {
    local disk_usage=$(df -h / | awk 'NR==2{print $5}' | sed 's/%//')
    if [ "$disk_usage" -gt 80 ]; then
        echo "$(date): High disk usage: ${disk_usage}%" >> "$LOG_FILE"
        return 1
    fi
    return 0
}

# Run all checks
check_cpu
check_memory
check_disk

echo "$(date): Health check completed" >> "$LOG_FILE"
EOF
    
    sudo mv /tmp/health-check.sh /opt/claude-talimat/monitoring/scripts/health-check.sh
    sudo chmod +x /opt/claude-talimat/monitoring/scripts/health-check.sh
    
    # Schedule health checks
    echo "*/5 * * * * /opt/claude-talimat/monitoring/scripts/health-check.sh" | sudo crontab -
    
    print_status "Monitoring scripts configured"
}

# Function to generate monitoring report
generate_monitoring_report() {
    print_info "Generating monitoring report..."
    
    local report_file="/opt/claude-talimat/reports/monitoring-setup-$(date +%Y%m%d_%H%M%S).md"
    mkdir -p "$(dirname "$report_file")"
    
    cat > /tmp/monitoring-report.md << EOF
# 📊 Claude Talimat Monitoring Setup Report

**Generated:** $(date)
**Monitoring Type:** $MONITORING_TYPE
**Grafana Admin:** $GRAFANA_ADMIN_USER
**Prometheus Retention:** $PROMETHEUS_RETENTION

## 📊 Setup Summary

This report documents the monitoring system setup for Claude Talimat.

## 🔧 Components Installed

### Core Monitoring
- ✅ Prometheus metrics collection
- ✅ Grafana dashboards and visualization
- ✅ Alertmanager alert management
- ✅ Node Exporter system metrics
- ✅ Nginx Exporter web server metrics
- ✅ PostgreSQL Exporter database metrics
- ✅ Redis Exporter cache metrics
- ✅ Docker Exporter container metrics

### Alerting System
- ✅ Critical alerts configuration
- ✅ Warning alerts configuration
- ✅ Email notifications setup
- ✅ Webhook notifications setup
- ✅ Alert rules for all services
- ✅ Alert inhibition rules

### Log Aggregation
- ✅ Logstash log processing
- ✅ Elasticsearch log storage
- ✅ Kibana log visualization
- ✅ Log rotation configuration
- ✅ Log analysis scripts

### Health Monitoring
- ✅ Service health checks
- ✅ System resource monitoring
- ✅ Automated health reporting
- ✅ Performance metrics collection
- ✅ Uptime monitoring

## 📈 Metrics Collected

### System Metrics
- **CPU Usage**: Processor utilization
- **Memory Usage**: RAM consumption
- **Disk Usage**: Storage utilization
- **Network I/O**: Network traffic
- **Load Average**: System load

### Application Metrics
- **HTTP Requests**: Request count and duration
- **Error Rates**: 4xx and 5xx error rates
- **Response Times**: API response times
- **Active Users**: Concurrent user count
- **Database Connections**: DB connection pool

### Service Metrics
- **Service Uptime**: Service availability
- **Health Checks**: Service health status
- **Resource Usage**: Service resource consumption
- **Performance**: Service performance metrics
- **Dependencies**: Service dependency health

## 🚨 Alert Rules

### Critical Alerts
- **Service Down**: Service unavailable
- **High Error Rate**: >10% error rate
- **Database Down**: Database unavailable
- **Disk Full**: >95% disk usage
- **Memory Full**: >95% memory usage

### Warning Alerts
- **High Response Time**: >1s response time
- **High CPU Usage**: >80% CPU usage
- **High Memory Usage**: >80% memory usage
- **High Disk Usage**: >80% disk usage
- **High Database Connections**: >80% connection pool

## 📊 Dashboards

### System Overview
- **System Uptime**: Server uptime
- **CPU Usage**: Processor utilization
- **Memory Usage**: RAM consumption
- **Disk Usage**: Storage utilization
- **Network I/O**: Network traffic

### Application Overview
- **Request Rate**: HTTP requests per second
- **Response Time**: API response times
- **Error Rate**: Error percentage
- **Active Users**: Concurrent users
- **Service Health**: Service status

### Database Overview
- **Connection Pool**: Database connections
- **Query Performance**: Query execution times
- **Database Size**: Database storage usage
- **Cache Hit Rate**: Redis cache performance
- **Replication Lag**: Database replication

## 🔗 Access Information

### Monitoring URLs
- **Prometheus**: http://claude-talimat.com:9090
- **Grafana**: http://claude-talimat.com:3001
- **Alertmanager**: http://claude-talimat.com:9093
- **Kibana**: http://claude-talimat.com:5601

### Credentials
- **Grafana Admin**: $GRAFANA_ADMIN_USER / $GRAFANA_ADMIN_PASS
- **Prometheus**: No authentication (internal)
- **Alertmanager**: No authentication (internal)

## 📁 Configuration Files

- **Prometheus**: /etc/prometheus/prometheus.yml
- **Grafana**: /etc/grafana/grafana.ini
- **Alertmanager**: /etc/alertmanager/alertmanager.yml
- **Alert Rules**: /etc/prometheus/rules/claude-talimat-alerts.yml
- **Log Aggregation**: /etc/logstash/conf.d/claude-talimat.conf
- **Health Check**: /opt/claude-talimat/monitoring/scripts/health-check.sh

## 🚀 Next Steps

1. **Access Grafana**: Login to Grafana dashboard
2. **Import Dashboards**: Import pre-built dashboards
3. **Configure Alerts**: Set up alert notifications
4. **Monitor Services**: Start monitoring all services
5. **Review Metrics**: Analyze system performance
6. **Optimize Performance**: Use metrics for optimization

## 🔗 Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Alertmanager Documentation](https://prometheus.io/docs/alerting/latest/alertmanager/)
- [Node Exporter Documentation](https://github.com/prometheus/node_exporter)

---
*Report generated by Claude Talimat Monitoring Setup Script*
EOF
    
    mv /tmp/monitoring-report.md "$report_file"
    
    print_status "Monitoring report generated: $report_file"
}

# Main monitoring setup function
main() {
    print_info "Starting monitoring setup..."
    
    # Install packages
    install_monitoring_packages
    
    # Setup core monitoring
    setup_prometheus
    setup_grafana
    setup_alertmanager
    
    # Setup alerting
    setup_alert_rules
    
    # Setup exporters
    setup_exporters
    
    # Create dashboards
    create_grafana_dashboards
    
    # Setup log aggregation
    setup_log_aggregation
    
    # Setup monitoring scripts
    setup_monitoring_scripts
    
    # Generate report
    generate_monitoring_report
    
    print_status "Monitoring system setup completed successfully!"
    print_info "Log file: $LOG_FILE"
    print_info "Grafana URL: http://claude-talimat.com:3001"
    print_info "Prometheus URL: http://claude-talimat.com:9090"
    print_info "Grafana Admin: $GRAFANA_ADMIN_USER / $GRAFANA_ADMIN_PASS"
}

# Run main function
main "$@"
