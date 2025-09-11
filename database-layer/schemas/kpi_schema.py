"""
KPI and Performance Metrics Schema
Contains all models related to Key Performance Indicators and performance tracking
"""

from sqlalchemy import Column, String, Integer, DateTime, Boolean, Text, JSON, ForeignKey, Index, Enum, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

Base = declarative_base()

class KPIType(enum.Enum):
    SAFETY = "safety"
    COMPLIANCE = "compliance"
    PERFORMANCE = "performance"
    FINANCIAL = "financial"
    OPERATIONAL = "operational"
    QUALITY = "quality"

class KPIFrequency(enum.Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"

class KPI(Base):
    """Key Performance Indicators definition"""
    __tablename__ = "kpis"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey('tenants.id'), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    kpi_type = Column(Enum(KPIType), nullable=False)
    category = Column(String(100))
    unit = Column(String(50))  # percentage, count, hours, etc.
    target_value = Column(Float)
    minimum_value = Column(Float)
    maximum_value = Column(Float)
    frequency = Column(Enum(KPIFrequency), nullable=False)
    calculation_method = Column(Text)  # How the KPI is calculated
    data_source = Column(String(255))  # Where the data comes from
    is_active = Column(Boolean, default=True)
    created_by = Column(String, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant")
    created_by_user = relationship("User")
    measurements = relationship("KPIMeasurement", back_populates="kpi", cascade="all, delete-orphan")

class KPIMeasurement(Base):
    """KPI measurement values over time"""
    __tablename__ = "kpi_measurements"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    kpi_id = Column(String, ForeignKey('kpis.id'), nullable=False)
    value = Column(Float, nullable=False)
    measurement_date = Column(DateTime, nullable=False)
    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)
    notes = Column(Text)
    measured_by = Column(String, ForeignKey('users.id'))
    is_verified = Column(Boolean, default=False)
    verified_by = Column(String, ForeignKey('users.id'))
    verified_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    kpi = relationship("KPI", back_populates="measurements")
    measured_by_user = relationship("User", foreign_keys=[measured_by])
    verified_by_user = relationship("User", foreign_keys=[verified_by])

class KPIDashboard(Base):
    """KPI dashboards configuration"""
    __tablename__ = "kpi_dashboards"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey('tenants.id'), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    layout = Column(JSON, default=dict)  # Dashboard layout configuration
    is_public = Column(Boolean, default=False)
    is_default = Column(Boolean, default=False)
    created_by = Column(String, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant")
    created_by_user = relationship("User")
    widgets = relationship("KPIDashboardWidget", back_populates="dashboard", cascade="all, delete-orphan")

class KPIDashboardWidget(Base):
    """KPI dashboard widgets"""
    __tablename__ = "kpi_dashboard_widgets"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    dashboard_id = Column(String, ForeignKey('kpi_dashboards.id'), nullable=False)
    kpi_id = Column(String, ForeignKey('kpis.id'), nullable=False)
    widget_type = Column(String(50), nullable=False)  # chart, metric, table, gauge
    title = Column(String(255), nullable=False)
    position_x = Column(Integer, default=0)
    position_y = Column(Integer, default=0)
    width = Column(Integer, default=4)
    height = Column(Integer, default=3)
    configuration = Column(JSON, default=dict)  # Widget-specific configuration
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    dashboard = relationship("KPIDashboard", back_populates="widgets")
    kpi = relationship("KPI")

class KPIAlert(Base):
    """KPI alerts and thresholds"""
    __tablename__ = "kpi_alerts"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    kpi_id = Column(String, ForeignKey('kpis.id'), nullable=False)
    tenant_id = Column(String, ForeignKey('tenants.id'), nullable=False)
    alert_name = Column(String(255), nullable=False)
    condition = Column(String(20), nullable=False)  # gt, lt, eq, ne, gte, lte
    threshold_value = Column(Float, nullable=False)
    severity = Column(String(20), default='medium')  # low, medium, high, critical
    is_active = Column(Boolean, default=True)
    notification_enabled = Column(Boolean, default=True)
    created_by = Column(String, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    kpi = relationship("KPI")
    tenant = relationship("Tenant")
    created_by_user = relationship("User")
    alert_instances = relationship("KPIAlertInstance", back_populates="alert", cascade="all, delete-orphan")

class KPIAlertInstance(Base):
    """KPI alert instances"""
    __tablename__ = "kpi_alert_instances"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    alert_id = Column(String, ForeignKey('kpi_alerts.id'), nullable=False)
    kpi_measurement_id = Column(String, ForeignKey('kpi_measurements.id'), nullable=False)
    triggered_value = Column(Float, nullable=False)
    threshold_value = Column(Float, nullable=False)
    status = Column(String(20), default='active')  # active, acknowledged, resolved
    acknowledged_by = Column(String, ForeignKey('users.id'))
    acknowledged_date = Column(DateTime)
    resolved_date = Column(DateTime)
    message = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    alert = relationship("KPIAlert", back_populates="alert_instances")
    kpi_measurement = relationship("KPIMeasurement")
    acknowledged_by_user = relationship("User")

# Indexes for performance
Index('idx_kpis_tenant_id', KPI.tenant_id)
Index('idx_kpis_kpi_type', KPI.kpi_type)
Index('idx_kpis_category', KPI.category)
Index('idx_kpis_frequency', KPI.frequency)
Index('idx_kpis_is_active', KPI.is_active)
Index('idx_kpi_measurements_kpi_id', KPIMeasurement.kpi_id)
Index('idx_kpi_measurements_measurement_date', KPIMeasurement.measurement_date)
Index('idx_kpi_measurements_period_start', KPIMeasurement.period_start)
Index('idx_kpi_measurements_period_end', KPIMeasurement.period_end)
Index('idx_kpi_dashboards_tenant_id', KPIDashboard.tenant_id)
Index('idx_kpi_dashboards_created_by', KPIDashboard.created_by)
Index('idx_kpi_dashboard_widgets_dashboard_id', KPIDashboardWidget.dashboard_id)
Index('idx_kpi_dashboard_widgets_kpi_id', KPIDashboardWidget.kpi_id)
Index('idx_kpi_alerts_kpi_id', KPIAlert.kpi_id)
Index('idx_kpi_alerts_tenant_id', KPIAlert.tenant_id)
Index('idx_kpi_alerts_is_active', KPIAlert.is_active)
Index('idx_kpi_alert_instances_alert_id', KPIAlertInstance.alert_id)
Index('idx_kpi_alert_instances_kpi_measurement_id', KPIAlertInstance.kpi_measurement_id)
Index('idx_kpi_alert_instances_status', KPIAlertInstance.status)
Index('idx_kpi_alert_instances_created_at', KPIAlertInstance.created_at)
