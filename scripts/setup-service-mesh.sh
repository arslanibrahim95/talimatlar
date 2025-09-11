#!/bin/bash

# Service Mesh Setup Script for Claude Safety Management System
# This script sets up Istio service mesh with monitoring and observability

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        error "Docker is not running. Please start Docker and try again."
    fi
    log "Docker is running"
}

# Check if Docker Compose is available
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose and try again."
    fi
    log "Docker Compose is available"
}

# Create necessary directories
create_directories() {
    log "Creating necessary directories..."
    mkdir -p infrastructure/istio
    mkdir -p logs/istio
    mkdir -p monitoring/istio
    log "Directories created"
}

# Download Istio (if not already present)
download_istio() {
    if [ ! -d "istio-1.20.0" ]; then
        log "Downloading Istio 1.20.0..."
        curl -L https://istio.io/downloadIstio | ISTIO_VERSION=1.20.0 sh -
        log "Istio downloaded"
    else
        log "Istio already downloaded"
    fi
}

# Install Istio CLI
install_istio_cli() {
    if ! command -v istioctl &> /dev/null; then
        log "Installing Istio CLI..."
        if [ -f "istio-1.20.0/bin/istioctl" ]; then
            sudo cp istio-1.20.0/bin/istioctl /usr/local/bin/
            sudo chmod +x /usr/local/bin/istioctl
            log "Istio CLI installed"
        else
            warn "Istio CLI not found in downloaded files"
        fi
    else
        log "Istio CLI already installed"
    fi
}

# Generate TLS certificates for mTLS
generate_certificates() {
    log "Generating TLS certificates for mTLS..."
    
    # Create certificate directory
    mkdir -p ssl/istio
    
    # Generate root CA
    openssl req -x509 -sha256 -nodes -days 365 -newkey rsa:2048 \
        -subj '/O=Claude Safety Management/CN=claude-ca' \
        -keyout ssl/istio/ca-key.pem \
        -out ssl/istio/ca-cert.pem
    
    # Generate server certificate
    openssl req -out ssl/istio/server.csr -newkey rsa:2048 -nodes \
        -keyout ssl/istio/server-key.pem -subj "/CN=claude.local/O=Claude Safety Management"
    
    openssl x509 -req -days 365 -CA ssl/istio/ca-cert.pem -CAkey ssl/istio/ca-key.pem \
        -set_serial 0 -in ssl/istio/server.csr -out ssl/istio/server-cert.pem
    
    # Generate client certificate
    openssl req -out ssl/istio/client.csr -newkey rsa:2048 -nodes \
        -keyout ssl/istio/client-key.pem -subj "/CN=claude-client/O=Claude Safety Management"
    
    openssl x509 -req -days 365 -CA ssl/istio/ca-cert.pem -CAkey ssl/istio/ca-key.pem \
        -set_serial 1 -in ssl/istio/client.csr -out ssl/istio/client-cert.pem
    
    log "TLS certificates generated"
}

# Create Kubernetes secrets for certificates
create_k8s_secrets() {
    log "Creating Kubernetes secrets for certificates..."
    
    # Create namespace if it doesn't exist
    kubectl create namespace default --dry-run=client -o yaml | kubectl apply -f -
    
    # Create TLS secret
    kubectl create secret tls claude-tls-cert \
        --cert=ssl/istio/server-cert.pem \
        --key=ssl/istio/server-key.pem \
        --namespace=default --dry-run=client -o yaml | kubectl apply -f -
    
    log "Kubernetes secrets created"
}

# Update Prometheus configuration for Istio metrics
update_prometheus_config() {
    log "Updating Prometheus configuration for Istio metrics..."
    
    cat >> monitoring/prometheus.yml << 'EOF'

# Istio Service Mesh Metrics
  - job_name: 'istio-pilot'
    static_configs:
      - targets: ['istio-pilot:15010']
    scrape_interval: 15s
    metrics_path: /stats/prometheus

  - job_name: 'istio-proxy'
    static_configs:
      - targets: ['istio-ingressgateway:15020']
    scrape_interval: 15s
    metrics_path: /stats/prometheus

  - job_name: 'jaeger'
    static_configs:
      - targets: ['jaeger:14269']
    scrape_interval: 15s

  - job_name: 'kiali'
    static_configs:
      - targets: ['kiali:20001']
    scrape_interval: 15s
EOF

    log "Prometheus configuration updated"
}

# Create Grafana dashboard for service mesh
create_grafana_dashboard() {
    log "Creating Grafana dashboard for service mesh..."
    
    mkdir -p monitoring/grafana/dashboards
    
    cat > monitoring/grafana/dashboards/service-mesh.json << 'EOF'
{
  "dashboard": {
    "id": null,
    "title": "Service Mesh Overview",
    "tags": ["istio", "service-mesh"],
    "style": "dark",
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "sum(rate(istio_requests_total[5m])) by (destination_service_name)",
            "legendFormat": "{{destination_service_name}}"
          }
        ],
        "yAxes": [
          {
            "label": "Requests/sec"
          }
        ]
      },
      {
        "id": 2,
        "title": "Request Duration",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, sum(rate(istio_request_duration_milliseconds_bucket[5m])) by (le, destination_service_name))",
            "legendFormat": "95th percentile - {{destination_service_name}}"
          }
        ],
        "yAxes": [
          {
            "label": "Duration (ms)"
          }
        ]
      },
      {
        "id": 3,
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "sum(rate(istio_requests_total{response_code!~\"2.*\"}[5m])) by (destination_service_name) / sum(rate(istio_requests_total[5m])) by (destination_service_name)",
            "legendFormat": "Error Rate - {{destination_service_name}}"
          }
        ],
        "yAxes": [
          {
            "label": "Error Rate"
          }
        ]
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "5s"
  }
}
EOF

    log "Grafana dashboard created"
}

# Start service mesh
start_service_mesh() {
    log "Starting service mesh with Docker Compose..."
    
    # Stop existing services
    docker-compose down 2>/dev/null || true
    
    # Start service mesh
    docker-compose -f docker-compose.mesh.yml up -d
    
    log "Service mesh started"
}

# Apply Istio configurations
apply_istio_configs() {
    log "Applying Istio configurations..."
    
    # Wait for services to be ready
    sleep 30
    
    # Apply gateway configuration
    kubectl apply -f infrastructure/istio/gateway.yaml 2>/dev/null || warn "Could not apply gateway config (Kubernetes not available)"
    
    # Apply destination rules
    kubectl apply -f infrastructure/istio/destination-rules.yaml 2>/dev/null || warn "Could not apply destination rules (Kubernetes not available)"
    
    # Apply security policies
    kubectl apply -f infrastructure/istio/security-policies.yaml 2>/dev/null || warn "Could not apply security policies (Kubernetes not available)"
    
    # Apply traffic management
    kubectl apply -f infrastructure/istio/traffic-management.yaml 2>/dev/null || warn "Could not apply traffic management (Kubernetes not available)"
    
    # Apply observability configuration
    kubectl apply -f infrastructure/istio/observability.yaml 2>/dev/null || warn "Could not apply observability config (Kubernetes not available)"
    
    log "Istio configurations applied"
}

# Display service mesh information
display_info() {
    log "Service Mesh Setup Complete!"
    echo ""
    echo -e "${BLUE}Service Mesh Information:${NC}"
    echo "  - Istio Control Plane: http://localhost:15010"
    echo "  - Istio Ingress Gateway: http://localhost:80"
    echo "  - Jaeger Tracing: http://localhost:16686"
    echo "  - Kiali Service Mesh UI: http://localhost:20001"
    echo "  - Prometheus: http://localhost:9090"
    echo "  - Grafana: http://localhost:3004"
    echo ""
    echo -e "${BLUE}Service Endpoints:${NC}"
    echo "  - Frontend: http://localhost:3000"
    echo "  - Auth Service: http://localhost:8004"
    echo "  - Analytics Service: http://localhost:8003"
    echo "  - Document Service: http://localhost:8007"
    echo "  - Instruction Service: http://localhost:8005"
    echo "  - AI Service: http://localhost:8006"
    echo "  - Notification Service: http://localhost:8008"
    echo ""
    echo -e "${YELLOW}Note: Some Istio features require Kubernetes. For full functionality, deploy to a Kubernetes cluster.${NC}"
}

# Main execution
main() {
    log "Starting Service Mesh Setup for Claude Safety Management System"
    
    check_docker
    check_docker_compose
    create_directories
    download_istio
    install_istio_cli
    generate_certificates
    create_k8s_secrets
    update_prometheus_config
    create_grafana_dashboard
    start_service_mesh
    apply_istio_configs
    display_info
    
    log "Service mesh setup completed successfully!"
}

# Run main function
main "$@"
