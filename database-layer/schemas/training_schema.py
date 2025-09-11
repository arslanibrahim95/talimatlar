"""
Training Management Schema
Contains all models related to training programs, courses, and certifications
"""

from sqlalchemy import Column, String, Integer, DateTime, Boolean, Text, JSON, ForeignKey, Index, Enum, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

Base = declarative_base()

class TrainingStatus(enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"
    CANCELLED = "cancelled"

class TrainingType(enum.Enum):
    ONLINE = "online"
    CLASSROOM = "classroom"
    WORKSHOP = "workshop"
    SEMINAR = "seminar"
    WEBINAR = "webinar"
    ON_THE_JOB = "on_the_job"

class Training(Base):
    """Training courses and programs"""
    __tablename__ = "trainings"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey('tenants.id'), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    training_type = Column(Enum(TrainingType), nullable=False)
    category = Column(String(100))  # Safety, Technical, Soft Skills, etc.
    duration_hours = Column(Float, nullable=False)
    max_participants = Column(Integer)
    status = Column(Enum(TrainingStatus), default=TrainingStatus.DRAFT)
    is_mandatory = Column(Boolean, default=False)
    is_certified = Column(Boolean, default=False)
    prerequisites = Column(JSON, default=list)
    learning_objectives = Column(JSON, default=list)
    content = Column(JSON, default=dict)  # Training content structure
    materials = Column(JSON, default=list)  # Training materials URLs
    instructor_id = Column(String, ForeignKey('users.id'))
    created_by = Column(String, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="trainings")
    instructor = relationship("User", foreign_keys=[instructor_id])
    created_by_user = relationship("User", foreign_keys=[created_by])
    training_records = relationship("TrainingRecord", back_populates="training", cascade="all, delete-orphan")
    sessions = relationship("TrainingSession", back_populates="training", cascade="all, delete-orphan")

class TrainingSession(Base):
    """Training sessions and schedules"""
    __tablename__ = "training_sessions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    training_id = Column(String, ForeignKey('trainings.id'), nullable=False)
    session_name = Column(String(255), nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    location = Column(String(255))
    instructor_id = Column(String, ForeignKey('users.id'))
    max_participants = Column(Integer)
    current_participants = Column(Integer, default=0)
    status = Column(String(50), default='scheduled')  # scheduled, in_progress, completed, cancelled
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    training = relationship("Training", back_populates="sessions")
    instructor = relationship("User")

class TrainingRecord(Base):
    """Individual training completion records"""
    __tablename__ = "training_records"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    training_id = Column(String, ForeignKey('trainings.id'), nullable=False)
    personnel_id = Column(String, ForeignKey('personnel.id'), nullable=False)
    session_id = Column(String, ForeignKey('training_sessions.id'))
    status = Column(String(50), default='assigned')  # assigned, in_progress, completed, failed
    assigned_date = Column(DateTime, default=datetime.utcnow)
    started_date = Column(DateTime)
    completed_date = Column(DateTime)
    score = Column(Float)  # Training completion score
    max_score = Column(Float, default=100)
    pass_threshold = Column(Float, default=70)
    passed = Column(Boolean)
    certificate_url = Column(String(500))
    certificate_issued_date = Column(DateTime)
    certificate_expiry_date = Column(DateTime)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    training = relationship("Training", back_populates="training_records")
    personnel = relationship("Personnel", back_populates="training_records")
    session = relationship("TrainingSession")

class TrainingCategory(Base):
    """Training categories and classifications"""
    __tablename__ = "training_categories"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    description = Column(Text)
    parent_id = Column(String, ForeignKey('training_categories.id'))
    tenant_id = Column(String, ForeignKey('tenants.id'), nullable=False)
    color = Column(String(7))  # Hex color code
    icon = Column(String(50))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    parent = relationship("TrainingCategory", remote_side=[id])
    children = relationship("TrainingCategory", back_populates="parent")
    tenant = relationship("Tenant")

class Certification(Base):
    """Professional certifications and credentials"""
    __tablename__ = "certifications"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    issuing_organization = Column(String(255), nullable=False)
    description = Column(Text)
    validity_period_months = Column(Integer)  # Validity period in months
    requirements = Column(JSON, default=list)  # Certification requirements
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    personnel_certifications = relationship("PersonnelCertification", back_populates="certification", cascade="all, delete-orphan")

class PersonnelCertification(Base):
    """Personnel certification records"""
    __tablename__ = "personnel_certifications"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    personnel_id = Column(String, ForeignKey('personnel.id'), nullable=False)
    certification_id = Column(String, ForeignKey('certifications.id'), nullable=False)
    certificate_number = Column(String(100))
    issued_date = Column(DateTime, nullable=False)
    expiry_date = Column(DateTime)
    issuing_organization = Column(String(255))
    certificate_url = Column(String(500))
    is_valid = Column(Boolean, default=True)
    renewal_required = Column(Boolean, default=False)
    renewal_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    personnel = relationship("Personnel")
    certification = relationship("Certification", back_populates="personnel_certifications")

# Indexes for performance
Index('idx_trainings_tenant_id', Training.tenant_id)
Index('idx_trainings_category', Training.category)
Index('idx_trainings_status', Training.status)
Index('idx_trainings_training_type', Training.training_type)
Index('idx_trainings_instructor_id', Training.instructor_id)
Index('idx_training_sessions_training_id', TrainingSession.training_id)
Index('idx_training_sessions_instructor_id', TrainingSession.instructor_id)
Index('idx_training_sessions_start_date', TrainingSession.start_date)
Index('idx_training_sessions_status', TrainingSession.status)
Index('idx_training_records_training_id', TrainingRecord.training_id)
Index('idx_training_records_personnel_id', TrainingRecord.personnel_id)
Index('idx_training_records_session_id', TrainingRecord.session_id)
Index('idx_training_records_status', TrainingRecord.status)
Index('idx_training_records_completed_date', TrainingRecord.completed_date)
Index('idx_training_categories_tenant_id', TrainingCategory.tenant_id)
Index('idx_training_categories_parent_id', TrainingCategory.parent_id)
Index('idx_certifications_name', Certification.name)
Index('idx_certifications_issuing_organization', Certification.issuing_organization)
Index('idx_personnel_certifications_personnel_id', PersonnelCertification.personnel_id)
Index('idx_personnel_certifications_certification_id', PersonnelCertification.certification_id)
Index('idx_personnel_certifications_expiry_date', PersonnelCertification.expiry_date)
Index('idx_personnel_certifications_is_valid', PersonnelCertification.is_valid)
