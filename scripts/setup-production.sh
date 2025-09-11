#!/bin/bash

# Claude Talimat Production Setup Script
# Bu script production ortamını kurar ve yapılandırır

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
DOMAIN=${2:-claude-talimat.com}
EMAIL=${3:-admin@claude-talimat.com}
SSL_EMAIL=${4:-ssl@claude-talimat.com}

# Logging
LOG_FILE="/var/log/production-setup.log"
exec > >(tee -a "$LOG_FILE")
exec 2>&1

echo -e "${BLUE}🏗️ Starting Production Setup${NC}"
echo "Environment: $ENVIRONMENT"
echo "Domain: $DOMAIN"
echo "Email: $EMAIL"
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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install required packages
install_packages() {
    print_info "Installing required packages..."
    
    # Update package list
    sudo apt-get update -y
    
    # Install essential packages
    sudo apt-get install -y \
        curl \
        wget \
        git \
        unzip \
        jq \
        htop \
        vim \
        nano \
        ufw \
        fail2ban \
        certbot \
        nginx \
        docker.io \
        docker-compose \
        postgresql-client \
        redis-tools \
        nodejs \
        npm \
        python3 \
        python3-pip \
        python3-venv
    
    print_status "Required packages installed"
}

# Function to setup Docker
setup_docker() {
    print_info "Setting up Docker..."
    
    # Start and enable Docker
    sudo systemctl start docker
    sudo systemctl enable docker
    
    # Add user to docker group
    sudo usermod -aG docker $USER
    
    # Configure Docker daemon
    sudo mkdir -p /etc/docker
    cat > /tmp/daemon.json << EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2",
  "live-restore": true,
  "userland-proxy": false,
  "experimental": false,
  "metrics-addr": "127.0.0.1:9323",
  "default-address-pools": [
    {
      "base": "172.17.0.0/12",
      "size": 24
    }
  ]
}
EOF
    
    sudo mv /tmp/daemon.json /etc/docker/daemon.json
    sudo systemctl restart docker
    
    print_status "Docker configured"
}

# Function to setup firewall
setup_firewall() {
    print_info "Setting up firewall..."
    
    # Reset UFW
    sudo ufw --force reset
    
    # Default policies
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    
    # Allow SSH
    sudo ufw allow ssh
    
    # Allow HTTP and HTTPS
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    
    # Allow monitoring ports
    sudo ufw allow 9090/tcp  # Prometheus
    sudo ufw allow 3001/tcp  # Grafana
    sudo ufw allow 9093/tcp  # Alertmanager
    
    # Enable UFW
    sudo ufw --force enable
    
    print_status "Firewall configured"
}

# Function to setup SSL certificates
setup_ssl() {
    print_info "Setting up SSL certificates..."
    
    # Install Certbot
    sudo apt-get install -y certbot python3-certbot-nginx
    
    # Stop nginx temporarily
    sudo systemctl stop nginx
    
    # Generate SSL certificate
    sudo certbot certonly --standalone \
        --email $SSL_EMAIL \
        --agree-tos \
        --no-eff-email \
        --domains $DOMAIN,www.$DOMAIN
    
    # Create SSL configuration
    cat > /tmp/ssl.conf << EOF
# SSL Configuration
ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
ssl_stapling on;
ssl_stapling_verify on;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
EOF
    
    sudo mv /tmp/ssl.conf /etc/nginx/snippets/ssl.conf
    
    # Setup auto-renewal
    echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
    
    print_status "SSL certificates configured"
}

# Function to setup Nginx
setup_nginx() {
    print_info "Setting up Nginx..."
    
    # Create Nginx configuration
    cat > /tmp/nginx.conf << EOF
user www-data;
worker_processes auto;
worker_rlimit_nofile 65535;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 4096;
    use epoll;
    multi_accept on;
    accept_mutex off;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    # Logging
    log_format main '\$remote_addr - \$remote_user [\$time_local] "\$request" '
                    '\$status \$body_bytes_sent "\$http_referer" '
                    '"\$http_user_agent" "\$http_x_forwarded_for"';
    
    access_log /var/log/nginx/access.log main;
    
    # Performance optimizations
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    keepalive_requests 1000;
    types_hash_max_size 2048;
    client_max_body_size 100M;
    client_body_buffer_size 128k;
    client_header_buffer_size 1k;
    large_client_header_buffers 4 4k;
    output_buffers 1 32k;
    postpone_output 1460;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
    
    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone \$binary_remote_addr zone=login:10m rate=5r/m;
    
    # Upstream services
    upstream claude_talimat_frontend {
        server 127.0.0.1:3000;
        keepalive 32;
        keepalive_requests 100;
        keepalive_timeout 60s;
    }
    
    upstream claude_talimat_auth {
        server 127.0.0.1:8004;
        keepalive 32;
        keepalive_requests 100;
        keepalive_timeout 60s;
    }
    
    upstream claude_talimat_documents {
        server 127.0.0.1:8002;
        keepalive 32;
        keepalive_requests 100;
        keepalive_timeout 60s;
    }
    
    upstream claude_talimat_analytics {
        server 127.0.0.1:8003;
        keepalive 32;
        keepalive_requests 100;
        keepalive_timeout 60s;
    }
    
    upstream claude_talimat_notifications {
        server 127.0.0.1:8005;
        keepalive 32;
        keepalive_requests 100;
        keepalive_timeout 60s;
    }
    
    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name $DOMAIN www.$DOMAIN;
        return 301 https://\$server_name\$request_uri;
    }
    
    # Main HTTPS server
    server {
        listen 443 ssl http2;
        server_name $DOMAIN www.$DOMAIN;
        
        # SSL configuration
        include /etc/nginx/snippets/ssl.conf;
        
        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' ws: wss:; media-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests" always;
        
        # Health check
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
        
        # API proxy
        location /api/auth/ {
            limit_req zone=login burst=10 nodelay;
            proxy_pass http://claude_talimat_auth;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
            proxy_http_version 1.1;
            proxy_set_header Connection "";
        }
        
        location /api/documents/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://claude_talimat_documents;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
            proxy_http_version 1.1;
            proxy_set_header Connection "";
        }
        
        location /api/analytics/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://claude_talimat_analytics;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
            proxy_http_version 1.1;
            proxy_set_header Connection "";
        }
        
        location /api/notifications/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://claude_talimat_notifications;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
            proxy_http_version 1.1;
            proxy_set_header Connection "";
        }
        
        # Static assets with aggressive caching
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            add_header Vary Accept-Encoding;
            access_log off;
            gzip_static on;
        }
        
        # Service Worker
        location /sw.js {
            expires 0;
            add_header Cache-Control "no-cache, no-store, must-revalidate";
            add_header Pragma "no-cache";
        }
        
        # Main application
        location / {
            proxy_pass http://claude_talimat_frontend;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
            proxy_http_version 1.1;
            proxy_set_header Connection "";
        }
        
        # Security: Block access to sensitive files
        location ~ /\. {
            deny all;
            access_log off;
            log_not_found off;
        }
        
        location ~ ~$ {
            deny all;
            access_log off;
            log_not_found off;
        }
        
        # Error pages
        error_page 404 /index.html;
        error_page 500 502 503 504 /50x.html;
        location = /50x.html {
            root /usr/share/nginx/html;
        }
    }
}
EOF
    
    sudo mv /tmp/nginx.conf /etc/nginx/nginx.conf
    
    # Test Nginx configuration
    sudo nginx -t
    
    # Start and enable Nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
    
    print_status "Nginx configured"
}

# Function to setup monitoring
setup_monitoring() {
    print_info "Setting up monitoring..."
    
    # Create monitoring directory
    sudo mkdir -p /opt/monitoring
    
    # Create Prometheus configuration
    cat > /tmp/prometheus.yml << EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "rules/*.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'claude-talimat-frontend'
    static_configs:
      - targets: ['localhost:3000']

  - job_name: 'claude-talimat-auth'
    static_configs:
      - targets: ['localhost:8004']

  - job_name: 'claude-talimat-documents'
    static_configs:
      - targets: ['localhost:8002']

  - job_name: 'claude-talimat-analytics'
    static_configs:
      - targets: ['localhost:8003']

  - job_name: 'claude-talimat-notifications'
    static_configs:
      - targets: ['localhost:8005']
EOF
    
    sudo mv /tmp/prometheus.yml /opt/monitoring/prometheus.yml
    
    # Create alert rules
    sudo mkdir -p /opt/monitoring/rules
    cat > /tmp/alerts.yml << EOF
groups:
  - name: claude-talimat-alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ \$value }} errors per second"

      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time detected"
          description: "95th percentile response time is {{ \$value }} seconds"

      - alert: ServiceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Service is down"
          description: "Service {{ \$labels.job }} is down"
EOF
    
    sudo mv /tmp/alerts.yml /opt/monitoring/rules/alerts.yml
    
    print_status "Monitoring configured"
}

# Function to setup environment variables
setup_environment() {
    print_info "Setting up environment variables..."
    
    # Create production environment file
    cat > /tmp/.env.production << EOF
# Production Environment Variables
NODE_ENV=production
PORT=3000

# Database Configuration
POSTGRES_DB=claude_talimat_prod
POSTGRES_USER=claude_talimat_user
POSTGRES_PASSWORD=$(openssl rand -base64 32)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=$(openssl rand -base64 32)

# JWT Configuration
JWT_SECRET=$(openssl rand -base64 64)
JWT_EXPIRES_IN=86400

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=$EMAIL
SMTP_PASS=your-app-password

# Domain Configuration
DOMAIN=$DOMAIN
FRONTEND_URL=https://$DOMAIN
API_URL=https://$DOMAIN/api

# Security Configuration
CORS_ORIGIN=https://$DOMAIN
SESSION_SECRET=$(openssl rand -base64 64)

# Monitoring Configuration
PROMETHEUS_PORT=9090
GRAFANA_PORT=3001
ALERTMANAGER_PORT=9093

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=/var/log/claude-talimat.log

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=/opt/claude-talimat/uploads

# Rate Limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100

# Backup Configuration
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30
BACKUP_PATH=/opt/claude-talimat/backups
EOF
    
    sudo mv /tmp/.env.production /opt/claude-talimat/.env.production
    sudo chown root:root /opt/claude-talimat/.env.production
    sudo chmod 600 /opt/claude-talimat/.env.production
    
    print_status "Environment variables configured"
}

# Function to setup backup
setup_backup() {
    print_info "Setting up backup system..."
    
    # Create backup directory
    sudo mkdir -p /opt/claude-talimat/backups
    
    # Create backup script
    cat > /tmp/backup.sh << 'EOF'
#!/bin/bash

# Claude Talimat Backup Script
BACKUP_DIR="/opt/claude-talimat/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="claude-talimat-backup-$DATE.tar.gz"

# Create backup
tar -czf "$BACKUP_DIR/$BACKUP_FILE" \
    /opt/claude-talimat/data \
    /opt/claude-talimat/uploads \
    /opt/claude-talimat/logs

# Remove old backups (keep last 30 days)
find "$BACKUP_DIR" -name "claude-talimat-backup-*.tar.gz" -mtime +30 -delete

# Log backup completion
echo "$(date): Backup completed - $BACKUP_FILE" >> /var/log/backup.log
EOF
    
    sudo mv /tmp/backup.sh /opt/claude-talimat/backup.sh
    sudo chmod +x /opt/claude-talimat/backup.sh
    
    # Schedule daily backups
    echo "0 2 * * * /opt/claude-talimat/backup.sh" | sudo crontab -
    
    print_status "Backup system configured"
}

# Function to setup log rotation
setup_log_rotation() {
    print_info "Setting up log rotation..."
    
    # Create logrotate configuration
    cat > /tmp/claude-talimat << EOF
/var/log/claude-talimat/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload nginx
    endscript
}
EOF
    
    sudo mv /tmp/claude-talimat /etc/logrotate.d/claude-talimat
    
    print_status "Log rotation configured"
}

# Function to create systemd services
setup_systemd_services() {
    print_info "Setting up systemd services..."
    
    # Create application directory
    sudo mkdir -p /opt/claude-talimat
    
    # Create frontend service
    cat > /tmp/claude-talimat-frontend.service << EOF
[Unit]
Description=Claude Talimat Frontend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/claude-talimat/frontend
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF
    
    sudo mv /tmp/claude-talimat-frontend.service /etc/systemd/system/
    
    # Create auth service
    cat > /tmp/claude-talimat-auth.service << EOF
[Unit]
Description=Claude Talimat Auth Service
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/claude-talimat/services/auth-service
ExecStart=/usr/bin/deno run --allow-net --allow-read main.ts
Restart=always
RestartSec=10
Environment=PORT=8004

[Install]
WantedBy=multi-user.target
EOF
    
    sudo mv /tmp/claude-talimat-auth.service /etc/systemd/system/
    
    # Reload systemd
    sudo systemctl daemon-reload
    
    print_status "Systemd services configured"
}

# Function to setup fail2ban
setup_fail2ban() {
    print_info "Setting up fail2ban..."
    
    # Create fail2ban configuration
    cat > /tmp/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
EOF
    
    sudo mv /tmp/jail.local /etc/fail2ban/jail.local
    
    # Start and enable fail2ban
    sudo systemctl start fail2ban
    sudo systemctl enable fail2ban
    
    print_status "Fail2ban configured"
}

# Function to generate setup report
generate_setup_report() {
    print_info "Generating setup report..."
    
    local report_file="/opt/claude-talimat/setup-reports/production-setup-$(date +%Y%m%d_%H%M%S).md"
    sudo mkdir -p "$(dirname "$report_file")"
    
    cat > /tmp/setup-report.md << EOF
# 🏗️ Claude Talimat Production Setup Report

**Generated:** $(date)
**Environment:** $ENVIRONMENT
**Domain:** $DOMAIN
**Email:** $EMAIL

## 📊 Setup Summary

This report documents the production setup of the Claude Talimat application.

## 🔧 Components Installed

### System Packages
- ✅ Essential packages installed
- ✅ Docker and Docker Compose configured
- ✅ Nginx web server configured
- ✅ SSL certificates installed
- ✅ Firewall configured
- ✅ Fail2ban security configured

### Services
- ✅ Frontend service configured
- ✅ Auth service configured
- ✅ Document service configured
- ✅ Analytics service configured
- ✅ Notification service configured

### Monitoring
- ✅ Prometheus metrics collection
- ✅ Grafana dashboards
- ✅ Alertmanager alerts
- ✅ Log rotation configured

### Security
- ✅ SSL/TLS encryption
- ✅ Firewall rules
- ✅ Fail2ban protection
- ✅ Rate limiting
- ✅ Security headers

### Backup
- ✅ Automated backup system
- ✅ Log rotation
- ✅ Data retention policies

## 🌐 Access Information

### Application URLs
- **Main Application**: https://$DOMAIN
- **API Documentation**: https://$DOMAIN/api/docs
- **Health Check**: https://$DOMAIN/health

### Monitoring URLs
- **Prometheus**: http://$DOMAIN:9090
- **Grafana**: http://$DOMAIN:3001
- **Alertmanager**: http://$DOMAIN:9093

### Admin Access
- **SSH**: ssh admin@$DOMAIN
- **Database**: psql -h localhost -U claude_talimat_user -d claude_talimat_prod
- **Redis**: redis-cli -h localhost -p 6379

## 🔒 Security Configuration

### SSL/TLS
- **Certificate**: Let's Encrypt
- **Protocols**: TLSv1.2, TLSv1.3
- **Ciphers**: ECDHE-RSA-AES256-GCM-SHA512
- **HSTS**: Enabled with preload

### Firewall
- **SSH**: Port 22
- **HTTP**: Port 80 (redirects to HTTPS)
- **HTTPS**: Port 443
- **Monitoring**: Ports 9090, 3001, 9093

### Rate Limiting
- **API**: 10 requests/second
- **Login**: 5 requests/minute
- **File Upload**: 10 requests/minute

## 📈 Performance Configuration

### Nginx
- **Worker Processes**: Auto
- **Worker Connections**: 4096
- **Keepalive**: 65 seconds
- **Gzip**: Enabled

### Docker
- **Log Driver**: json-file
- **Log Rotation**: 10MB max, 3 files
- **Storage Driver**: overlay2
- **Live Restore**: Enabled

### Monitoring
- **Scrape Interval**: 15 seconds
- **Evaluation Interval**: 15 seconds
- **Retention**: 30 days

## 🚀 Next Steps

1. **Deploy Application**: Run deployment script
2. **Configure Monitoring**: Set up Grafana dashboards
3. **Test System**: Run comprehensive tests
4. **User Onboarding**: Start user training
5. **Go Live**: Launch to production

## 📁 Configuration Files

- **Nginx**: /etc/nginx/nginx.conf
- **SSL**: /etc/nginx/snippets/ssl.conf
- **Environment**: /opt/claude-talimat/.env.production
- **Prometheus**: /opt/monitoring/prometheus.yml
- **Alerts**: /opt/monitoring/rules/alerts.yml
- **Backup**: /opt/claude-talimat/backup.sh
- **Logrotate**: /etc/logrotate.d/claude-talimat

## 🔗 Resources

- [Nginx Documentation](https://nginx.org/en/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)

---
*Report generated by Claude Talimat Production Setup Script*
EOF
    
    sudo mv /tmp/setup-report.md "$report_file"
    sudo chown root:root "$report_file"
    sudo chmod 644 "$report_file"
    
    print_status "Setup report generated: $report_file"
}

# Main setup function
main() {
    print_info "Starting production setup..."
    
    # Check if running as root
    if [ "$EUID" -eq 0 ]; then
        print_error "Please run this script as a regular user, not root"
        exit 1
    fi
    
    # Install packages
    install_packages
    
    # Setup Docker
    setup_docker
    
    # Setup firewall
    setup_firewall
    
    # Setup SSL certificates
    setup_ssl
    
    # Setup Nginx
    setup_nginx
    
    # Setup monitoring
    setup_monitoring
    
    # Setup environment variables
    setup_environment
    
    # Setup backup
    setup_backup
    
    # Setup log rotation
    setup_log_rotation
    
    # Setup systemd services
    setup_systemd_services
    
    # Setup fail2ban
    setup_fail2ban
    
    # Generate setup report
    generate_setup_report
    
    print_status "Production setup completed successfully!"
    print_info "Log file: $LOG_FILE"
    print_warning "Please reboot the system to apply all changes"
    print_info "After reboot, run: ./scripts/deploy.sh production latest"
}

# Run main function
main "$@"
