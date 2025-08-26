from sqlalchemy import create_engine, MetaData, Table, Column, String, Integer, DateTime, Boolean, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.future import select
from datetime import datetime
import uuid
from typing import Optional, List
import structlog

from app.config import settings

logger = structlog.get_logger()

# Create async engine
engine = create_async_engine(
    settings.database_url.replace("postgresql://", "postgresql+asyncpg://"),
    echo=settings.debug,
    pool_size=10,
    max_overflow=20
)

# Create sync engine for migrations
sync_engine = create_engine(
    settings.database_url,
    echo=settings.debug
)

# Create session factory
AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

# Create base class
Base = declarative_base()

# Database models
class Document(Base):
    __tablename__ = "documents"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False)
    description = Column(Text)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String(100))
    category = Column(String(100), nullable=False)
    tags = Column(JSON, default=list)
    metadata = Column(JSON, default=dict)
    
    # User and tenant info
    uploaded_by = Column(String, nullable=False)
    tenant_id = Column(String)
    
    # Status and timestamps
    is_active = Column(Boolean, default=True)
    is_public = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Search and analytics
    search_vector = Column(Text)  # For full-text search
    view_count = Column(Integer, default=0)
    download_count = Column(Integer, default=0)

class DocumentVersion(Base):
    __tablename__ = "document_versions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String, nullable=False)
    version_number = Column(Integer, nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String(100))
    change_description = Column(Text)
    
    # User info
    created_by = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class DocumentAccess(Base):
    __tablename__ = "document_access"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String, nullable=False)
    user_id = Column(String, nullable=False)
    access_type = Column(String(50), nullable=False)  # view, download, edit, delete
    granted_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)
    granted_by = Column(String)

class DocumentAnalytics(Base):
    __tablename__ = "document_analytics"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String, nullable=False)
    user_id = Column(String, nullable=False)
    action = Column(String(50), nullable=False)  # view, download, share, etc.
    timestamp = Column(DateTime, default=datetime.utcnow)
    ip_address = Column(String(45))
    user_agent = Column(Text)
    session_id = Column(String)

# Database functions
async def init_db():
    """Initialize database tables"""
    try:
        async with engine.begin() as conn:
            # Create tables
            await conn.run_sync(Base.metadata.create_all)
        
        logger.info("Database tables created successfully")
        
        # Create indexes
        await create_indexes()
        
    except Exception as e:
        logger.error("Failed to initialize database", error=str(e))
        raise

async def create_indexes():
    """Create database indexes for performance"""
    try:
        async with engine.begin() as conn:
            # Document indexes
            await conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_documents_tenant_id ON documents(tenant_id);
                CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
                CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
                CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);
                CREATE INDEX IF NOT EXISTS idx_documents_search ON documents USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));
            """)
            
            # Document version indexes
            await conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON document_versions(document_id);
                CREATE INDEX IF NOT EXISTS idx_document_versions_version_number ON document_versions(version_number DESC);
            """)
            
            # Document access indexes
            await conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_document_access_document_id ON document_access(document_id);
                CREATE INDEX IF NOT EXISTS idx_document_access_user_id ON document_access(user_id);
                CREATE INDEX IF NOT EXISTS idx_document_access_expires_at ON document_access(expires_at);
            """)
            
            # Document analytics indexes
            await conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_document_analytics_document_id ON document_analytics(document_id);
                CREATE INDEX IF NOT EXISTS idx_document_analytics_user_id ON document_analytics(user_id);
                CREATE INDEX IF NOT EXISTS idx_document_analytics_timestamp ON document_analytics(timestamp DESC);
                CREATE INDEX IF NOT EXISTS idx_document_analytics_action ON document_analytics(action);
            """)
        
        logger.info("Database indexes created successfully")
        
    except Exception as e:
        logger.error("Failed to create database indexes", error=str(e))
        raise

async def get_db() -> AsyncSession:
    """Get database session"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

# Database utilities
async def execute_query(query, params=None):
    """Execute a database query"""
    async with AsyncSessionLocal() as session:
        try:
            result = await session.execute(query, params or {})
            await session.commit()
            return result
        except Exception as e:
            await session.rollback()
            logger.error("Database query failed", error=str(e))
            raise

async def get_document_by_id(document_id: str, tenant_id: Optional[str] = None) -> Optional[Document]:
    """Get document by ID with optional tenant filtering"""
    async with AsyncSessionLocal() as session:
        try:
            query = select(Document).where(Document.id == document_id, Document.is_active == True)
            
            if tenant_id:
                query = query.where(Document.tenant_id == tenant_id)
            
            result = await session.execute(query)
            return result.scalar_one_or_none()
            
        except Exception as e:
            logger.error("Failed to get document by ID", error=str(e))
            return None

async def get_documents_by_tenant(tenant_id: str, skip: int = 0, limit: int = 20) -> List[Document]:
    """Get documents by tenant with pagination"""
    async with AsyncSessionLocal() as session:
        try:
            query = select(Document).where(
                Document.tenant_id == tenant_id,
                Document.is_active == True
            ).offset(skip).limit(limit).order_by(Document.created_at.desc())
            
            result = await session.execute(query)
            return result.scalars().all()
            
        except Exception as e:
            logger.error("Failed to get documents by tenant", error=str(e))
            return []

async def create_document_analytics(document_id: str, user_id: str, action: str, **kwargs):
    """Create document analytics entry"""
    try:
        analytics = DocumentAnalytics(
            document_id=document_id,
            user_id=user_id,
            action=action,
            ip_address=kwargs.get('ip_address'),
            user_agent=kwargs.get('user_agent'),
            session_id=kwargs.get('session_id')
        )
        
        async with AsyncSessionLocal() as session:
            session.add(analytics)
            await session.commit()
            
        logger.info("Document analytics created", 
                   document_id=document_id, 
                   user_id=user_id, 
                   action=action)
        
    except Exception as e:
        logger.error("Failed to create document analytics", error=str(e))
