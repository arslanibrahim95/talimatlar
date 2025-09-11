# Database Query Caching for Document Service
import hashlib
import json
import time
from typing import Any, Optional, Dict, List
from functools import wraps
import redis
from sqlalchemy import text
from sqlalchemy.orm import Session
import logging

logger = logging.getLogger(__name__)

class DatabaseCache:
    def __init__(self, redis_client: redis.Redis, default_ttl: int = 300):
        self.redis = redis_client
        self.default_ttl = default_ttl
        self.stats = {
            'hits': 0,
            'misses': 0,
            'evictions': 0,
            'errors': 0
        }

    def _generate_cache_key(self, query: str, params: Dict = None, prefix: str = "db") -> str:
        """Generate a cache key from query and parameters"""
        key_data = {
            'query': query,
            'params': params or {}
        }
        key_string = json.dumps(key_data, sort_keys=True)
        key_hash = hashlib.md5(key_string.encode()).hexdigest()
        return f"{prefix}:{key_hash}"

    def get(self, query: str, params: Dict = None, prefix: str = "db") -> Optional[Any]:
        """Get cached query result"""
        try:
            cache_key = self._generate_cache_key(query, params, prefix)
            cached_data = self.redis.get(cache_key)
            
            if cached_data:
                self.stats['hits'] += 1
                return json.loads(cached_data)
            else:
                self.stats['misses'] += 1
                return None
        except Exception as e:
            logger.error(f"Cache get error: {e}")
            self.stats['errors'] += 1
            return None

    def set(self, query: str, result: Any, params: Dict = None, 
            ttl: int = None, prefix: str = "db") -> bool:
        """Cache query result"""
        try:
            cache_key = self._generate_cache_key(query, params, prefix)
            ttl = ttl or self.default_ttl
            
            # Serialize result
            serialized_result = json.dumps(result, default=str)
            
            # Store in Redis
            self.redis.setex(cache_key, ttl, serialized_result)
            return True
        except Exception as e:
            logger.error(f"Cache set error: {e}")
            self.stats['errors'] += 1
            return False

    def delete(self, query: str, params: Dict = None, prefix: str = "db") -> bool:
        """Delete cached query result"""
        try:
            cache_key = self._generate_cache_key(query, params, prefix)
            return bool(self.redis.delete(cache_key))
        except Exception as e:
            logger.error(f"Cache delete error: {e}")
            self.stats['errors'] += 1
            return False

    def invalidate_pattern(self, pattern: str) -> int:
        """Invalidate cache entries matching pattern"""
        try:
            keys = self.redis.keys(pattern)
            if keys:
                return self.redis.delete(*keys)
            return 0
        except Exception as e:
            logger.error(f"Cache pattern invalidation error: {e}")
            self.stats['errors'] += 1
            return 0

    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        total_requests = self.stats['hits'] + self.stats['misses']
        hit_rate = (self.stats['hits'] / total_requests * 100) if total_requests > 0 else 0
        
        return {
            **self.stats,
            'hit_rate': round(hit_rate, 2),
            'total_requests': total_requests
        }

    def clear_stats(self):
        """Clear cache statistics"""
        self.stats = {
            'hits': 0,
            'misses': 0,
            'evictions': 0,
            'errors': 0
        }

def cached_query(ttl: int = 300, prefix: str = "db"):
    """Decorator for caching database queries"""
    def decorator(func):
        @wraps(func)
        def wrapper(self, *args, **kwargs):
            # Generate cache key from function name and arguments
            cache_key_data = {
                'function': func.__name__,
                'args': args,
                'kwargs': kwargs
            }
            cache_key = hashlib.md5(
                json.dumps(cache_key_data, sort_keys=True).encode()
            ).hexdigest()
            
            # Try to get from cache
            cached_result = self.db_cache.get(f"func:{func.__name__}", 
                                           {'args': args, 'kwargs': kwargs}, 
                                           prefix)
            
            if cached_result is not None:
                return cached_result
            
            # Execute function and cache result
            result = func(self, *args, **kwargs)
            self.db_cache.set(f"func:{func.__name__}", result, 
                            {'args': args, 'kwargs': kwargs}, 
                            ttl, prefix)
            
            return result
        return wrapper
    return decorator

class QueryCacheManager:
    """Manager for database query caching"""
    
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.cache = DatabaseCache(redis_client)
        
    def execute_cached_query(self, session: Session, query: str, 
                           params: Dict = None, ttl: int = 300) -> List[Dict]:
        """Execute a query with caching"""
        # Try cache first
        cached_result = self.cache.get(query, params)
        if cached_result is not None:
            return cached_result
        
        # Execute query
        try:
            result = session.execute(text(query), params or {}).fetchall()
            # Convert to list of dicts
            result_list = [dict(row._mapping) for row in result]
            
            # Cache result
            self.cache.set(query, result_list, params, ttl)
            
            return result_list
        except Exception as e:
            logger.error(f"Query execution error: {e}")
            raise

    def invalidate_table_cache(self, table_name: str):
        """Invalidate all cache entries for a specific table"""
        patterns = [
            f"db:*{table_name}*",
            f"func:*{table_name}*"
        ]
        
        total_deleted = 0
        for pattern in patterns:
            total_deleted += self.cache.invalidate_pattern(pattern)
        
        logger.info(f"Invalidated {total_deleted} cache entries for table {table_name}")
        return total_deleted

    def warm_up_cache(self, queries: List[Dict[str, Any]]):
        """Pre-populate cache with common queries"""
        for query_info in queries:
            query = query_info['query']
            params = query_info.get('params', {})
            ttl = query_info.get('ttl', 300)
            
            # Execute and cache
            try:
                # This would need a database session
                # result = self.execute_cached_query(session, query, params, ttl)
                logger.info(f"Warmed up cache for query: {query[:50]}...")
            except Exception as e:
                logger.error(f"Cache warm-up error: {e}")

# Cache configuration for different query types
CACHE_CONFIGS = {
    'user_queries': {'ttl': 600, 'prefix': 'user'},      # 10 minutes
    'document_queries': {'ttl': 300, 'prefix': 'doc'},   # 5 minutes
    'search_queries': {'ttl': 180, 'prefix': 'search'},  # 3 minutes
    'analytics_queries': {'ttl': 900, 'prefix': 'analytics'}, # 15 minutes
    'static_queries': {'ttl': 3600, 'prefix': 'static'}  # 1 hour
}

# Common queries for cache warm-up
COMMON_QUERIES = [
    {
        'query': 'SELECT COUNT(*) as total FROM documents WHERE status = :status',
        'params': {'status': 'active'},
        'ttl': 300
    },
    {
        'query': 'SELECT category, COUNT(*) as count FROM documents GROUP BY category',
        'ttl': 600
    },
    {
        'query': 'SELECT * FROM document_categories ORDER BY name',
        'ttl': 3600
    }
]
