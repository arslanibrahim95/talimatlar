"""
Authentication and User Management Schema
Contains all models related to user authentication, authorization, and tenant management
"""

from sqlalchemy import Column, String, Integer, DateTime, Boolean, Text, JSON, ForeignKey, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

Base = declarative_base()

class Tenant(Base):
    """Multi-tenant company/organization management"""
    __tablename__ = "tenants"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    domain = Column(String(255), unique=True)
    tax_number = Column(String(50))
    address = Column(Text)
    phone = Column(String(20))
    email = Column(String(255))
    contact_person = Column(String(255))
    subscription_plan = Column(String(50), default='basic')
    settings = Column(JSON, default=dict)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    users = relationship("User", back_populates="tenant")
    documents = relationship("Document", back_populates="tenant")
    incidents = relationship("Incident", back_populates="tenant")
    trainings = relationship("Training", back_populates="tenant")
    personnel = relationship("Personnel", back_populates="tenant")

class User(Base):
    """User management and authentication"""
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False)
    username = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone = Column(String(20))
    tenant_id = Column(String, ForeignKey('tenants.id'), nullable=False)
    role = Column(String(50), nullable=False, default='employee')
    permissions = Column(JSON, default=list)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    last_login = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="users")
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")
    otp_codes = relationship("OTPCode", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user")
    uploaded_documents = relationship("Document", back_populates="uploaded_by_user")
    incidents = relationship("Incident", back_populates="reported_by_user")
    trainings = relationship("Training", back_populates="assigned_users")
    personnel = relationship("Personnel", back_populates="user")

class UserSession(Base):
    """User session management"""
    __tablename__ = "user_sessions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey('users.id'), nullable=False)
    token_hash = Column(String(255), nullable=False)
    refresh_token_hash = Column(String(255))
    expires_at = Column(DateTime, nullable=False)
    is_active = Column(Boolean, default=True)
    ip_address = Column(String(45))
    user_agent = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="sessions")

class OTPCode(Base):
    """One-time password codes for authentication"""
    __tablename__ = "otp_codes"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey('users.id'), nullable=False)
    phone = Column(String(20), nullable=False)
    email = Column(String(255))
    code = Column(String(6), nullable=False)
    type = Column(String(20), nullable=False)  # 'email', 'sms', 'login', 'password_reset'
    expires_at = Column(DateTime, nullable=False)
    is_used = Column(Boolean, default=False)
    attempts = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="otp_codes")

class AuditLog(Base):
    """System audit logging"""
    __tablename__ = "audit_logs"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey('users.id'))
    tenant_id = Column(String, ForeignKey('tenants.id'))
    action = Column(String(100), nullable=False)
    resource_type = Column(String(50))  # 'document', 'user', 'training', etc.
    resource_id = Column(String)
    details = Column(JSON, default=dict)
    ip_address = Column(String(45))
    user_agent = Column(Text)
    session_id = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="audit_logs")
    tenant = relationship("Tenant")

# Indexes for performance
Index('idx_users_email', User.email)
Index('idx_users_username', User.username)
Index('idx_users_tenant_id', User.tenant_id)
Index('idx_users_phone', User.phone)
Index('idx_sessions_user_id', UserSession.user_id)
Index('idx_sessions_token_hash', UserSession.token_hash)
Index('idx_sessions_expires_at', UserSession.expires_at)
Index('idx_otp_phone', OTPCode.phone)
Index('idx_otp_code', OTPCode.code)
Index('idx_otp_expires_at', OTPCode.expires_at)
Index('idx_audit_user_id', AuditLog.user_id)
Index('idx_audit_tenant_id', AuditLog.tenant_id)
Index('idx_audit_action', AuditLog.action)
Index('idx_audit_created_at', AuditLog.created_at)
