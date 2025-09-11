"""
Analytics and Reporting Schema
Contains all models related to analytics, metrics, and reporting
"""

from sqlalchemy import Column, String, Integer, DateTime, Boolean, Text, JSON, ForeignKey, Index, Float, BigInteger
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

Base = declarative_base()

class MetricDefinition(Base):
    """Defines available metrics and their properties"""
    __tablename__ = "metric_definitions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(255), nullable=False)
    description = Column(Text)
    metric_type = Column(String(50), nullable=False)  # counter, gauge, histogram, summary
    unit = Column(String(20))
    category = Column(String(50))  # performance, business, security, compliance
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    metrics = relationship("Metric", back_populates="definition")

class Metric(Base):
    """Time-series metrics data"""
    __tablename__ = "metrics"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    metric_definition_id = Column(String, ForeignKey('metric_definitions.id'), nullable=False)
    tenant_id = Column(String, ForeignKey('tenants.id'))
    value = Column(Float, nullable=False)
    labels = Column(JSON, default=dict)  # Additional labels for filtering
    timestamp = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    definition = relationship("MetricDefinition", back_populates="metrics")
    tenant = relationship("Tenant")

class Dashboard(Base):
    """User-defined dashboards"""
    __tablename__ = "dashboards"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    description = Column(Text)
    tenant_id = Column(String, ForeignKey('tenants.id'), nullable=False)
    created_by = Column(String, ForeignKey('users.id'), nullable=False)
    is_public = Column(Boolean, default=False)
    is_default = Column(Boolean, default=False)
    layout = Column(JSON, default=dict)  # Dashboard layout configuration
    filters = Column(JSON, default=dict)  # Default filters
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant")
    created_by_user = relationship("User")
    widgets = relationship("DashboardWidget", back_populates="dashboard", cascade="all, delete-orphan")

class DashboardWidget(Base):
    """Dashboard widgets configuration"""
    __tablename__ = "dashboard_widgets"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    dashboard_id = Column(String, ForeignKey('dashboards.id'), nullable=False)
    widget_type = Column(String(50), nullable=False)  # chart, metric, table, text
    title = Column(String(255), nullable=False)
    position_x = Column(Integer, default=0)
    position_y = Column(Integer, default=0)
    width = Column(Integer, default=4)
    height = Column(Integer, default=3)
    configuration = Column(JSON, default=dict)  # Widget-specific configuration
    query = Column(JSON, default=dict)  # Data query configuration
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    dashboard = relationship("Dashboard", back_populates="widgets")

class Report(Base):
    """Generated reports and their metadata"""
    __tablename__ = "reports"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    description = Column(Text)
    report_type = Column(String(50), nullable=False)  # compliance, performance, security, custom
    tenant_id = Column(String, ForeignKey('tenants.id'), nullable=False)
    created_by = Column(String, ForeignKey('users.id'), nullable=False)
    status = Column(String(20), default='pending')  # pending, generating, completed, failed
    format = Column(String(20), default='pdf')  # pdf, excel, csv, json
    file_path = Column(String(500))
    file_size = Column(BigInteger)
    parameters = Column(JSON, default=dict)  # Report parameters
    generated_at = Column(DateTime)
    expires_at = Column(DateTime)
    download_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant")
    created_by_user = relationship("User")

class AlertRule(Base):
    """Alert rules and thresholds"""
    __tablename__ = "alert_rules"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    description = Column(Text)
    tenant_id = Column(String, ForeignKey('tenants.id'), nullable=False)
    metric_name = Column(String(100), nullable=False)
    condition = Column(String(20), nullable=False)  # gt, lt, eq, ne, gte, lte
    threshold_value = Column(Float, nullable=False)
    time_window = Column(Integer, default=300)  # Time window in seconds
    severity = Column(String(20), default='medium')  # low, medium, high, critical
    is_active = Column(Boolean, default=True)
    created_by = Column(String, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant")
    created_by_user = relationship("User")
    alerts = relationship("Alert", back_populates="rule", cascade="all, delete-orphan")

class Alert(Base):
    """Alert instances"""
    __tablename__ = "alerts"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    rule_id = Column(String, ForeignKey('alert_rules.id'), nullable=False)
    tenant_id = Column(String, ForeignKey('tenants.id'), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(String(20), nullable=False)
    status = Column(String(20), default='active')  # active, acknowledged, resolved
    acknowledged_by = Column(String, ForeignKey('users.id'))
    acknowledged_at = Column(DateTime)
    resolved_at = Column(DateTime)
    metadata = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    rule = relationship("AlertRule", back_populates="alerts")
    tenant = relationship("Tenant")
    acknowledged_by_user = relationship("User")

class UserActivity(Base):
    """User activity tracking"""
    __tablename__ = "user_activities"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey('users.id'), nullable=False)
    tenant_id = Column(String, ForeignKey('tenants.id'), nullable=False)
    action = Column(String(100), nullable=False)
    resource_type = Column(String(50))  # document, user, training, etc.
    resource_id = Column(String)
    details = Column(JSON, default=dict)
    ip_address = Column(String(45))
    user_agent = Column(Text)
    session_id = Column(String)
    duration = Column(Integer)  # Activity duration in seconds
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User")
    tenant = relationship("Tenant")

class SystemHealth(Base):
    """System health monitoring"""
    __tablename__ = "system_health"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    service_name = Column(String(100), nullable=False)
    status = Column(String(20), nullable=False)  # healthy, degraded, down
    response_time = Column(Float)  # Response time in milliseconds
    cpu_usage = Column(Float)
    memory_usage = Column(Float)
    disk_usage = Column(Float)
    error_count = Column(Integer, default=0)
    last_check = Column(DateTime, default=datetime.utcnow)
    metadata = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    service = relationship("Service")

class Service(Base):
    """Service registry and monitoring"""
    __tablename__ = "services"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(255), nullable=False)
    description = Column(Text)
    version = Column(String(20))
    status = Column(String(20), default='unknown')  # active, inactive, maintenance
    endpoint = Column(String(500))
    health_check_url = Column(String(500))
    is_monitored = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    health_checks = relationship("SystemHealth", back_populates="service")

# Indexes for performance
Index('idx_metrics_definition_id', Metric.metric_definition_id)
Index('idx_metrics_tenant_id', Metric.tenant_id)
Index('idx_metrics_timestamp', Metric.timestamp)
Index('idx_dashboards_tenant_id', Dashboard.tenant_id)
Index('idx_dashboards_created_by', Dashboard.created_by)
Index('idx_dashboard_widgets_dashboard_id', DashboardWidget.dashboard_id)
Index('idx_reports_tenant_id', Report.tenant_id)
Index('idx_reports_created_by', Report.created_by)
Index('idx_reports_status', Report.status)
Index('idx_reports_generated_at', Report.generated_at)
Index('idx_alert_rules_tenant_id', AlertRule.tenant_id)
Index('idx_alert_rules_metric_name', AlertRule.metric_name)
Index('idx_alert_rules_is_active', AlertRule.is_active)
Index('idx_alerts_rule_id', Alert.rule_id)
Index('idx_alerts_tenant_id', Alert.tenant_id)
Index('idx_alerts_status', Alert.status)
Index('idx_alerts_created_at', Alert.created_at)
Index('idx_user_activities_user_id', UserActivity.user_id)
Index('idx_user_activities_tenant_id', UserActivity.tenant_id)
Index('idx_user_activities_action', UserActivity.action)
Index('idx_user_activities_created_at', UserActivity.created_at)
Index('idx_system_health_service_name', SystemHealth.service_name)
Index('idx_system_health_last_check', SystemHealth.last_check)
Index('idx_services_name', Service.name)
Index('idx_services_status', Service.status)
