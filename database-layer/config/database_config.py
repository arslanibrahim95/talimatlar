"""
Database Configuration Management
Centralized configuration for all database connections
"""

import os
from typing import Dict, Any, Optional
from dataclasses import dataclass
from .base_connection import DatabaseConfig

@dataclass
class DatabaseSettings:
    """Database configuration settings"""
    host: str
    port: int
    database: str
    username: str
    password: str
    ssl_mode: str = 'prefer'
    pool_size: int = 10
    max_overflow: int = 20
    pool_timeout: int = 30
    pool_recycle: int = 3600
    echo: bool = False

class DatabaseConfigManager:
    """Manages database configurations for all services"""
    
    def __init__(self):
        self.configs: Dict[str, DatabaseSettings] = {}
        self._load_from_environment()
    
    def _load_from_environment(self):
        """Load database configuration from environment variables"""
        # Default configuration
        default_config = DatabaseSettings(
            host=os.getenv('DB_HOST', 'localhost'),
            port=int(os.getenv('DB_PORT', '5432')),
            database=os.getenv('DB_NAME', 'talimatlar'),
            username=os.getenv('DB_USER', 'postgres'),
            password=os.getenv('DB_PASSWORD', 'password'),
            ssl_mode=os.getenv('DB_SSL_MODE', 'prefer'),
            pool_size=int(os.getenv('DB_POOL_SIZE', '10')),
            max_overflow=int(os.getenv('DB_MAX_OVERFLOW', '20')),
            pool_timeout=int(os.getenv('DB_POOL_TIMEOUT', '30')),
            pool_recycle=int(os.getenv('DB_POOL_RECYCLE', '3600')),
            echo=os.getenv('DB_ECHO', 'false').lower() == 'true'
        )
        
        # Service-specific configurations
        services = [
            'auth', 'document', 'analytics', 'notification', 
            'compliance', 'personnel', 'risk', 'training',
            'incident', 'kpi', 'instruction', 'qr'
        ]
        
        for service in services:
            service_config = DatabaseSettings(
                host=os.getenv(f'{service.upper()}_DB_HOST', default_config.host),
                port=int(os.getenv(f'{service.upper()}_DB_PORT', str(default_config.port))),
                database=os.getenv(f'{service.upper()}_DB_NAME', f'{default_config.database}_{service}'),
                username=os.getenv(f'{service.upper()}_DB_USER', default_config.username),
                password=os.getenv(f'{service.upper()}_DB_PASSWORD', default_config.password),
                ssl_mode=os.getenv(f'{service.upper()}_DB_SSL_MODE', default_config.ssl_mode),
                pool_size=int(os.getenv(f'{service.upper()}_DB_POOL_SIZE', str(default_config.pool_size))),
                max_overflow=int(os.getenv(f'{service.upper()}_DB_MAX_OVERFLOW', str(default_config.max_overflow))),
                pool_timeout=int(os.getenv(f'{service.upper()}_DB_POOL_TIMEOUT', str(default_config.pool_timeout))),
                pool_recycle=int(os.getenv(f'{service.upper()}_DB_POOL_RECYCLE', str(default_config.pool_recycle))),
                echo=os.getenv(f'{service.upper()}_DB_ECHO', 'false').lower() == 'true'
            )
            self.configs[service] = service_config
    
    def get_config(self, service_name: str) -> DatabaseSettings:
        """Get database configuration for a specific service"""
        if service_name not in self.configs:
            raise ValueError(f"No database configuration found for service: {service_name}")
        return self.configs[service_name]
    
    def get_connection_string(self, service_name: str, driver: str = 'postgresql') -> str:
        """Get connection string for a service"""
        config = self.get_config(service_name)
        return f"{driver}://{config.username}:{config.password}@{config.host}:{config.port}/{config.database}"
    
    def get_async_connection_string(self, service_name: str) -> str:
        """Get async connection string for a service"""
        return self.get_connection_string(service_name, 'postgresql+asyncpg')
    
    def get_connection_params(self, service_name: str) -> Dict[str, Any]:
        """Get connection parameters for a service"""
        config = self.get_config(service_name)
        return {
            'host': config.host,
            'port': config.port,
            'database': config.database,
            'username': config.username,
            'password': config.password,
            'ssl_mode': config.ssl_mode,
            'pool_size': config.pool_size,
            'max_overflow': config.max_overflow,
            'pool_timeout': config.pool_timeout,
            'pool_recycle': config.pool_recycle,
            'echo': config.echo
        }
    
    def add_custom_config(self, service_name: str, config: DatabaseSettings):
        """Add custom configuration for a service"""
        self.configs[service_name] = config
    
    def list_services(self) -> list:
        """List all configured services"""
        return list(self.configs.keys())

# Global configuration manager instance
config_manager = DatabaseConfigManager()

def get_database_config(service_name: str) -> DatabaseSettings:
    """Get database configuration for a service"""
    return config_manager.get_config(service_name)

def get_connection_string(service_name: str, driver: str = 'postgresql') -> str:
    """Get connection string for a service"""
    return config_manager.get_connection_string(service_name, driver)

def get_async_connection_string(service_name: str) -> str:
    """Get async connection string for a service"""
    return config_manager.get_async_connection_string(service_name)

def get_connection_params(service_name: str) -> Dict[str, Any]:
    """Get connection parameters for a service"""
    return config_manager.get_connection_params(service_name)
