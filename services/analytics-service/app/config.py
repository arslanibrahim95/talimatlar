from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    # Application settings
    app_name: str = "Claude Analytics Service"
    version: str = "1.0.0"
    debug: bool = False
    port: int = 8003
    
    # Database settings
    database_url: str = "postgresql://safety_admin:strong_password_here@localhost:5432/safety_production"
    
    # Redis settings
    redis_url: str = "redis://localhost:6379"
    
    # JWT settings
    jwt_secret: str = "your-super-secret-jwt-key-here"
    jwt_algorithm: str = "HS256"
    jwt_expiration: int = 24 * 60 * 60  # 24 hours
    
    # CORS settings
    cors_origins: List[str] = ["http://localhost:3000", "http://localhost:8080"]
    
    # Logging settings
    log_level: str = "INFO"
    
    # Auth service URL
    auth_service_url: str = "http://localhost:8001"
    
    # Document service URL
    document_service_url: str = "http://localhost:8002"
    
    # Analytics settings
    cache_ttl: int = 300  # 5 minutes
    max_data_points: int = 1000
    default_analysis_period: int = 30  # days
    
    # Reporting settings
    report_storage_path: str = "/tmp/reports"
    max_report_size: int = 50 * 1024 * 1024  # 50MB
    
    # Prometheus settings
    prometheus_enabled: bool = True
    metrics_port: int = 9091
    
    class Config:
        env_file = ".env"
        case_sensitive = False

# Create settings instance
settings = Settings()

# Environment-specific overrides
if os.getenv("NODE_ENV") == "production":
    settings.debug = False
    settings.cors_origins = ["https://yourdomain.com"]
else:
    settings.debug = True
