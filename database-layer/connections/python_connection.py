"""
Python Database Connection (SQLAlchemy)
For Python services using SQLAlchemy ORM
"""

import asyncio
from typing import Optional, Dict, Any, List
from datetime import datetime
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool
from .base_connection import BaseDatabaseConnection, DatabaseConfig

logger = logging.getLogger(__name__)

class PythonDatabaseConnection(BaseDatabaseConnection):
    """Python SQLAlchemy database connection"""
    
    def __init__(self, connection_string: str, **kwargs):
        super().__init__(connection_string, **kwargs)
        self.engine = None
        self.async_engine = None
        self.session_factory = None
        self.async_session_factory = None
        self._connection_time = None
        self._last_activity = None
    
    async def connect(self) -> bool:
        """Establish database connection"""
        try:
            # Create sync engine
            self.engine = create_engine(
                self.connection_string,
                poolclass=QueuePool,
                pool_size=self.kwargs.get('pool_size', 10),
                max_overflow=self.kwargs.get('max_overflow', 20),
                pool_timeout=self.kwargs.get('pool_timeout', 30),
                pool_recycle=self.kwargs.get('pool_recycle', 3600),
                echo=self.kwargs.get('echo', False)
            )
            
            # Create async engine
            async_connection_string = self.connection_string.replace(
                'postgresql://', 'postgresql+asyncpg://'
            )
            self.async_engine = create_async_engine(
                async_connection_string,
                pool_size=self.kwargs.get('pool_size', 10),
                max_overflow=self.kwargs.get('max_overflow', 20),
                pool_timeout=self.kwargs.get('pool_timeout', 30),
                pool_recycle=self.kwargs.get('pool_recycle', 3600),
                echo=self.kwargs.get('echo', False)
            )
            
            # Create session factories
            self.session_factory = sessionmaker(bind=self.engine)
            self.async_session_factory = sessionmaker(
                self.async_engine, 
                class_=AsyncSession, 
                expire_on_commit=False
            )
            
            # Test connection
            async with self.async_engine.begin() as conn:
                await conn.execute(text("SELECT 1"))
            
            self._is_connected = True
            self._connection_time = datetime.utcnow()
            logger.info("Python database connection established")
            return True
            
        except Exception as e:
            logger.error(f"Failed to establish Python database connection: {e}")
            return False
    
    async def disconnect(self) -> bool:
        """Close database connection"""
        try:
            if self.async_engine:
                await self.async_engine.dispose()
            if self.engine:
                self.engine.dispose()
            
            self._is_connected = False
            logger.info("Python database connection closed")
            return True
            
        except Exception as e:
            logger.error(f"Failed to close Python database connection: {e}")
            return False
    
    async def execute_query(self, query: str, params: Optional[Dict[str, Any]] = None) -> Any:
        """Execute a database query"""
        if not self._is_connected:
            raise ConnectionError("Database not connected")
        
        try:
            async with self.async_engine.begin() as conn:
                result = await conn.execute(text(query), params or {})
                self._last_activity = datetime.utcnow()
                return result
        except Exception as e:
            logger.error(f"Failed to execute query: {e}")
            raise
    
    async def execute_transaction(self, queries: List[Dict[str, Any]]) -> bool:
        """Execute multiple queries in a transaction"""
        if not self._is_connected:
            raise ConnectionError("Database not connected")
        
        try:
            async with self.async_engine.begin() as conn:
                for query_data in queries:
                    query = query_data['query']
                    params = query_data.get('params', {})
                    await conn.execute(text(query), params)
                
                self._last_activity = datetime.utcnow()
                return True
        except Exception as e:
            logger.error(f"Failed to execute transaction: {e}")
            return False
    
    async def health_check(self) -> bool:
        """Check database connection health"""
        try:
            async with self.async_engine.begin() as conn:
                await conn.execute(text("SELECT 1"))
            return True
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return False
    
    def get_session(self):
        """Get a sync database session"""
        if not self._is_connected:
            raise ConnectionError("Database not connected")
        return self.session_factory()
    
    def get_async_session(self):
        """Get an async database session"""
        if not self._is_connected:
            raise ConnectionError("Database not connected")
        return self.async_session_factory()

class PythonDatabaseManager:
    """Python database manager for multiple connections"""
    
    def __init__(self):
        self.connections: Dict[str, PythonDatabaseConnection] = {}
    
    async def add_connection(self, name: str, connection_string: str, **kwargs) -> bool:
        """Add a new database connection"""
        conn = PythonDatabaseConnection(connection_string, **kwargs)
        if await conn.connect():
            self.connections[name] = conn
            return True
        return False
    
    async def get_connection(self, name: str) -> Optional[PythonDatabaseConnection]:
        """Get a database connection by name"""
        return self.connections.get(name)
    
    async def remove_connection(self, name: str) -> bool:
        """Remove a database connection"""
        if name in self.connections:
            conn = self.connections[name]
            await conn.disconnect()
            del self.connections[name]
            return True
        return False
    
    async def close_all_connections(self):
        """Close all database connections"""
        for conn in self.connections.values():
            await conn.disconnect()
        self.connections.clear()
    
    async def health_check_all(self) -> Dict[str, bool]:
        """Check health of all connections"""
        results = {}
        for name, conn in self.connections.items():
            results[name] = await conn.health_check()
        return results
