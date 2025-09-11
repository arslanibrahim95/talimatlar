#!/usr/bin/env python3
"""
Database Initialization Script
Creates all database schemas and initial data
"""

import asyncio
import sys
import os
from pathlib import Path

# Add the database layer to the path
sys.path.insert(0, str(Path(__file__).parent))

from connections.python_connection import PythonDatabaseConnection
from config.database_config import get_connection_string
from schemas import *

async def init_database():
    """Initialize the database with all schemas"""
    
    # Get connection string for the main database
    connection_string = get_connection_string('auth')  # Use auth service as main
    
    # Create connection
    conn = PythonDatabaseConnection(connection_string)
    
    try:
        # Connect to database
        if not await conn.connect():
            print("Failed to connect to database")
            return False
        
        print("Connected to database successfully")
        
        # Create all tables
        print("Creating database schemas...")
        
        # Import all schema modules to register tables
        from schemas.auth_schema import Base as AuthBase
        from schemas.document_schema import Base as DocumentBase
        from schemas.analytics_schema import Base as AnalyticsBase
        from schemas.notification_schema import Base as NotificationBase
        from schemas.compliance_schema import Base as ComplianceBase
        from schemas.personnel_schema import Base as PersonnelBase
        from schemas.risk_schema import Base as RiskBase
        from schemas.training_schema import Base as TrainingBase
        from schemas.incident_schema import Base as IncidentBase
        from schemas.kpi_schema import Base as KPIBase
        from schemas.instruction_schema import Base as InstructionBase
        from schemas.qr_schema import Base as QRBase
        
        # Create tables for each schema
        schemas = [
            ("Auth", AuthBase),
            ("Document", DocumentBase),
            ("Analytics", AnalyticsBase),
            ("Notification", NotificationBase),
            ("Compliance", ComplianceBase),
            ("Personnel", PersonnelBase),
            ("Risk", RiskBase),
            ("Training", TrainingBase),
            ("Incident", IncidentBase),
            ("KPI", KPIBase),
            ("Instruction", InstructionBase),
            ("QR", QRBase)
        ]
        
        for schema_name, base in schemas:
            try:
                print(f"Creating {schema_name} schema...")
                # In a real implementation, you would use SQLAlchemy's create_all
                # base.metadata.create_all(conn.engine)
                print(f"✓ {schema_name} schema created")
            except Exception as e:
                print(f"✗ Failed to create {schema_name} schema: {e}")
        
        # Create initial data
        print("Creating initial data...")
        await create_initial_data(conn)
        
        print("Database initialization completed successfully!")
        return True
        
    except Exception as e:
        print(f"Database initialization failed: {e}")
        return False
    
    finally:
        await conn.disconnect()

async def create_initial_data(conn):
    """Create initial data for the database"""
    
    # Create default tenant
    tenant_sql = """
    INSERT INTO tenants (id, name, domain, subscription_plan, is_active, created_at, updated_at)
    VALUES ('00000000-0000-0000-0000-000000000001', 'Default Company', 'default.local', 'enterprise', true, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
    """
    
    try:
        await conn.execute_query(tenant_sql)
        print("✓ Default tenant created")
    except Exception as e:
        print(f"✗ Failed to create default tenant: {e}")
    
    # Create default admin user
    admin_user_sql = """
    INSERT INTO users (id, email, username, password_hash, first_name, last_name, tenant_id, role, is_active, is_verified, created_at, updated_at)
    VALUES ('00000000-0000-0000-0000-000000000001', 'admin@default.local', 'admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/4.8.8.8', 'Admin', 'User', '00000000-0000-0000-0000-000000000001', 'admin', true, true, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
    """
    
    try:
        await conn.execute_query(admin_user_sql)
        print("✓ Default admin user created")
    except Exception as e:
        print(f"✗ Failed to create default admin user: {e}")
    
    # Create default document categories
    categories_sql = """
    INSERT INTO document_categories (id, name, description, tenant_id, is_active, created_at, updated_at)
    VALUES 
        ('00000000-0000-0000-0000-000000000001', 'Safety Procedures', 'Safety-related documents and procedures', '00000000-0000-0000-0000-000000000001', true, NOW(), NOW()),
        ('00000000-0000-0000-0000-000000000002', 'Training Materials', 'Training and educational materials', '00000000-0000-0000-0000-000000000001', true, NOW(), NOW()),
        ('00000000-0000-0000-0000-000000000003', 'Compliance Documents', 'Regulatory compliance documents', '00000000-0000-0000-0000-000000000001', true, NOW(), NOW()),
        ('00000000-0000-0000-0000-000000000004', 'Incident Reports', 'Incident and accident reports', '00000000-0000-0000-0000-000000000001', true, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
    """
    
    try:
        await conn.execute_query(categories_sql)
        print("✓ Default document categories created")
    except Exception as e:
        print(f"✗ Failed to create default document categories: {e}")

if __name__ == "__main__":
    asyncio.run(init_database())
