"""
Database Migration Manager
Handles database schema migrations and version control
"""

import os
import re
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

class Migration:
    """Represents a single database migration"""
    
    def __init__(self, version: str, name: str, up_sql: str, down_sql: str = ""):
        self.version = version
        self.name = name
        self.up_sql = up_sql
        self.down_sql = down_sql
        self.created_at = datetime.utcnow()
    
    def __str__(self):
        return f"Migration({self.version}: {self.name})"
    
    def __repr__(self):
        return self.__str__()

class MigrationManager:
    """Manages database migrations"""
    
    def __init__(self, migrations_dir: str = "migrations"):
        self.migrations_dir = Path(migrations_dir)
        self.migrations: List[Migration] = []
        self._load_migrations()
    
    def _load_migrations(self):
        """Load all migration files from the migrations directory"""
        if not self.migrations_dir.exists():
            self.migrations_dir.mkdir(parents=True, exist_ok=True)
            return
        
        migration_files = sorted(self.migrations_dir.glob("*.sql"))
        
        for file_path in migration_files:
            try:
                migration = self._parse_migration_file(file_path)
                if migration:
                    self.migrations.append(migration)
            except Exception as e:
                logger.error(f"Failed to parse migration file {file_path}: {e}")
    
    def _parse_migration_file(self, file_path: Path) -> Optional[Migration]:
        """Parse a migration file and extract migration information"""
        filename = file_path.stem
        match = re.match(r'^(\d{14})_(.+)$', filename)
        
        if not match:
            logger.warning(f"Invalid migration filename format: {filename}")
            return None
        
        version = match.group(1)
        name = match.group(2).replace('_', ' ').title()
        
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Split content by migration markers
        parts = content.split('-- DOWN')
        up_sql = parts[0].replace('-- UP', '').strip()
        down_sql = parts[1].strip() if len(parts) > 1 else ""
        
        return Migration(version, name, up_sql, down_sql)
    
    def create_migration(self, name: str) -> str:
        """Create a new migration file"""
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        filename = f"{timestamp}_{name.lower().replace(' ', '_')}.sql"
        file_path = self.migrations_dir / filename
        
        template = f"""-- UP
-- Migration: {name}
-- Created: {datetime.utcnow().isoformat()}

-- Add your migration SQL here


-- DOWN
-- Rollback migration: {name}

-- Add your rollback SQL here

"""
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(template)
        
        logger.info(f"Created migration file: {file_path}")
        return str(file_path)
    
    def get_migrations(self) -> List[Migration]:
        """Get all available migrations"""
        return self.migrations
    
    def get_migration(self, version: str) -> Optional[Migration]:
        """Get a specific migration by version"""
        for migration in self.migrations:
            if migration.version == version:
                return migration
        return None
    
    def get_pending_migrations(self, applied_versions: List[str]) -> List[Migration]:
        """Get migrations that haven't been applied yet"""
        return [m for m in self.migrations if m.version not in applied_versions]
    
    def get_applied_migrations(self, applied_versions: List[str]) -> List[Migration]:
        """Get migrations that have been applied"""
        return [m for m in self.migrations if m.version in applied_versions]

class MigrationTracker:
    """Tracks applied migrations in the database"""
    
    def __init__(self, connection):
        self.connection = connection
        self._ensure_migrations_table()
    
    def _ensure_migrations_table(self):
        """Ensure the migrations table exists"""
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version VARCHAR(14) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            checksum VARCHAR(64)
        );
        """
        
        # This would be implemented based on the connection type
        # For now, we'll just log the SQL
        logger.info(f"Ensuring migrations table exists: {create_table_sql}")
    
    async def get_applied_versions(self) -> List[str]:
        """Get list of applied migration versions"""
        # This would query the schema_migrations table
        # For now, return empty list
        return []
    
    async def mark_migration_applied(self, migration: Migration):
        """Mark a migration as applied"""
        # This would insert into the schema_migrations table
        logger.info(f"Marking migration as applied: {migration.version} - {migration.name}")
    
    async def mark_migration_rolled_back(self, version: str):
        """Mark a migration as rolled back"""
        # This would delete from the schema_migrations table
        logger.info(f"Marking migration as rolled back: {version}")

class DatabaseMigrator:
    """Main database migration orchestrator"""
    
    def __init__(self, connection, migrations_dir: str = "migrations"):
        self.connection = connection
        self.migration_manager = MigrationManager(migrations_dir)
        self.tracker = MigrationTracker(connection)
    
    async def migrate_up(self, target_version: Optional[str] = None) -> bool:
        """Run migrations up to target version"""
        try:
            applied_versions = await self.tracker.get_applied_versions()
            pending_migrations = self.migration_manager.get_pending_migrations(applied_versions)
            
            if target_version:
                pending_migrations = [m for m in pending_migrations if m.version <= target_version]
            
            for migration in pending_migrations:
                logger.info(f"Applying migration: {migration.version} - {migration.name}")
                
                # Execute migration SQL
                await self.connection.execute_query(migration.up_sql)
                
                # Mark as applied
                await self.tracker.mark_migration_applied(migration)
                
                logger.info(f"Successfully applied migration: {migration.version}")
            
            return True
            
        except Exception as e:
            logger.error(f"Migration failed: {e}")
            return False
    
    async def migrate_down(self, target_version: Optional[str] = None) -> bool:
        """Rollback migrations down to target version"""
        try:
            applied_versions = await self.tracker.get_applied_versions()
            applied_migrations = self.migration_manager.get_applied_migrations(applied_versions)
            
            if target_version:
                applied_migrations = [m for m in applied_migrations if m.version > target_version]
            
            # Sort in reverse order for rollback
            applied_migrations.sort(key=lambda x: x.version, reverse=True)
            
            for migration in applied_migrations:
                if not migration.down_sql:
                    logger.warning(f"No rollback SQL for migration: {migration.version}")
                    continue
                
                logger.info(f"Rolling back migration: {migration.version} - {migration.name}")
                
                # Execute rollback SQL
                await self.connection.execute_query(migration.down_sql)
                
                # Mark as rolled back
                await self.tracker.mark_migration_rolled_back(migration.version)
                
                logger.info(f"Successfully rolled back migration: {migration.version}")
            
            return True
            
        except Exception as e:
            logger.error(f"Rollback failed: {e}")
            return False
    
    async def get_migration_status(self) -> Dict[str, Any]:
        """Get current migration status"""
        applied_versions = await self.tracker.get_applied_versions()
        all_migrations = self.migration_manager.get_migrations()
        pending_migrations = self.migration_manager.get_pending_migrations(applied_versions)
        
        return {
            "total_migrations": len(all_migrations),
            "applied_migrations": len(applied_versions),
            "pending_migrations": len(pending_migrations),
            "applied_versions": applied_versions,
            "pending_versions": [m.version for m in pending_migrations]
        }
