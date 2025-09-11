# Query Caching for Analytics Service
import hashlib
import json
import time
from typing import Any, Optional, Dict, List, Callable
from functools import wraps
import redis
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class AnalyticsQueryCache:
    def __init__(self, redis_client: redis.Redis, default_ttl: int = 300):
        self.redis = redis_client
        self.default_ttl = default_ttl
        self.stats = {
            'hits': 0,
            'misses': 0,
            'evictions': 0,
            'errors': 0,
            'warm_ups': 0
        }

    def _generate_key(self, query_type: str, params: Dict = None) -> str:
        """Generate cache key for analytics queries"""
        key_data = {
            'type': query_type,
            'params': params or {},
            'timestamp': int(time.time() // 300) * 300  # 5-minute buckets
        }
        key_string = json.dumps(key_data, sort_keys=True)
        return f"analytics:{hashlib.md5(key_string.encode()).hexdigest()}"

    def get(self, query_type: str, params: Dict = None) -> Optional[Any]:
        """Get cached analytics result"""
        try:
            cache_key = self._generate_key(query_type, params)
            cached_data = self.redis.get(cache_key)
            
            if cached_data:
                self.stats['hits'] += 1
                return json.loads(cached_data)
            else:
                self.stats['misses'] += 1
                return None
        except Exception as e:
            logger.error(f"Analytics cache get error: {e}")
            self.stats['errors'] += 1
            return None

    def set(self, query_type: str, result: Any, params: Dict = None, 
            ttl: int = None) -> bool:
        """Cache analytics result"""
        try:
            cache_key = self._generate_key(query_type, params)
            ttl = ttl or self.default_ttl
            
            # Add metadata to result
            cached_result = {
                'data': result,
                'cached_at': datetime.now().isoformat(),
                'query_type': query_type,
                'params': params
            }
            
            serialized = json.dumps(cached_result, default=str)
            self.redis.setex(cache_key, ttl, serialized)
            return True
        except Exception as e:
            logger.error(f"Analytics cache set error: {e}")
            self.stats['errors'] += 1
            return False

    def invalidate_by_pattern(self, pattern: str) -> int:
        """Invalidate cache entries by pattern"""
        try:
            keys = self.redis.keys(f"analytics:{pattern}")
            if keys:
                return self.redis.delete(*keys)
            return 0
        except Exception as e:
            logger.error(f"Analytics cache invalidation error: {e}")
            self.stats['errors'] += 1
            return 0

    def warm_up_common_queries(self, query_functions: Dict[str, Callable]):
        """Pre-populate cache with common analytics queries"""
        for query_type, func in query_functions.items():
            try:
                result = func()
                self.set(query_type, result)
                self.stats['warm_ups'] += 1
                logger.info(f"Warmed up cache for {query_type}")
            except Exception as e:
                logger.error(f"Cache warm-up failed for {query_type}: {e}")

    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        total_requests = self.stats['hits'] + self.stats['misses']
        hit_rate = (self.stats['hits'] / total_requests * 100) if total_requests > 0 else 0
        
        return {
            **self.stats,
            'hit_rate': round(hit_rate, 2),
            'total_requests': total_requests
        }

def cached_analytics_query(ttl: int = 300):
    """Decorator for caching analytics queries"""
    def decorator(func):
        @wraps(func)
        def wrapper(self, *args, **kwargs):
            # Generate cache key
            cache_key_data = {
                'function': func.__name__,
                'args': args,
                'kwargs': kwargs
            }
            cache_key = hashlib.md5(
                json.dumps(cache_key_data, sort_keys=True).encode()
            ).hexdigest()
            
            # Try cache first
            cached_result = self.query_cache.get(func.__name__, 
                                               {'args': args, 'kwargs': kwargs})
            
            if cached_result is not None:
                return cached_result['data']
            
            # Execute function and cache result
            result = func(self, *args, **kwargs)
            self.query_cache.set(func.__name__, result, 
                               {'args': args, 'kwargs': kwargs}, ttl)
            
            return result
        return wrapper
    return decorator

class AnalyticsCacheManager:
    """Manager for analytics query caching"""
    
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.query_cache = AnalyticsQueryCache(redis_client)
        
    def get_dashboard_data(self, user_id: str, date_range: Dict = None) -> Dict:
        """Get cached dashboard data"""
        params = {
            'user_id': user_id,
            'date_range': date_range or {}
        }
        
        cached = self.query_cache.get('dashboard', params)
        if cached:
            return cached['data']
        
        # This would call the actual analytics service
        # For now, return empty data
        result = {
            'total_documents': 0,
            'total_instructions': 0,
            'recent_activity': [],
            'compliance_score': 0
        }
        
        self.query_cache.set('dashboard', result, params, 300)
        return result

    def get_user_activity(self, user_id: str, days: int = 30) -> List[Dict]:
        """Get cached user activity data"""
        params = {
            'user_id': user_id,
            'days': days
        }
        
        cached = self.query_cache.get('user_activity', params)
        if cached:
            return cached['data']
        
        # This would call the actual analytics service
        result = []
        
        self.query_cache.set('user_activity', result, params, 600)
        return result

    def get_compliance_report(self, tenant_id: str, period: str = 'monthly') -> Dict:
        """Get cached compliance report"""
        params = {
            'tenant_id': tenant_id,
            'period': period
        }
        
        cached = self.query_cache.get('compliance_report', params)
        if cached:
            return cached['data']
        
        # This would call the actual analytics service
        result = {
            'compliance_score': 85.5,
            'total_checks': 100,
            'passed_checks': 85,
            'failed_checks': 15,
            'recommendations': []
        }
        
        self.query_cache.set('compliance_report', result, params, 900)
        return result

    def invalidate_user_cache(self, user_id: str):
        """Invalidate all cache entries for a specific user"""
        patterns = [
            f"*user_id:{user_id}*",
            f"*dashboard*{user_id}*",
            f"*user_activity*{user_id}*"
        ]
        
        total_deleted = 0
        for pattern in patterns:
            total_deleted += self.query_cache.invalidate_by_pattern(pattern)
        
        logger.info(f"Invalidated {total_deleted} cache entries for user {user_id}")
        return total_deleted

    def invalidate_tenant_cache(self, tenant_id: str):
        """Invalidate all cache entries for a specific tenant"""
        patterns = [
            f"*tenant_id:{tenant_id}*",
            f"*compliance_report*{tenant_id}*"
        ]
        
        total_deleted = 0
        for pattern in patterns:
            total_deleted += self.query_cache.invalidate_by_pattern(pattern)
        
        logger.info(f"Invalidated {total_deleted} cache entries for tenant {tenant_id}")
        return total_deleted

# Cache configuration for different analytics queries
ANALYTICS_CACHE_CONFIG = {
    'dashboard': {'ttl': 300, 'description': 'Dashboard data - 5 minutes'},
    'user_activity': {'ttl': 600, 'description': 'User activity - 10 minutes'},
    'compliance_report': {'ttl': 900, 'description': 'Compliance reports - 15 minutes'},
    'document_stats': {'ttl': 300, 'description': 'Document statistics - 5 minutes'},
    'instruction_stats': {'ttl': 300, 'description': 'Instruction statistics - 5 minutes'},
    'risk_assessment': {'ttl': 1800, 'description': 'Risk assessment - 30 minutes'},
    'trends': {'ttl': 600, 'description': 'Trend analysis - 10 minutes'},
    'real_time_metrics': {'ttl': 60, 'description': 'Real-time metrics - 1 minute'}
}

# Cache warming strategies
CACHE_WARMING_STRATEGIES = {
    'aggressive': {
        'dashboard': 300,
        'user_activity': 600,
        'compliance_report': 900
    },
    'conservative': {
        'dashboard': 600,
        'user_activity': 1200,
        'compliance_report': 1800
    },
    'real_time': {
        'dashboard': 60,
        'user_activity': 300,
        'compliance_report': 600
    }
}
