"""
QR Code Management Schema
Contains all models related to QR code generation, scanning, and tracking
"""

from sqlalchemy import Column, String, Integer, DateTime, Boolean, Text, JSON, ForeignKey, Index, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

Base = declarative_base()

class QRCodeType(enum.Enum):
    DOCUMENT = "document"
    EQUIPMENT = "equipment"
    LOCATION = "location"
    PERSONNEL = "personnel"
    SAFETY_CHECK = "safety_check"
    MAINTENANCE = "maintenance"
    TRAINING = "training"
    INCIDENT = "incident"

class QRCodeStatus(enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    EXPIRED = "expired"
    REVOKED = "revoked"

class QRCode(Base):
    """QR code generation and management"""
    __tablename__ = "qr_codes"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey('tenants.id'), nullable=False)
    qr_code = Column(String(500), unique=True, nullable=False)  # The actual QR code data
    qr_type = Column(Enum(QRCodeType), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    resource_type = Column(String(50))  # Type of resource (document, equipment, etc.)
    resource_id = Column(String)  # ID of the linked resource
    url = Column(String(500))  # URL to redirect to when scanned
    metadata = Column(JSON, default=dict)  # Additional metadata
    status = Column(Enum(QRCodeStatus), default=QRCodeStatus.ACTIVE)
    expires_at = Column(DateTime)
    scan_limit = Column(Integer)  # Maximum number of scans allowed
    current_scans = Column(Integer, default=0)
    is_public = Column(Boolean, default=False)
    created_by = Column(String, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant")
    created_by_user = relationship("User")
    scans = relationship("QRCodeScan", back_populates="qr_code", cascade="all, delete-orphan")

class QRCodeScan(Base):
    """QR code scan tracking and analytics"""
    __tablename__ = "qr_code_scans"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    qr_code_id = Column(String, ForeignKey('qr_codes.id'), nullable=False)
    scanned_by = Column(String, ForeignKey('users.id'))
    scan_timestamp = Column(DateTime, default=datetime.utcnow)
    ip_address = Column(String(45))
    user_agent = Column(Text)
    location = Column(String(255))  # Physical location if available
    latitude = Column(String(20))
    longitude = Column(String(20))
    device_type = Column(String(50))  # mobile, tablet, desktop
    browser = Column(String(50))
    os = Column(String(50))
    referrer = Column(String(500))
    session_id = Column(String)
    metadata = Column(JSON, default=dict)
    
    # Relationships
    qr_code = relationship("QRCode", back_populates="scans")
    scanned_by_user = relationship("User")

class QRCodeTemplate(Base):
    """QR code templates for different use cases"""
    __tablename__ = "qr_code_templates"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey('tenants.id'), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    qr_type = Column(Enum(QRCodeType), nullable=False)
    template_config = Column(JSON, default=dict)  # Template configuration
    default_metadata = Column(JSON, default=dict)
    is_active = Column(Boolean, default=True)
    created_by = Column(String, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant")
    created_by_user = relationship("User")

class QRCodeBatch(Base):
    """Batch generation of QR codes"""
    __tablename__ = "qr_code_batches"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey('tenants.id'), nullable=False)
    batch_name = Column(String(255), nullable=False)
    description = Column(Text)
    qr_type = Column(Enum(QRCodeType), nullable=False)
    template_id = Column(String, ForeignKey('qr_code_templates.id'))
    total_codes = Column(Integer, nullable=False)
    generated_codes = Column(Integer, default=0)
    status = Column(String(50), default='pending')  # pending, generating, completed, failed
    generation_started = Column(DateTime)
    generation_completed = Column(DateTime)
    created_by = Column(String, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant")
    template = relationship("QRCodeTemplate")
    created_by_user = relationship("User")

# Indexes for performance
Index('idx_qr_codes_tenant_id', QRCode.tenant_id)
Index('idx_qr_codes_qr_code', QRCode.qr_code)
Index('idx_qr_codes_qr_type', QRCode.qr_type)
Index('idx_qr_codes_resource_type', QRCode.resource_type)
Index('idx_qr_codes_resource_id', QRCode.resource_id)
Index('idx_qr_codes_status', QRCode.status)
Index('idx_qr_codes_created_by', QRCode.created_by)
Index('idx_qr_codes_expires_at', QRCode.expires_at)
Index('idx_qr_code_scans_qr_code_id', QRCodeScan.qr_code_id)
Index('idx_qr_code_scans_scanned_by', QRCodeScan.scanned_by)
Index('idx_qr_code_scans_scan_timestamp', QRCodeScan.scan_timestamp)
Index('idx_qr_code_scans_device_type', QRCodeScan.device_type)
Index('idx_qr_code_templates_tenant_id', QRCodeTemplate.tenant_id)
Index('idx_qr_code_templates_qr_type', QRCodeTemplate.qr_type)
Index('idx_qr_code_templates_is_active', QRCodeTemplate.is_active)
Index('idx_qr_code_batches_tenant_id', QRCodeBatch.tenant_id)
Index('idx_qr_code_batches_qr_type', QRCodeBatch.qr_type)
Index('idx_qr_code_batches_status', QRCodeBatch.status)
Index('idx_qr_code_batches_created_by', QRCodeBatch.created_by)
