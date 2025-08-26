#!/bin/bash

# =============================================================================
# CLAUDE TALİMAT İŞ GÜVENLİĞİ YÖNETİM SİSTEMİ - RASPBERRY PI DEPLOYMENT
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
RPI_HOST=""
RPI_USER="pi"
RPI_PORT="22"
DEPLOY_PATH="/home/pi/claude-talimat"
BACKUP_PATH="/home/pi/backups"

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

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --host HOST     Raspberry Pi hostname or IP address"
    echo "  -u, --user USER     SSH username (default: pi)"
    echo "  -p, --port PORT     SSH port (default: 22)"
    echo "  -d, --deploy PATH   Deployment path (default: /home/pi/claude-talimat)"
    echo "  -b, --backup PATH   Backup path (default: /home/pi/backups)"
    echo "  --help              Show this help message"
    echo ""
    echo "Example:"
    echo "  $0 -h 192.168.1.100 -u pi -p 22"
}

# Function to parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--host)
                RPI_HOST="$2"
                shift 2
                ;;
            -u|--user)
                RPI_USER="$2"
                shift 2
                ;;
            -p|--port)
                RPI_PORT="$2"
                shift 2
                ;;
            -d|--deploy)
                DEPLOY_PATH="$2"
                shift 2
                ;;
            -b|--backup)
                BACKUP_PATH="$2"
                shift 2
                ;;
            --help)
                show_usage
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # Check required arguments
    if [ -z "$RPI_HOST" ]; then
        print_error "Host is required. Use -h or --host to specify."
        show_usage
        exit 1
    fi
}

# Function to check SSH connection
check_ssh() {
    print_status "Checking SSH connection to $RPI_USER@$RPI_HOST:$RPI_PORT..."
    
    if ! ssh -o ConnectTimeout=10 -o BatchMode=yes -p "$RPI_PORT" "$RPI_USER@$RPI_HOST" exit >/dev/null 2>&1; then
        print_error "Cannot connect to $RPI_USER@$RPI_HOST:$RPI_PORT"
        print_error "Please check your SSH configuration and try again."
        exit 1
    fi
    
    print_success "SSH connection established!"
}

# Function to check Raspberry Pi requirements
check_rpi_requirements() {
    print_status "Checking Raspberry Pi requirements..."
    
    # Check if Docker is installed
    if ! ssh -p "$RPI_PORT" "$RPI_USER@$RPI_HOST" "command -v docker >/dev/null 2>&1"; then
        print_error "Docker is not installed on Raspberry Pi"
        print_error "Please install Docker first:"
        echo "  curl -fsSL https://get.docker.com | sh"
        echo "  sudo usermod -aG docker \$USER"
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! ssh -p "$RPI_PORT" "$RPI_USER@$RPI_HOST" "command -v docker-compose >/dev/null 2>&1"; then
        print_error "Docker Compose is not installed on Raspberry Pi"
        print_error "Please install Docker Compose first:"
        echo "  sudo apt-get update"
        echo "  sudo apt-get install docker-compose-plugin"
        exit 1
    fi
    
    # Check available disk space
    local available_space=$(ssh -p "$RPI_PORT" "$RPI_USER@$RPI_HOST" "df -BG / | awk 'NR==2{print \$4}' | sed 's/G//'")
    if [ "$available_space" -lt 10 ]; then
        print_warning "Low disk space available: ${available_space}G"
        print_warning "Recommended: At least 10GB free space"
        read -p "Do you want to continue? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    print_success "Raspberry Pi requirements check passed!"
}

# Function to create backup
create_backup() {
    print_status "Creating backup of existing deployment..."
    
    ssh -p "$RPI_PORT" "$RPI_USER@$RPI_HOST" "mkdir -p $BACKUP_PATH"
    
    if ssh -p "$RPI_PORT" "$RPI_USER@$RPI_HOST" "[ -d $DEPLOY_PATH ]"; then
        local backup_name="claude-talimat-$(date +%Y%m%d-%H%M%S).tar.gz"
        ssh -p "$RPI_PORT" "$RPI_USER@$RPI_HOST" "cd $DEPLOY_PATH && tar -czf $BACKUP_PATH/$backup_name ."
        print_success "Backup created: $BACKUP_PATH/$backup_name"
    else
        print_warning "No existing deployment found, skipping backup"
    fi
}

# Function to stop existing services
stop_existing_services() {
    print_status "Stopping existing services..."
    
    if ssh -p "$RPI_PORT" "$RPI_USER@$RPI_HOST" "[ -d $DEPLOY_PATH ]"; then
        ssh -p "$RPI_PORT" "$RPI_USER@$RPI_HOST" "cd $DEPLOY_PATH && docker-compose down --remove-orphans" || true
        print_success "Existing services stopped"
    fi
}

# Function to deploy application
deploy_application() {
    print_status "Deploying application to Raspberry Pi..."
    
    # Create deployment directory
    ssh -p "$RPI_PORT" "$RPI_USER@$RPI_HOST" "mkdir -p $DEPLOY_PATH"
    
    # Copy application files
    print_status "Copying application files..."
    rsync -avz --delete -e "ssh -p $RPI_PORT" \
        --exclude='.git' \
        --exclude='node_modules' \
        --exclude='*.log' \
        --exclude='uploads/*' \
        --exclude='logs/*' \
        ./ "$RPI_USER@$RPI_HOST:$DEPLOY_PATH/"
    
    print_success "Application files copied successfully!"
}

# Function to configure for Raspberry Pi
configure_rpi() {
    print_status "Configuring application for Raspberry Pi..."
    
    # Create production environment file
    ssh -p "$RPI_PORT" "$RPI_USER@$RPI_HOST" "cd $DEPLOY_PATH && cp .env.example .env"
    
    # Update environment variables for Raspberry Pi
    ssh -p "$RPI_PORT" "$RPI_USER@$RPI_HOST" "cd $DEPLOY_PATH && sed -i 's/localhost/127.0.0.1/g' .env"
    ssh -p "$RPI_PORT" "$RPI_USER@$RPI_HOST" "cd $DEPLOY_PATH && sed -i 's/NODE_ENV=development/NODE_ENV=production/g' .env"
    ssh -p "$RPI_PORT" "$RPI_USER@$RPI_HOST" "cd $DEPLOY_PATH && sed -i 's/DEBUG=true/DEBUG=false/g' .env"
    ssh -p "$RPI_PORT" "$RPI_USER@$RPI_HOST" "cd $DEPLOY_PATH && sed -i 's/HOT_RELOAD=true/HOT_RELOAD=false/g' .env"
    
    # Create necessary directories
    ssh -p "$RPI_PORT" "$RPI_USER@$RPI_HOST" "cd $DEPLOY_PATH && mkdir -p services/document-service/uploads services/analytics-service/logs services/notification-service/logs logs/nginx logs/postgresql logs/redis"
    
    # Set proper permissions
    ssh -p "$RPI_PORT" "$RPI_USER@$RPI_HOST" "cd $DEPLOY_PATH && chmod +x infrastructure/scripts/*.sh scripts/*.sh"
    ssh -p "$RPI_PORT" "$RPI_USER@$RPI_HOST" "cd $DEPLOY_PATH && chmod 755 services/document-service/uploads services/analytics-service/logs services/notification-service/logs"
    
    print_success "Raspberry Pi configuration completed!"
}

# Function to build and start services
start_services() {
    print_status "Building and starting services on Raspberry Pi..."
    
    # Build images
    print_status "Building Docker images (this may take a while)..."
    ssh -p "$RPI_PORT" "$RPI_USER@$RPI_HOST" "cd $DEPLOY_PATH && docker-compose build --no-cache"
    
    # Start services
    print_status "Starting services..."
    ssh -p "$RPI_PORT" "$RPI_USER@$RPI_HOST" "cd $DEPLOY_PATH && docker-compose up -d"
    
    print_success "Services started successfully!"
}

# Function to wait for services
wait_for_services() {
    print_status "Waiting for services to be ready..."
    
    local max_attempts=60
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if ssh -p "$RPI_PORT" "$RPI_USER@$RPI_HOST" "curl -f http://127.0.0.1/health >/dev/null 2>&1"; then
            print_success "All services are ready!"
            return 0
        fi
        
        print_status "Waiting for services... (attempt $attempt/$max_attempts)"
        sleep 10
        attempt=$((attempt + 1))
    done
    
    print_error "Services failed to start within expected time"
    return 1
}

# Function to show deployment status
show_deployment_status() {
    print_status "Deployment status:"
    ssh -p "$RPI_PORT" "$RPI_USER@$RPI_HOST" "cd $DEPLOY_PATH && docker-compose ps"
    
    echo ""
    print_status "Service URLs:"
    echo "  Frontend: http://$RPI_HOST"
    echo "  Auth API: http://$RPI_HOST/api/v1/auth"
    echo "  Document API: http://$RPI_HOST/api/v1/documents"
    echo "  Analytics API: http://$RPI_HOST/api/v1/analytics"
    echo "  Notification API: http://$RPI_HOST/api/v1/notifications"
    echo "  Grafana: http://$RPI_HOST:3000 (admin/admin123)"
    echo "  Prometheus: http://$RPI_HOST:9090"
    echo "  MinIO Console: http://$RPI_HOST:9001 (minioadmin/minioadmin123)"
}

# Function to show next steps
show_next_steps() {
    echo ""
    print_success "Raspberry Pi deployment completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Access the frontend at http://$RPI_HOST"
    echo "2. Login with default credentials:"
    echo "   - Email: admin@orneksirket.com"
    echo "   - Password: admin123"
    echo "3. Review and update configuration in .env file"
    echo "4. Check service logs: ssh $RPI_USER@$RPI_HOST 'cd $DEPLOY_PATH && docker-compose logs -f'"
    echo "5. Monitor system with Grafana: http://$RPI_HOST:3000"
    echo ""
    echo "Useful commands:"
    echo "  - Stop services: ssh $RPI_USER@$RPI_HOST 'cd $DEPLOY_PATH && docker-compose down'"
    echo "  - View logs: ssh $RPI_USER@$RPI_HOST 'cd $DEPLOY_PATH && docker-compose logs -f'"
    echo "  - Restart services: ssh $RPI_USER@$RPI_HOST 'cd $DEPLOY_PATH && docker-compose restart'"
    echo "  - Update services: ssh $RPI_USER@$RPI_HOST 'cd $DEPLOY_PATH && docker-compose pull && docker-compose up -d'"
}

# Main deployment function
main() {
    echo "=============================================================================="
    echo "  CLAUDE TALİMAT İŞ GÜVENLİĞİ YÖNETİM SİSTEMİ - RPI DEPLOYMENT"
    echo "=============================================================================="
    echo ""
    
    # Parse command line arguments
    parse_args "$@"
    
    # Run deployment steps
    check_ssh
    check_rpi_requirements
    create_backup
    stop_existing_services
    deploy_application
    configure_rpi
    start_services
    wait_for_services
    show_deployment_status
    show_next_steps
}

# Run main function
main "$@"
