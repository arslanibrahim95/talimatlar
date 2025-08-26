#!/bin/bash

# =============================================================================
# CLAUDE TALİMAT İŞ GÜVENLİĞİ YÖNETİM SİSTEMİ - BACKUP SCRIPT
# =============================================================================

set -e

# Configuration
BACKUP_DIR="/backups"
POSTGRES_HOST="postgres"
POSTGRES_PORT="5432"
POSTGRES_DB="safety_production"
POSTGRES_USER="safety_admin"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD}"
BACKUP_RETENTION_DAYS=30

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

# Function to create backup directory
create_backup_dir() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_path="${BACKUP_DIR}/backup_${timestamp}"
    
    mkdir -p "$backup_path"
    echo "$backup_path"
}

# Function to backup PostgreSQL database
backup_postgres() {
    local backup_path="$1"
    
    print_status "Starting PostgreSQL backup..."
    
    # Create database dump
    local db_dump_file="${backup_path}/database.sql"
    
    if PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
        -h "$POSTGRES_HOST" \
        -p "$POSTGRES_PORT" \
        -U "$POSTGRES_USER" \
        -d "$POSTGRES_DB" \
        --verbose \
        --clean \
        --if-exists \
        --create \
        --no-owner \
        --no-privileges \
        > "$db_dump_file"; then
        
        print_success "PostgreSQL backup completed: $(du -h "$db_dump_file" | cut -f1)"
    else
        print_error "PostgreSQL backup failed"
        return 1
    fi
}

# Function to backup MinIO data
backup_minio() {
    local backup_path="$1"
    
    print_status "Starting MinIO backup..."
    
    # Create MinIO backup directory
    local minio_backup_dir="${backup_path}/minio"
    mkdir -p "$minio_backup_dir"
    
    # Use MinIO client to backup data
    if command -v mc >/dev/null 2>&1; then
        # Configure MinIO client
        mc alias set backup http://minio:9000 minioadmin minioadmin123
        
        # Backup all buckets
        if mc mirror backup/claude-documents "$minio_backup_dir"; then
            print_success "MinIO backup completed: $(du -sh "$minio_backup_dir" | cut -f1)"
        else
            print_warning "MinIO backup failed, continuing with other backups"
        fi
    else
        print_warning "MinIO client not available, skipping MinIO backup"
    fi
}

# Function to backup configuration files
backup_config() {
    local backup_path="$1"
    
    print_status "Starting configuration backup..."
    
    # Create config backup directory
    local config_backup_dir="${backup_path}/config"
    mkdir -p "$config_backup_dir"
    
    # Copy important configuration files
    if [ -f "/app/.env" ]; then
        cp /app/.env "$config_backup_dir/"
    fi
    
    if [ -d "/app/infrastructure" ]; then
        cp -r /app/infrastructure "$config_backup_dir/"
    fi
    
    print_success "Configuration backup completed"
}

# Function to create backup manifest
create_manifest() {
    local backup_path="$1"
    
    local manifest_file="${backup_path}/manifest.txt"
    
    cat > "$manifest_file" << EOF
Claude Talimat System Backup Manifest
=====================================
Backup Date: $(date)
Backup Time: $(date +%H:%M:%S)
System Version: $(cat /app/version.txt 2>/dev/null || echo "Unknown")

Backup Contents:
- Database: PostgreSQL dump
- Configuration: System config files
- MinIO: Object storage data (if available)

Backup Size: $(du -sh "$backup_path" | cut -f1)
Total Files: $(find "$backup_path" -type f | wc -l)

Restore Instructions:
1. Stop all services
2. Restore PostgreSQL: psql -U safety_admin -d safety_production < database.sql
3. Restore MinIO: mc mirror minio_backup backup/claude-documents
4. Restore configuration files
5. Restart services

EOF

    print_success "Backup manifest created"
}

# Function to compress backup
compress_backup() {
    local backup_path="$1"
    local parent_dir=$(dirname "$backup_path")
    local backup_name=$(basename "$backup_path")
    
    print_status "Compressing backup..."
    
    cd "$parent_dir"
    if tar -czf "${backup_name}.tar.gz" "$backup_name"; then
        rm -rf "$backup_path"
        print_success "Backup compressed: ${backup_name}.tar.gz"
        echo "${parent_dir}/${backup_name}.tar.gz"
    else
        print_error "Backup compression failed"
        return 1
    fi
}

# Function to cleanup old backups
cleanup_old_backups() {
    print_status "Cleaning up old backups (older than $BACKUP_RETENTION_DAYS days)..."
    
    local deleted_count=0
    
    # Find and delete old backup files
    while IFS= read -r -d '' file; do
        if [ -f "$file" ]; then
            rm -f "$file"
            deleted_count=$((deleted_count + 1))
            print_status "Deleted old backup: $(basename "$file")"
        fi
    done < <(find "$BACKUP_DIR" -name "backup_*.tar.gz" -mtime +$BACKUP_RETENTION_DAYS -print0)
    
    if [ $deleted_count -gt 0 ]; then
        print_success "Cleaned up $deleted_count old backup(s)"
    else
        print_status "No old backups to clean up"
    fi
}

# Function to verify backup
verify_backup() {
    local backup_file="$1"
    
    print_status "Verifying backup integrity..."
    
    if tar -tzf "$backup_file" >/dev/null 2>&1; then
        print_success "Backup verification passed"
        return 0
    else
        print_error "Backup verification failed"
        return 1
    fi
}

# Function to show backup info
show_backup_info() {
    local backup_file="$1"
    
    echo ""
    print_success "Backup completed successfully!"
    echo ""
    echo "Backup Details:"
    echo "  File: $(basename "$backup_file")"
    echo "  Size: $(du -h "$backup_file" | cut -f1)"
    echo "  Location: $backup_file"
    echo "  Date: $(date)"
    echo ""
    echo "Available Backups:"
    ls -lh "$BACKUP_DIR"/backup_*.tar.gz 2>/dev/null || echo "  No backups found"
}

# Main backup function
main() {
    echo "=============================================================================="
    echo "  CLAUDE TALİMAT İŞ GÜVENLİĞİ YÖNETİM SİSTEMİ - BACKUP"
    echo "=============================================================================="
    echo ""
    
    # Check if backup directory exists
    if [ ! -d "$BACKUP_DIR" ]; then
        print_error "Backup directory does not exist: $BACKUP_DIR"
        exit 1
    fi
    
    # Create backup directory with timestamp
    local backup_path=$(create_backup_dir)
    
    # Perform backups
    backup_postgres "$backup_path"
    backup_minio "$backup_path"
    backup_config "$backup_path"
    create_manifest "$backup_path"
    
    # Compress backup
    local compressed_backup=$(compress_backup "$backup_path")
    
    # Verify backup
    if verify_backup "$compressed_backup"; then
        # Cleanup old backups
        cleanup_old_backups
        
        # Show backup information
        show_backup_info "$compressed_backup"
    else
        print_error "Backup verification failed, backup may be corrupted"
        exit 1
    fi
}

# Run main function
main "$@"
