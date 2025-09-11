"""
Incident Management Schema
Contains all models related to incident reporting, investigation, and management
"""

from sqlalchemy import Column, String, Integer, DateTime, Boolean, Text, JSON, ForeignKey, Index, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

Base = declarative_base()

class IncidentStatus(enum.Enum):
    REPORTED = "reported"
    INVESTIGATING = "investigating"
    RESOLVED = "resolved"
    CLOSED = "closed"
    CANCELLED = "cancelled"

class IncidentSeverity(enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class IncidentType(enum.Enum):
    ACCIDENT = "accident"
    NEAR_MISS = "near_miss"
    HAZARD = "hazard"
    INJURY = "injury"
    PROPERTY_DAMAGE = "property_damage"
    ENVIRONMENTAL = "environmental"
    SECURITY = "security"

class Incident(Base):
    """Incident reporting and management"""
    __tablename__ = "incidents"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey('tenants.id'), nullable=False)
    incident_number = Column(String(50), unique=True, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    incident_type = Column(Enum(IncidentType), nullable=False)
    severity = Column(Enum(IncidentSeverity), nullable=False)
    status = Column(Enum(IncidentStatus), default=IncidentStatus.REPORTED)
    location = Column(String(255))
    reported_by = Column(String, ForeignKey('users.id'), nullable=False)
    assigned_to = Column(String, ForeignKey('users.id'))
    incident_date = Column(DateTime, nullable=False)
    reported_date = Column(DateTime, default=datetime.utcnow)
    resolved_date = Column(DateTime)
    root_cause = Column(Text)
    corrective_actions = Column(Text)
    preventive_measures = Column(Text)
    witnesses = Column(JSON, default=list)
    evidence_documents = Column(JSON, default=list)
    photos = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="incidents")
    reported_by_user = relationship("User", foreign_keys=[reported_by])
    assigned_to_user = relationship("User", foreign_keys=[assigned_to])
    investigations = relationship("IncidentInvestigation", back_populates="incident", cascade="all, delete-orphan")
    actions = relationship("IncidentAction", back_populates="incident", cascade="all, delete-orphan")

class IncidentInvestigation(Base):
    """Incident investigation details"""
    __tablename__ = "incident_investigations"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    incident_id = Column(String, ForeignKey('incidents.id'), nullable=False)
    investigator_id = Column(String, ForeignKey('users.id'), nullable=False)
    investigation_date = Column(DateTime, default=datetime.utcnow)
    findings = Column(Text)
    root_cause_analysis = Column(Text)
    contributing_factors = Column(JSON, default=list)
    immediate_causes = Column(JSON, default=list)
    underlying_causes = Column(JSON, default=list)
    recommendations = Column(Text)
    investigation_notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    incident = relationship("Incident", back_populates="investigations")
    investigator = relationship("User")

class IncidentAction(Base):
    """Corrective and preventive actions for incidents"""
    __tablename__ = "incident_actions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    incident_id = Column(String, ForeignKey('incidents.id'), nullable=False)
    action_type = Column(String(50), nullable=False)  # corrective, preventive
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    assigned_to = Column(String, ForeignKey('users.id'), nullable=False)
    due_date = Column(DateTime)
    completed_date = Column(DateTime)
    status = Column(String(50), default='open')  # open, in_progress, completed, cancelled
    priority = Column(Enum(IncidentSeverity), default=IncidentSeverity.MEDIUM)
    verification_required = Column(Boolean, default=True)
    verified_by = Column(String, ForeignKey('users.id'))
    verified_date = Column(DateTime)
    verification_notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    incident = relationship("Incident", back_populates="actions")
    assigned_to_user = relationship("User", foreign_keys=[assigned_to])
    verified_by_user = relationship("User", foreign_keys=[verified_by])

# Indexes for performance
Index('idx_incidents_tenant_id', Incident.tenant_id)
Index('idx_incidents_incident_number', Incident.incident_number)
Index('idx_incidents_reported_by', Incident.reported_by)
Index('idx_incidents_assigned_to', Incident.assigned_to)
Index('idx_incidents_incident_type', Incident.incident_type)
Index('idx_incidents_severity', Incident.severity)
Index('idx_incidents_status', Incident.status)
Index('idx_incidents_incident_date', Incident.incident_date)
Index('idx_incidents_reported_date', Incident.reported_date)
Index('idx_incident_investigations_incident_id', IncidentInvestigation.incident_id)
Index('idx_incident_investigations_investigator_id', IncidentInvestigation.investigator_id)
Index('idx_incident_investigations_investigation_date', IncidentInvestigation.investigation_date)
Index('idx_incident_actions_incident_id', IncidentAction.incident_id)
Index('idx_incident_actions_assigned_to', IncidentAction.assigned_to)
Index('idx_incident_actions_status', IncidentAction.status)
Index('idx_incident_actions_due_date', IncidentAction.due_date)
