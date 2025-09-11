"""
Base Database Connection Interface
Defines the common interface for all database connections
"""

from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, List
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class BaseDatabaseConnection(ABC):
    """Abstract base class for database connections"""
    
    def __init__(self, connection_string: str, **kwargs):
        self.connection_string = connection_string
        self.kwargs = kwargs
        self._connection = None
        self._is_connected = False
    
    @abstractmethod
    async def connect(self) -> bool:
        """Establish database connection"""
        pass
    
    @abstractmethod
    async def disconnect(self) -> bool:
        """Close database connection"""
        pass
    
    @abstractmethod
    async def execute_query(self, query: str, params: Optional[Dict[str, Any]] = None) -> Any:
        """Execute a database query"""
        pass
    
    @abstractmethod
    async def execute_transaction(self, queries: List[Dict[str, Any]]) -> bool:
        """Execute multiple queries in a transaction"""
        pass
    
    @abstractmethod
    async def health_check(self) -> bool:
        """Check database connection health"""
        pass
    
    @property
    def is_connected(self) -> bool:
        """Check if database is connected"""
        return self._is_connected
    
    def get_connection_info(self) -> Dict[str, Any]:
        """Get connection information"""
        return {
            "connection_string": self.connection_string,
            "is_connected": self._is_connected,
            "connection_time": getattr(self, '_connection_time', None),
            "last_activity": getattr(self, '_last_activity', None)
        }

class DatabaseConnectionPool:
    """Database connection pool manager"""
    
    def __init__(self, max_connections: int = 10):
        self.max_connections = max_connections
        self.connections: List[BaseDatabaseConnection] = []
        self.available_connections: List[BaseDatabaseConnection] = []
        self.busy_connections: List[BaseDatabaseConnection] = []
    
    async def get_connection(self, connection_string: str, connection_class: type) -> Optional[BaseDatabaseConnection]:
        """Get a database connection from the pool"""
        # Check for available connections
        for conn in self.available_connections:
            if conn.connection_string == connection_string:
                self.available_connections.remove(conn)
                self.busy_connections.append(conn)
                return conn
        
        # Create new connection if under limit
        if len(self.connections) < self.max_connections:
            conn = connection_class(connection_string)
            if await conn.connect():
                self.connections.append(conn)
                self.busy_connections.append(conn)
                return conn
        
        return None
    
    async def release_connection(self, connection: BaseDatabaseConnection):
        """Release a database connection back to the pool"""
        if connection in self.busy_connections:
            self.busy_connections.remove(connection)
            self.available_connections.append(connection)
    
    async def close_all_connections(self):
        """Close all database connections"""
        for conn in self.connections:
            await conn.disconnect()
        self.connections.clear()
        self.available_connections.clear()
        self.busy_connections.clear()

class DatabaseConfig:
    """Database configuration management"""
    
    def __init__(self, config_dict: Dict[str, Any]):
        self.config = config_dict
        self._validate_config()
    
    def _validate_config(self):
        """Validate database configuration"""
        required_fields = ['host', 'port', 'database', 'username', 'password']
        for field in required_fields:
            if field not in self.config:
                raise ValueError(f"Missing required database configuration: {field}")
    
    def get_connection_string(self, driver: str = 'postgresql') -> str:
        """Get database connection string"""
        return f"{driver}://{self.config['username']}:{self.config['password']}@{self.config['host']}:{self.config['port']}/{self.config['database']}"
    
    def get_async_connection_string(self, driver: str = 'postgresql+asyncpg') -> str:
        """Get async database connection string"""
        return f"{driver}://{self.config['username']}:{self.config['password']}@{self.config['host']}:{self.config['port']}/{self.config['database']}"
    
    def get_connection_params(self) -> Dict[str, Any]:
        """Get connection parameters"""
        return {
            'host': self.config['host'],
            'port': self.config['port'],
            'database': self.config['database'],
            'username': self.config['username'],
            'password': self.config['password'],
            'ssl_mode': self.config.get('ssl_mode', 'prefer'),
            'pool_size': self.config.get('pool_size', 10),
            'max_overflow': self.config.get('max_overflow', 20),
            'pool_timeout': self.config.get('pool_timeout', 30),
            'pool_recycle': self.config.get('pool_recycle', 3600)
        }
