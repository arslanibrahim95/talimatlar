"""
Notification and Communication Schema
Contains all models related to notifications, messaging, and communication
"""

from sqlalchemy import Column, String, Integer, DateTime, Boolean, Text, JSON, ForeignKey, Index, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

Base = declarative_base()

class NotificationType(enum.Enum):
    EMAIL = "email"
    SMS = "sms"
    PUSH = "push"
    IN_APP = "in_app"
    WEBHOOK = "webhook"

class NotificationStatus(enum.Enum):
    PENDING = "pending"
    SENT = "sent"
    DELIVERED = "delivered"
    FAILED = "failed"
    CANCELLED = "cancelled"

class NotificationPriority(enum.Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"

class NotificationTemplate(Base):
    """Notification templates for different types of messages"""
    __tablename__ = "notification_templates"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    description = Column(Text)
    notification_type = Column(Enum(NotificationType), nullable=False)
    subject_template = Column(Text)
    body_template = Column(Text, nullable=False)
    tenant_id = Column(String, ForeignKey('tenants.id'), nullable=False)
    is_active = Column(Boolean, default=True)
    variables = Column(JSON, default=list)  # Available template variables
    created_by = Column(String, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant")
    created_by_user = relationship("User")
    notifications = relationship("Notification", back_populates="template")

class Notification(Base):
    """Individual notification instances"""
    __tablename__ = "notifications"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    template_id = Column(String, ForeignKey('notification_templates.id'))
    tenant_id = Column(String, ForeignKey('tenants.id'), nullable=False)
    recipient_id = Column(String, ForeignKey('users.id'), nullable=False)
    notification_type = Column(Enum(NotificationType), nullable=False)
    priority = Column(Enum(NotificationPriority), default=NotificationPriority.NORMAL)
    subject = Column(String(500))
    message = Column(Text, nullable=False)
    status = Column(Enum(NotificationStatus), default=NotificationStatus.PENDING)
    scheduled_at = Column(DateTime, default=datetime.utcnow)
    sent_at = Column(DateTime)
    delivered_at = Column(DateTime)
    failed_at = Column(DateTime)
    failure_reason = Column(Text)
    retry_count = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)
    metadata = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    template = relationship("NotificationTemplate", back_populates="notifications")
    tenant = relationship("Tenant")
    recipient = relationship("User")
    delivery_attempts = relationship("NotificationDelivery", back_populates="notification", cascade="all, delete-orphan")

class NotificationDelivery(Base):
    """Delivery attempts and status tracking"""
    __tablename__ = "notification_deliveries"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    notification_id = Column(String, ForeignKey('notifications.id'), nullable=False)
    attempt_number = Column(Integer, nullable=False)
    status = Column(Enum(NotificationStatus), nullable=False)
    provider = Column(String(100))  # Email provider, SMS gateway, etc.
    provider_id = Column(String)  # External provider message ID
    response = Column(JSON, default=dict)  # Provider response
    error_message = Column(Text)
    attempted_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    notification = relationship("Notification", back_populates="delivery_attempts")

class NotificationPreference(Base):
    """User notification preferences"""
    __tablename__ = "notification_preferences"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey('users.id'), nullable=False)
    tenant_id = Column(String, ForeignKey('tenants.id'), nullable=False)
    notification_type = Column(Enum(NotificationType), nullable=False)
    is_enabled = Column(Boolean, default=True)
    channels = Column(JSON, default=list)  # Preferred delivery channels
    quiet_hours_start = Column(String(5))  # HH:MM format
    quiet_hours_end = Column(String(5))  # HH:MM format
    timezone = Column(String(50), default='UTC')
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User")
    tenant = relationship("Tenant")

class NotificationChannel(Base):
    """Notification delivery channels configuration"""
    __tablename__ = "notification_channels"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    notification_type = Column(Enum(NotificationType), nullable=False)
    provider = Column(String(100), nullable=False)  # sendgrid, twilio, firebase, etc.
    configuration = Column(JSON, default=dict)  # Provider-specific configuration
    is_active = Column(Boolean, default=True)
    priority = Column(Integer, default=1)  # Channel priority for failover
    rate_limit = Column(Integer)  # Messages per minute
    tenant_id = Column(String, ForeignKey('tenants.id'))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant")

class MessageQueue(Base):
    """Message queue for processing notifications"""
    __tablename__ = "message_queue"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    notification_id = Column(String, ForeignKey('notifications.id'), nullable=False)
    priority = Column(Integer, default=0)  # Higher number = higher priority
    status = Column(String(20), default='queued')  # queued, processing, completed, failed
    scheduled_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    error_message = Column(Text)
    retry_count = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    notification = relationship("Notification")

class WebhookEndpoint(Base):
    """Webhook endpoints for external integrations"""
    __tablename__ = "webhook_endpoints"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    url = Column(String(500), nullable=False)
    tenant_id = Column(String, ForeignKey('tenants.id'), nullable=False)
    events = Column(JSON, default=list)  # List of events to send
    secret = Column(String(255))  # Webhook secret for verification
    is_active = Column(Boolean, default=True)
    retry_count = Column(Integer, default=3)
    timeout = Column(Integer, default=30)  # Timeout in seconds
    created_by = Column(String, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant")
    created_by_user = relationship("User")
    webhook_deliveries = relationship("WebhookDelivery", back_populates="endpoint", cascade="all, delete-orphan")

class WebhookDelivery(Base):
    """Webhook delivery attempts and status"""
    __tablename__ = "webhook_deliveries"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    endpoint_id = Column(String, ForeignKey('webhook_endpoints.id'), nullable=False)
    event_type = Column(String(100), nullable=False)
    payload = Column(JSON, nullable=False)
    status = Column(String(20), default='pending')  # pending, sent, delivered, failed
    response_status = Column(Integer)
    response_body = Column(Text)
    error_message = Column(Text)
    attempted_at = Column(DateTime, default=datetime.utcnow)
    delivered_at = Column(DateTime)
    
    # Relationships
    endpoint = relationship("WebhookEndpoint", back_populates="webhook_deliveries")

class NotificationLog(Base):
    """Comprehensive notification logging for audit and analytics"""
    __tablename__ = "notification_logs"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    notification_id = Column(String, ForeignKey('notifications.id'), nullable=False)
    event = Column(String(50), nullable=False)  # created, queued, sent, delivered, failed, etc.
    details = Column(JSON, default=dict)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    notification = relationship("Notification")

# Indexes for performance
Index('idx_notification_templates_tenant_id', NotificationTemplate.tenant_id)
Index('idx_notification_templates_type', NotificationTemplate.notification_type)
Index('idx_notifications_tenant_id', Notification.tenant_id)
Index('idx_notifications_recipient_id', Notification.recipient_id)
Index('idx_notifications_status', Notification.status)
Index('idx_notifications_scheduled_at', Notification.scheduled_at)
Index('idx_notifications_created_at', Notification.created_at)
Index('idx_notification_deliveries_notification_id', NotificationDelivery.notification_id)
Index('idx_notification_deliveries_status', NotificationDelivery.status)
Index('idx_notification_preferences_user_id', NotificationPreference.user_id)
Index('idx_notification_preferences_tenant_id', NotificationPreference.tenant_id)
Index('idx_notification_channels_type', NotificationChannel.notification_type)
Index('idx_notification_channels_tenant_id', NotificationChannel.tenant_id)
Index('idx_message_queue_status', MessageQueue.status)
Index('idx_message_queue_scheduled_at', MessageQueue.scheduled_at)
Index('idx_message_queue_priority', MessageQueue.priority)
Index('idx_webhook_endpoints_tenant_id', WebhookEndpoint.tenant_id)
Index('idx_webhook_endpoints_url', WebhookEndpoint.url)
Index('idx_webhook_deliveries_endpoint_id', WebhookDelivery.endpoint_id)
Index('idx_webhook_deliveries_status', WebhookDelivery.status)
Index('idx_notification_logs_notification_id', NotificationLog.notification_id)
Index('idx_notification_logs_event', NotificationLog.event)
Index('idx_notification_logs_timestamp', NotificationLog.timestamp)
