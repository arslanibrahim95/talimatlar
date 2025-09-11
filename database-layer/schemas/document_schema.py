"""
Document Management Schema
Contains all models related to document storage, versioning, and access control
"""

from sqlalchemy import Column, String, Integer, DateTime, Boolean, Text, JSON, ForeignKey, Index, BigInteger
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

Base = declarative_base()

class DocumentCategory(Base):
    """Document categorization system"""
    __tablename__ = "document_categories"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    description = Column(Text)
    parent_id = Column(String, ForeignKey('document_categories.id'))
    tenant_id = Column(String, ForeignKey('tenants.id'), nullable=False)
    color = Column(String(7))  # Hex color code
    icon = Column(String(50))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    parent = relationship("DocumentCategory", remote_side=[id])
    children = relationship("DocumentCategory", back_populates="parent")
    tenant = relationship("Tenant")
    documents = relationship("Document", back_populates="category")

class Document(Base):
    """Main document storage and metadata"""
    __tablename__ = "documents"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(500), nullable=False)
    description = Column(Text)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(BigInteger, nullable=False)
    mime_type = Column(String(100))
    file_hash = Column(String(64))  # SHA-256 hash for integrity
    category_id = Column(String, ForeignKey('document_categories.id'))
    tenant_id = Column(String, ForeignKey('tenants.id'), nullable=False)
    uploaded_by = Column(String, ForeignKey('users.id'), nullable=False)
    
    # Document properties
    status = Column(String(50), default='active')  # active, archived, deleted
    is_public = Column(Boolean, default=False)
    is_encrypted = Column(Boolean, default=False)
    encryption_key_id = Column(String)
    
    # Metadata
    tags = Column(JSON, default=list)
    metadata = Column(JSON, default=dict)
    search_vector = Column(Text)  # For full-text search
    
    # Analytics
    view_count = Column(Integer, default=0)
    download_count = Column(Integer, default=0)
    share_count = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_accessed = Column(DateTime)
    
    # Relationships
    category = relationship("DocumentCategory", back_populates="documents")
    tenant = relationship("Tenant", back_populates="documents")
    uploaded_by_user = relationship("User", back_populates="uploaded_documents")
    versions = relationship("DocumentVersion", back_populates="document", cascade="all, delete-orphan")
    access_controls = relationship("DocumentAccess", back_populates="document", cascade="all, delete-orphan")
    analytics = relationship("DocumentAnalytics", back_populates="document", cascade="all, delete-orphan")
    comments = relationship("DocumentComment", back_populates="document", cascade="all, delete-orphan")

class DocumentVersion(Base):
    """Document version control"""
    __tablename__ = "document_versions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String, ForeignKey('documents.id'), nullable=False)
    version_number = Column(Integer, nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(BigInteger, nullable=False)
    mime_type = Column(String(100))
    file_hash = Column(String(64))
    change_description = Column(Text)
    created_by = Column(String, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    document = relationship("Document", back_populates="versions")
    created_by_user = relationship("User")

class DocumentAccess(Base):
    """Document access control and permissions"""
    __tablename__ = "document_access"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String, ForeignKey('documents.id'), nullable=False)
    user_id = Column(String, ForeignKey('users.id'))
    role = Column(String(50))  # For role-based access
    access_type = Column(String(50), nullable=False)  # view, download, edit, delete, share
    granted_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)
    granted_by = Column(String, ForeignKey('users.id'))
    is_active = Column(Boolean, default=True)
    
    # Relationships
    document = relationship("Document", back_populates="access_controls")
    user = relationship("User", foreign_keys=[user_id])
    granted_by_user = relationship("User", foreign_keys=[granted_by])

class DocumentAnalytics(Base):
    """Document usage analytics and tracking"""
    __tablename__ = "document_analytics"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String, ForeignKey('documents.id'), nullable=False)
    user_id = Column(String, ForeignKey('users.id'))
    action = Column(String(50), nullable=False)  # view, download, share, edit, delete
    timestamp = Column(DateTime, default=datetime.utcnow)
    ip_address = Column(String(45))
    user_agent = Column(Text)
    session_id = Column(String)
    duration = Column(Integer)  # Time spent viewing in seconds
    referrer = Column(String(500))
    
    # Relationships
    document = relationship("Document", back_populates="analytics")
    user = relationship("User")

class DocumentComment(Base):
    """Document comments and annotations"""
    __tablename__ = "document_comments"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String, ForeignKey('documents.id'), nullable=False)
    user_id = Column(String, ForeignKey('users.id'), nullable=False)
    comment = Column(Text, nullable=False)
    page_number = Column(Integer)  # For PDF comments
    x_position = Column(Integer)  # For precise positioning
    y_position = Column(Integer)
    is_resolved = Column(Boolean, default=False)
    parent_id = Column(String, ForeignKey('document_comments.id'))  # For threaded comments
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    document = relationship("Document", back_populates="comments")
    user = relationship("User")
    parent = relationship("DocumentComment", remote_side=[id])
    replies = relationship("DocumentComment", back_populates="parent")

class DocumentTag(Base):
    """Document tagging system"""
    __tablename__ = "document_tags"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False, unique=True)
    description = Column(Text)
    color = Column(String(7))  # Hex color code
    tenant_id = Column(String, ForeignKey('tenants.id'))
    usage_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant")

# Indexes for performance
Index('idx_documents_tenant_id', Document.tenant_id)
Index('idx_documents_uploaded_by', Document.uploaded_by)
Index('idx_documents_category_id', Document.category_id)
Index('idx_documents_status', Document.status)
Index('idx_documents_created_at', Document.created_at)
Index('idx_documents_search', Document.search_vector, postgresql_using='gin')
Index('idx_document_versions_document_id', DocumentVersion.document_id)
Index('idx_document_versions_version_number', DocumentVersion.version_number)
Index('idx_document_access_document_id', DocumentAccess.document_id)
Index('idx_document_access_user_id', DocumentAccess.user_id)
Index('idx_document_access_expires_at', DocumentAccess.expires_at)
Index('idx_document_analytics_document_id', DocumentAnalytics.document_id)
Index('idx_document_analytics_user_id', DocumentAnalytics.user_id)
Index('idx_document_analytics_timestamp', DocumentAnalytics.timestamp)
Index('idx_document_analytics_action', DocumentAnalytics.action)
Index('idx_document_comments_document_id', DocumentComment.document_id)
Index('idx_document_comments_user_id', DocumentComment.user_id)
Index('idx_document_categories_tenant_id', DocumentCategory.tenant_id)
Index('idx_document_categories_parent_id', DocumentCategory.parent_id)
