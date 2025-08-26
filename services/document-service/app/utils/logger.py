import structlog
import sys
import logging
from typing import Any, Dict
from app.config import settings

def setup_logging():
    """Setup structured logging for the application"""
    
    # Configure structlog
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.processors.JSONRenderer()
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )
    
    # Configure standard library logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, settings.log_level.upper()),
    )
    
    # Set log levels for external libraries
    logging.getLogger("uvicorn").setLevel(logging.INFO)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    
    # Create logger instance
    logger = structlog.get_logger()
    logger.info("Logging configured", level=settings.log_level)

def get_logger(name: str = None) -> structlog.BoundLogger:
    """Get a logger instance"""
    return structlog.get_logger(name)

class DocumentLogger:
    """Specialized logger for document operations"""
    
    def __init__(self, logger_name: str = "document_service"):
        self.logger = structlog.get_logger(logger_name)
    
    def document_created(self, document_id: str, user_id: str, filename: str, **kwargs):
        """Log document creation"""
        self.logger.info("Document created",
                        document_id=document_id,
                        user_id=user_id,
                        filename=filename,
                        **kwargs)
    
    def document_updated(self, document_id: str, user_id: str, **kwargs):
        """Log document update"""
        self.logger.info("Document updated",
                        document_id=document_id,
                        user_id=user_id,
                        **kwargs)
    
    def document_deleted(self, document_id: str, user_id: str, **kwargs):
        """Log document deletion"""
        self.logger.info("Document deleted",
                        document_id=document_id,
                        user_id=user_id,
                        **kwargs)
    
    def document_viewed(self, document_id: str, user_id: str, **kwargs):
        """Log document view"""
        self.logger.info("Document viewed",
                        document_id=document_id,
                        user_id=user_id,
                        **kwargs)
    
    def document_downloaded(self, document_id: str, user_id: str, **kwargs):
        """Log document download"""
        self.logger.info("Document downloaded",
                        document_id=document_id,
                        user_id=user_id,
                        **kwargs)
    
    def file_upload_failed(self, filename: str, user_id: str, error: str, **kwargs):
        """Log file upload failure"""
        self.logger.error("File upload failed",
                         filename=filename,
                         user_id=user_id,
                         error=error,
                         **kwargs)
    
    def search_performed(self, query: str, user_id: str, result_count: int, **kwargs):
        """Log search operation"""
        self.logger.info("Search performed",
                        query=query,
                        user_id=user_id,
                        result_count=result_count,
                        **kwargs)
    
    def access_denied(self, document_id: str, user_id: str, reason: str, **kwargs):
        """Log access denial"""
        self.logger.warning("Access denied",
                           document_id=document_id,
                           user_id=user_id,
                           reason=reason,
                           **kwargs)

class SecurityLogger:
    """Specialized logger for security events"""
    
    def __init__(self, logger_name: str = "security"):
        self.logger = structlog.get_logger(logger_name)
    
    def authentication_success(self, user_id: str, ip_address: str, **kwargs):
        """Log successful authentication"""
        self.logger.info("Authentication success",
                        user_id=user_id,
                        ip_address=ip_address,
                        **kwargs)
    
    def authentication_failure(self, user_id: str, ip_address: str, reason: str, **kwargs):
        """Log failed authentication"""
        self.logger.warning("Authentication failure",
                           user_id=user_id,
                           ip_address=ip_address,
                           reason=reason,
                           **kwargs)
    
    def authorization_failure(self, user_id: str, resource: str, action: str, **kwargs):
        """Log authorization failure"""
        self.logger.warning("Authorization failure",
                           user_id=user_id,
                           resource=resource,
                           action=action,
                           **kwargs)
    
    def suspicious_activity(self, user_id: str, activity: str, details: Dict[str, Any], **kwargs):
        """Log suspicious activity"""
        self.logger.warning("Suspicious activity detected",
                           user_id=user_id,
                           activity=activity,
                           details=details,
                           **kwargs)

class PerformanceLogger:
    """Specialized logger for performance metrics"""
    
    def __init__(self, logger_name: str = "performance"):
        self.logger = structlog.get_logger(logger_name)
    
    def database_query(self, operation: str, table: str, duration: float, **kwargs):
        """Log database query performance"""
        self.logger.info("Database query",
                        operation=operation,
                        table=table,
                        duration=duration,
                        **kwargs)
    
    def file_operation(self, operation: str, filename: str, file_size: int, duration: float, **kwargs):
        """Log file operation performance"""
        self.logger.info("File operation",
                        operation=operation,
                        filename=filename,
                        file_size=file_size,
                        duration=duration,
                        **kwargs)
    
    def api_request(self, endpoint: str, method: str, duration: float, status_code: int, **kwargs):
        """Log API request performance"""
        self.logger.info("API request",
                        endpoint=endpoint,
                        method=method,
                        duration=duration,
                        status_code=status_code,
                        **kwargs)
    
    def search_performance(self, query: str, result_count: int, duration: float, **kwargs):
        """Log search performance"""
        self.logger.info("Search performance",
                        query=query,
                        result_count=result_count,
                        duration=duration,
                        **kwargs)

# Create global logger instances
document_logger = DocumentLogger()
security_logger = SecurityLogger()
performance_logger = PerformanceLogger()
