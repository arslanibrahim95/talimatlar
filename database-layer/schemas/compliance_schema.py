"""
Compliance and Safety Management Schema
Contains all models related to compliance tracking, safety protocols, and regulatory requirements
"""

from sqlalchemy import Column, String, Integer, DateTime, Boolean, Text, JSON, ForeignKey, Index, Enum, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

Base = declarative_base()

class ComplianceStatus(enum.Enum):
    COMPLIANT = "compliant"
    NON_COMPLIANT = "non_compliant"
    PENDING = "pending"
    EXPIRED = "expired"
    UNDER_REVIEW = "under_review"

class RiskLevel(enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class ComplianceStandard(Base):
    """Compliance standards and regulations"""
    __tablename__ = "compliance_standards"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, nullable=False)  # e.g., ISO45001, OHSAS18001
    description = Column(Text)
    version = Column(String(20))
    effective_date = Column(DateTime)
    expiry_date = Column(DateTime)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    requirements = relationship("ComplianceRequirement", back_populates="standard", cascade="all, delete-orphan")
    assessments = relationship("ComplianceAssessment", back_populates="standard")

class ComplianceRequirement(Base):
    """Individual compliance requirements within a standard"""
    __tablename__ = "compliance_requirements"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    standard_id = Column(String, ForeignKey('compliance_standards.id'), nullable=False)
    requirement_code = Column(String(50), nullable=False)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(100))  # Safety, Health, Environment, etc.
    priority = Column(Enum(RiskLevel), default=RiskLevel.MEDIUM)
    is_mandatory = Column(Boolean, default=True)
    evidence_required = Column(JSON, default=list)  # Types of evidence needed
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    standard = relationship("ComplianceStandard", back_populates="requirements")
    assessments = relationship("ComplianceAssessment", back_populates="requirement")

class ComplianceAssessment(Base):
    """Compliance assessments and evaluations"""
    __tablename__ = "compliance_assessments"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey('tenants.id'), nullable=False)
    standard_id = Column(String, ForeignKey('compliance_standards.id'), nullable=False)
    requirement_id = Column(String, ForeignKey('compliance_requirements.id'), nullable=False)
    assessor_id = Column(String, ForeignKey('users.id'), nullable=False)
    status = Column(Enum(ComplianceStatus), default=ComplianceStatus.PENDING)
    score = Column(Float)  # 0-100 compliance score
    findings = Column(Text)
    recommendations = Column(Text)
    evidence_documents = Column(JSON, default=list)  # Document IDs as evidence
    assessment_date = Column(DateTime, default=datetime.utcnow)
    next_assessment_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant")
    standard = relationship("ComplianceStandard", back_populates="assessments")
    requirement = relationship("ComplianceRequirement", back_populates="assessments")
    assessor = relationship("User")

class SafetyProtocol(Base):
    """Safety protocols and procedures"""
    __tablename__ = "safety_protocols"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey('tenants.id'), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    category = Column(String(100))  # Emergency, PPE, Equipment, etc.
    risk_level = Column(Enum(RiskLevel), default=RiskLevel.MEDIUM)
    procedure_steps = Column(JSON, default=list)  # Step-by-step procedure
    required_equipment = Column(JSON, default=list)
    required_training = Column(JSON, default=list)
    is_active = Column(Boolean, default=True)
    created_by = Column(String, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant")
    created_by_user = relationship("User")
    incidents = relationship("Incident", back_populates="safety_protocol")

class Incident(Base):
    """Safety incidents and accidents"""
    __tablename__ = "incidents"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey('tenants.id'), nullable=False)
    incident_number = Column(String(50), unique=True, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    incident_type = Column(String(100), nullable=False)  # Accident, Near Miss, Hazard, etc.
    severity = Column(Enum(RiskLevel), nullable=False)
    status = Column(String(50), default='reported')  # reported, investigating, resolved, closed
    location = Column(String(255))
    reported_by = Column(String, ForeignKey('users.id'), nullable=False)
    assigned_to = Column(String, ForeignKey('users.id'))
    safety_protocol_id = Column(String, ForeignKey('safety_protocols.id'))
    incident_date = Column(DateTime, nullable=False)
    reported_date = Column(DateTime, default=datetime.utcnow)
    resolved_date = Column(DateTime)
    root_cause = Column(Text)
    corrective_actions = Column(Text)
    preventive_measures = Column(Text)
    witnesses = Column(JSON, default=list)
    evidence_documents = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="incidents")
    reported_by_user = relationship("User", foreign_keys=[reported_by])
    assigned_to_user = relationship("User", foreign_keys=[assigned_to])
    safety_protocol = relationship("SafetyProtocol", back_populates="incidents")

class SafetyInspection(Base):
    """Safety inspections and audits"""
    __tablename__ = "safety_inspections"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey('tenants.id'), nullable=False)
    inspection_name = Column(String(255), nullable=False)
    inspection_type = Column(String(100), nullable=False)  # Routine, Special, Emergency
    location = Column(String(255))
    inspector_id = Column(String, ForeignKey('users.id'), nullable=False)
    status = Column(String(50), default='scheduled')  # scheduled, in_progress, completed, cancelled
    scheduled_date = Column(DateTime, nullable=False)
    completed_date = Column(DateTime)
    findings = Column(JSON, default=list)  # Inspection findings
    recommendations = Column(Text)
    corrective_actions = Column(Text)
    photos = Column(JSON, default=list)  # Photo URLs
    documents = Column(JSON, default=list)  # Document IDs
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant")
    inspector = relationship("User")

class CorrectiveAction(Base):
    """Corrective actions for incidents and inspections"""
    __tablename__ = "corrective_actions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey('tenants.id'), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    source_type = Column(String(50), nullable=False)  # incident, inspection, audit
    source_id = Column(String, nullable=False)  # ID of the source
    assigned_to = Column(String, ForeignKey('users.id'), nullable=False)
    priority = Column(Enum(RiskLevel), default=RiskLevel.MEDIUM)
    status = Column(String(50), default='open')  # open, in_progress, completed, cancelled
    due_date = Column(DateTime)
    completed_date = Column(DateTime)
    completion_notes = Column(Text)
    verification_required = Column(Boolean, default=True)
    verified_by = Column(String, ForeignKey('users.id'))
    verified_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant")
    assigned_to_user = relationship("User", foreign_keys=[assigned_to])
    verified_by_user = relationship("User", foreign_keys=[verified_by])

class ComplianceReport(Base):
    """Compliance reports and documentation"""
    __tablename__ = "compliance_reports"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey('tenants.id'), nullable=False)
    report_name = Column(String(255), nullable=False)
    report_type = Column(String(100), nullable=False)  # Monthly, Quarterly, Annual, Ad-hoc
    standard_id = Column(String, ForeignKey('compliance_standards.id'))
    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)
    generated_by = Column(String, ForeignKey('users.id'), nullable=False)
    status = Column(String(50), default='draft')  # draft, review, approved, published
    content = Column(JSON, default=dict)  # Report content and data
    file_path = Column(String(500))
    file_size = Column(Integer)
    approved_by = Column(String, ForeignKey('users.id'))
    approved_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant")
    standard = relationship("ComplianceStandard")
    generated_by_user = relationship("User", foreign_keys=[generated_by])
    approved_by_user = relationship("User", foreign_keys=[approved_by])

# Indexes for performance
Index('idx_compliance_standards_code', ComplianceStandard.code)
Index('idx_compliance_standards_is_active', ComplianceStandard.is_active)
Index('idx_compliance_requirements_standard_id', ComplianceRequirement.standard_id)
Index('idx_compliance_requirements_category', ComplianceRequirement.category)
Index('idx_compliance_assessments_tenant_id', ComplianceAssessment.tenant_id)
Index('idx_compliance_assessments_standard_id', ComplianceAssessment.standard_id)
Index('idx_compliance_assessments_status', ComplianceAssessment.status)
Index('idx_compliance_assessments_assessment_date', ComplianceAssessment.assessment_date)
Index('idx_safety_protocols_tenant_id', SafetyProtocol.tenant_id)
Index('idx_safety_protocols_category', SafetyProtocol.category)
Index('idx_safety_protocols_risk_level', SafetyProtocol.risk_level)
Index('idx_incidents_tenant_id', Incident.tenant_id)
Index('idx_incidents_incident_number', Incident.incident_number)
Index('idx_incidents_reported_by', Incident.reported_by)
Index('idx_incidents_severity', Incident.severity)
Index('idx_incidents_status', Incident.status)
Index('idx_incidents_incident_date', Incident.incident_date)
Index('idx_safety_inspections_tenant_id', SafetyInspection.tenant_id)
Index('idx_safety_inspections_inspector_id', SafetyInspection.inspector_id)
Index('idx_safety_inspections_status', SafetyInspection.status)
Index('idx_safety_inspections_scheduled_date', SafetyInspection.scheduled_date)
Index('idx_corrective_actions_tenant_id', CorrectiveAction.tenant_id)
Index('idx_corrective_actions_assigned_to', CorrectiveAction.assigned_to)
Index('idx_corrective_actions_status', CorrectiveAction.status)
Index('idx_corrective_actions_due_date', CorrectiveAction.due_date)
Index('idx_compliance_reports_tenant_id', ComplianceReport.tenant_id)
Index('idx_compliance_reports_standard_id', ComplianceReport.standard_id)
Index('idx_compliance_reports_status', ComplianceReport.status)
Index('idx_compliance_reports_period_start', ComplianceReport.period_start)
Index('idx_compliance_reports_period_end', ComplianceReport.period_end)
