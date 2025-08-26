from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    # Application settings
    app_name: str = "Claude Document Service"
    version: str = "1.0.0"
    debug: bool = False
    port: int = 8002
    
    # Database settings
    database_url: str = "postgresql://safety_admin:strong_password_here@localhost:5432/safety_production"
    
    # Redis settings
    redis_url: str = "redis://localhost:6379"
    
    # MeiliSearch settings
    meilisearch_url: str = "http://localhost:7700"
    meilisearch_key: str = "masterKey123456789"
    
    # MinIO settings
    minio_endpoint: str = "localhost:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin123"
    minio_bucket_name: str = "claude-documents"
    minio_use_ssl: bool = False
    
    # File upload settings
    max_file_size: int = 50 * 1024 * 1024  # 50MB
    allowed_file_types: str = ".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
    upload_dir: str = "uploads"
    
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
