"""
Risk Management Schema
Contains all models related to risk assessment, mitigation, and monitoring
"""

from sqlalchemy import Column, String, Integer, DateTime, Boolean, Text, JSON, ForeignKey, Index, Enum, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

Base = declarative_base()

class RiskLevel(enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class RiskStatus(enum.Enum):
    IDENTIFIED = "identified"
    ASSESSED = "assessed"
    MITIGATED = "mitigated"
    ACCEPTED = "accepted"
    CLOSED = "closed"

class RiskCategory(enum.Enum):
    SAFETY = "safety"
    FINANCIAL = "financial"
    OPERATIONAL = "operational"
    COMPLIANCE = "compliance"
    TECHNICAL = "technical"
    ENVIRONMENTAL = "environmental"

class Risk(Base):
    """Risk identification and management"""
    __tablename__ = "risks"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey('tenants.id'), nullable=False)
    risk_number = Column(String(50), unique=True, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(Enum(RiskCategory), nullable=False)
    identified_by = Column(String, ForeignKey('users.id'), nullable=False)
    assigned_to = Column(String, ForeignKey('users.id'))
    status = Column(Enum(RiskStatus), default=RiskStatus.IDENTIFIED)
    probability = Column(Float, nullable=False)  # 0-1 scale
    impact = Column(Float, nullable=False)  # 0-1 scale
    risk_score = Column(Float, nullable=False)  # probability * impact
    risk_level = Column(Enum(RiskLevel), nullable=False)
    identified_date = Column(DateTime, default=datetime.utcnow)
    due_date = Column(DateTime)
    closed_date = Column(DateTime)
    mitigation_plan = Column(Text)
    contingency_plan = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant")
    identified_by_user = relationship("User", foreign_keys=[identified_by])
    assigned_to_user = relationship("User", foreign_keys=[assigned_to])
    assessments = relationship("RiskAssessment", back_populates="risk", cascade="all, delete-orphan")
    mitigations = relationship("RiskMitigation", back_populates="risk", cascade="all, delete-orphan")

class RiskAssessment(Base):
    """Risk assessment and evaluation"""
    __tablename__ = "risk_assessments"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    risk_id = Column(String, ForeignKey('risks.id'), nullable=False)
    assessor_id = Column(String, ForeignKey('users.id'), nullable=False)
    assessment_date = Column(DateTime, default=datetime.utcnow)
    probability = Column(Float, nullable=False)
    impact = Column(Float, nullable=False)
    risk_score = Column(Float, nullable=False)
    risk_level = Column(Enum(RiskLevel), nullable=False)
    assessment_method = Column(String(100))
    findings = Column(Text)
    recommendations = Column(Text)
    next_assessment_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    risk = relationship("Risk", back_populates="assessments")
    assessor = relationship("User")

class RiskMitigation(Base):
    """Risk mitigation actions and controls"""
    __tablename__ = "risk_mitigations"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    risk_id = Column(String, ForeignKey('risks.id'), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    mitigation_type = Column(String(50), nullable=False)  # prevent, reduce, transfer, accept
    assigned_to = Column(String, ForeignKey('users.id'), nullable=False)
    status = Column(String(50), default='planned')  # planned, in_progress, completed, cancelled
    priority = Column(Enum(RiskLevel), default=RiskLevel.MEDIUM)
    due_date = Column(DateTime)
    completed_date = Column(DateTime)
    effectiveness = Column(Float)  # 0-1 scale
    cost = Column(Integer)  # Mitigation cost in cents
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    risk = relationship("Risk", back_populates="mitigations")
    assigned_to_user = relationship("User")

# Indexes for performance
Index('idx_risks_tenant_id', Risk.tenant_id)
Index('idx_risks_risk_number', Risk.risk_number)
Index('idx_risks_identified_by', Risk.identified_by)
Index('idx_risks_assigned_to', Risk.assigned_to)
Index('idx_risks_status', Risk.status)
Index('idx_risks_category', Risk.category)
Index('idx_risks_risk_level', Risk.risk_level)
Index('idx_risks_identified_date', Risk.identified_date)
Index('idx_risk_assessments_risk_id', RiskAssessment.risk_id)
Index('idx_risk_assessments_assessor_id', RiskAssessment.assessor_id)
Index('idx_risk_assessments_assessment_date', RiskAssessment.assessment_date)
Index('idx_risk_mitigations_risk_id', RiskMitigation.risk_id)
Index('idx_risk_mitigations_assigned_to', RiskMitigation.assigned_to)
Index('idx_risk_mitigations_status', RiskMitigation.status)
Index('idx_risk_mitigations_due_date', RiskMitigation.due_date)
