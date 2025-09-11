#!/bin/bash

# =============================================================================
# DOCKER PERFORMANCE MONITORING SCRIPT
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Function to show container stats
show_stats() {
    print_status "Container Statistics:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}\t{{.BlockIO}}"
}

# Function to show image sizes
show_image_sizes() {
    print_status "Image Sizes:"
    docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}" | head -10
}

# Function to show disk usage
show_disk_usage() {
    print_status "Docker Disk Usage:"
    docker system df
}

# Function to show running containers
show_containers() {
    print_status "Running Containers:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}\t{{.Image}}"
}

# Function to show network usage
show_network_usage() {
    print_status "Network Usage:"
    docker network ls
    echo ""
    print_status "Network Details:"
    docker network inspect claude-network 2>/dev/null || echo "Network not found"
}

# Function to show volume usage
show_volume_usage() {
    print_status "Volume Usage:"
    docker volume ls
    echo ""
    print_status "Volume Details:"
    docker system df -v
}

# Function to check container health
check_health() {
    print_status "Container Health Status:"
    for container in $(docker ps --format "{{.Names}}"); do
        health=$(docker inspect --format='{{.State.Health.Status}}' $container 2>/dev/null || echo "N/A")
        echo "$container: $health"
    done
}

# Function to show resource limits
show_resource_limits() {
    print_status "Resource Limits:"
    for container in $(docker ps --format "{{.Names}}"); do
        echo "=== $container ==="
        docker inspect --format='{{.HostConfig.Memory}}' $container | awk '{print "Memory Limit: " $1/1024/1024 " MB"}'
        docker inspect --format='{{.HostConfig.CpuQuota}}' $container | awk '{print "CPU Quota: " $1/100000 " cores"}'
        echo ""
    done
}

# Function to show logs summary
show_logs_summary() {
    print_status "Recent Logs Summary:"
    for container in $(docker ps --format "{{.Names}}"); do
        echo "=== $container (last 5 lines) ==="
        docker logs --tail 5 $container 2>/dev/null || echo "No logs available"
        echo ""
    done
}

# Function to generate performance report
generate_report() {
    local report_file="docker-performance-report-$(date +%Y%m%d-%H%M%S).txt"
    
    print_status "Generating performance report: $report_file"
    
    {
        echo "Docker Performance Report - $(date)"
        echo "=========================================="
        echo ""
        
        echo "Container Statistics:"
        docker stats --no-stream --format "{{.Container}} {{.CPUPerc}} {{.MemUsage}} {{.MemPerc}} {{.NetIO}} {{.BlockIO}}"
        echo ""
        
        echo "Image Sizes:"
        docker images --format "{{.Repository}} {{.Tag}} {{.Size}} {{.CreatedAt}}"
        echo ""
        
        echo "Disk Usage:"
        docker system df
        echo ""
        
        echo "Network Usage:"
        docker network ls
        echo ""
        
        echo "Volume Usage:"
        docker volume ls
        echo ""
        
        echo "Health Status:"
        for container in $(docker ps --format "{{.Names}}"); do
            health=$(docker inspect --format='{{.State.Health.Status}}' $container 2>/dev/null || echo "N/A")
            echo "$container: $health"
        done
        
    } > "$report_file"
    
    print_success "Performance report saved to: $report_file"
}

# Function to show optimization recommendations
show_recommendations() {
    print_status "Optimization Recommendations:"
    echo ""
    echo "1. Image Optimization:"
    echo "   - Use multi-stage builds"
    echo "   - Remove unnecessary packages"
    echo "   - Use .dockerignore files"
    echo ""
    echo "2. Resource Management:"
    echo "   - Set appropriate memory limits"
    echo "   - Use CPU limits"
    echo "   - Monitor resource usage"
    echo ""
    echo "3. Caching:"
    echo "   - Use BuildKit for better caching"
    echo "   - Order Dockerfile commands by frequency of change"
    echo "   - Use specific base image tags"
    echo ""
    echo "4. Security:"
    echo "   - Use non-root users"
    echo "   - Scan images for vulnerabilities"
    echo "   - Keep base images updated"
    echo ""
    echo "5. Monitoring:"
    echo "   - Set up health checks"
    echo "   - Monitor logs"
    echo "   - Use resource monitoring tools"
}

# Main function
main() {
    case "${1:-all}" in
        "stats")
            show_stats
            ;;
        "images")
            show_image_sizes
            ;;
        "disk")
            show_disk_usage
            ;;
        "containers")
            show_containers
            ;;
        "network")
            show_network_usage
            ;;
        "volumes")
            show_volume_usage
            ;;
        "health")
            check_health
            ;;
        "resources")
            show_resource_limits
            ;;
        "logs")
            show_logs_summary
            ;;
        "report")
            generate_report
            ;;
        "recommendations")
            show_recommendations
            ;;
        "all")
            show_containers
            echo ""
            show_stats
            echo ""
            show_image_sizes
            echo ""
            show_disk_usage
            echo ""
            check_health
            echo ""
            show_recommendations
            ;;
        *)
            echo "Usage: $0 [stats|images|disk|containers|network|volumes|health|resources|logs|report|recommendations|all]"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
