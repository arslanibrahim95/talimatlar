package models

import (
	"time"
)

// NotificationType represents the type of notification
type NotificationType string

const (
	NotificationTypeEmail NotificationType = "email"
	NotificationTypeSMS   NotificationType = "sms"
	NotificationTypePush  NotificationType = "push"
	NotificationTypeInApp NotificationType = "in_app"
)

// NotificationStatus represents the status of a notification
type NotificationStatus string

const (
	NotificationStatusPending   NotificationStatus = "pending"
	NotificationStatusSent      NotificationStatus = "sent"
	NotificationStatusDelivered NotificationStatus = "delivered"
	NotificationStatusFailed    NotificationStatus = "failed"
	NotificationStatusCancelled NotificationStatus = "cancelled"
)

// NotificationPriority represents the priority of a notification
type NotificationPriority string

const (
	NotificationPriorityLow    NotificationPriority = "low"
	NotificationPriorityNormal NotificationPriority = "normal"
	NotificationPriorityHigh   NotificationPriority = "high"
	NotificationPriorityUrgent NotificationPriority = "urgent"
)

// Notification represents a notification in the system
type Notification struct {
	ID          string             `json:"id" db:"id"`
	Type        NotificationType   `json:"type" db:"type"`
	Title       string             `json:"title" db:"title"`
	Message     string             `json:"message" db:"message"`
	Recipient   string             `json:"recipient" db:"recipient"`
	Sender      string             `json:"sender" db:"sender"`
	Status      NotificationStatus `json:"status" db:"status"`
	Priority    NotificationPriority `json:"priority" db:"priority"`
	TemplateID  *string            `json:"template_id,omitempty" db:"template_id"`
	Metadata    map[string]interface{} `json:"metadata,omitempty" db:"metadata"`
	TenantID    string             `json:"tenant_id" db:"tenant_id"`
	ScheduledAt *time.Time         `json:"scheduled_at,omitempty" db:"scheduled_at"`
	SentAt      *time.Time         `json:"sent_at,omitempty" db:"sent_at"`
	DeliveredAt *time.Time         `json:"delivered_at,omitempty" db:"delivered_at"`
	RetryCount  int                `json:"retry_count" db:"retry_count"`
	MaxRetries  int                `json:"max_retries" db:"max_retries"`
	Error       *string            `json:"error,omitempty" db:"error"`
	CreatedAt   time.Time          `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time          `json:"updated_at" db:"updated_at"`
}

// NotificationTemplate represents a notification template
type NotificationTemplate struct {
	ID          string                 `json:"id" db:"id"`
	Name        string                 `json:"name" db:"name"`
	Type        NotificationType       `json:"type" db:"type"`
	Subject     string                 `json:"subject" db:"subject"`
	Content     string                 `json:"content" db:"content"`
	Variables   []string               `json:"variables" db:"variables"`
	Metadata    map[string]interface{} `json:"metadata,omitempty" db:"metadata"`
	TenantID    string                 `json:"tenant_id" db:"tenant_id"`
	IsActive    bool                   `json:"is_active" db:"is_active"`
	CreatedBy   string                 `json:"created_by" db:"created_by"`
	CreatedAt   time.Time              `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time              `json:"updated_at" db:"updated_at"`
}

// NotificationSubscription represents a user's notification preferences
type NotificationSubscription struct {
	ID                string                 `json:"id" db:"id"`
	UserID            string                 `json:"user_id" db:"user_id"`
	TenantID          string                 `json:"tenant_id" db:"tenant_id"`
	EmailEnabled      bool                   `json:"email_enabled" db:"email_enabled"`
	SMSEnabled        bool                   `json:"sms_enabled" db:"sms_enabled"`
	PushEnabled       bool                   `json:"push_enabled" db:"push_enabled"`
	InAppEnabled      bool                   `json:"in_app_enabled" db:"in_app_enabled"`
	EmailAddress      *string                `json:"email_address,omitempty" db:"email_address"`
	PhoneNumber       *string                `json:"phone_number,omitempty" db:"phone_number"`
	PushToken         *string                `json:"push_token,omitempty" db:"push_token"`
	Categories        []string               `json:"categories" db:"categories"`
	Frequency         string                 `json:"frequency" db:"frequency"`
	QuietHours        *QuietHours            `json:"quiet_hours,omitempty" db:"quiet_hours"`
	Metadata          map[string]interface{} `json:"metadata,omitempty" db:"metadata"`
	CreatedAt         time.Time              `json:"created_at" db:"created_at"`
	UpdatedAt         time.Time              `json:"updated_at" db:"updated_at"`
}

// QuietHours represents quiet hours settings
type QuietHours struct {
	Enabled   bool   `json:"enabled"`
	StartTime string `json:"start_time"` // Format: "HH:MM"
	EndTime   string `json:"end_time"`   // Format: "HH:MM"
	Timezone  string `json:"timezone"`
}

// NotificationSettings represents global notification settings
type NotificationSettings struct {
	ID                    string                 `json:"id" db:"id"`
	TenantID              string                 `json:"tenant_id" db:"tenant_id"`
	DefaultEmailTemplate  *string                `json:"default_email_template,omitempty" db:"default_email_template"`
	DefaultSMSTemplate    *string                `json:"default_sms_template,omitempty" db:"default_sms_template"`
	DefaultPushTemplate   *string                `json:"default_push_template,omitempty" db:"default_push_template"`
	MaxRetries            int                    `json:"max_retries" db:"max_retries"`
	RetryDelay            int                    `json:"retry_delay" db:"retry_delay"`
	BatchSize             int                    `json:"batch_size" db:"batch_size"`
	QueueTimeout          int                    `json:"queue_timeout" db:"queue_timeout"`
	DefaultTTL            int                    `json:"default_ttl" db:"default_ttl"`
	RateLimitPerMinute    int                    `json:"rate_limit_per_minute" db:"rate_limit_per_minute"`
	RateLimitPerHour      int                    `json:"rate_limit_per_hour" db:"rate_limit_per_hour"`
	RateLimitPerDay       int                    `json:"rate_limit_per_day" db:"rate_limit_per_day"`
	Metadata              map[string]interface{} `json:"metadata,omitempty" db:"metadata"`
	CreatedAt             time.Time              `json:"created_at" db:"created_at"`
	UpdatedAt             time.Time              `json:"updated_at" db:"updated_at"`
}

// Request/Response models

// SendNotificationRequest represents a request to send a notification
type SendNotificationRequest struct {
	Type        NotificationType       `json:"type" binding:"required"`
	Title       string                 `json:"title" binding:"required"`
	Message     string                 `json:"message" binding:"required"`
	Recipient   string                 `json:"recipient" binding:"required"`
	Sender      string                 `json:"sender,omitempty"`
	Priority    NotificationPriority   `json:"priority,omitempty"`
	TemplateID  *string                `json:"template_id,omitempty"`
	TemplateData map[string]interface{} `json:"template_data,omitempty"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
	TenantID    string                 `json:"tenant_id" binding:"required"`
	ScheduledAt *time.Time             `json:"scheduled_at,omitempty"`
}

// SendEmailRequest represents a request to send an email
type SendEmailRequest struct {
	To          []string               `json:"to" binding:"required"`
	CC          []string               `json:"cc,omitempty"`
	BCC         []string               `json:"bcc,omitempty"`
	Subject     string                 `json:"subject" binding:"required"`
	Body        string                 `json:"body" binding:"required"`
	IsHTML      bool                   `json:"is_html,omitempty"`
	Attachments []EmailAttachment      `json:"attachments,omitempty"`
	TemplateID  *string                `json:"template_id,omitempty"`
	TemplateData map[string]interface{} `json:"template_data,omitempty"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
	TenantID    string                 `json:"tenant_id" binding:"required"`
}

// EmailAttachment represents an email attachment
type EmailAttachment struct {
	Filename    string `json:"filename"`
	ContentType string `json:"content_type"`
	Data        []byte `json:"data"`
}

// SendSMSRequest represents a request to send an SMS
type SendSMSRequest struct {
	To          string                 `json:"to" binding:"required"`
	Message     string                 `json:"message" binding:"required"`
	From        string                 `json:"from,omitempty"`
	TemplateID  *string                `json:"template_id,omitempty"`
	TemplateData map[string]interface{} `json:"template_data,omitempty"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
	TenantID    string                 `json:"tenant_id" binding:"required"`
}

// SendPushNotificationRequest represents a request to send a push notification
type SendPushNotificationRequest struct {
	To          []string               `json:"to" binding:"required"`
	Title       string                 `json:"title" binding:"required"`
	Body        string                 `json:"body" binding:"required"`
	Data        map[string]interface{} `json:"data,omitempty"`
	Image       string                 `json:"image,omitempty"`
	URL         string                 `json:"url,omitempty"`
	TemplateID  *string                `json:"template_id,omitempty"`
	TemplateData map[string]interface{} `json:"template_data,omitempty"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
	TenantID    string                 `json:"tenant_id" binding:"required"`
}

// SendBulkNotificationsRequest represents a request to send bulk notifications
type SendBulkNotificationsRequest struct {
	Type        NotificationType       `json:"type" binding:"required"`
	Title       string                 `json:"title" binding:"required"`
	Message     string                 `json:"message" binding:"required"`
	Recipients  []string               `json:"recipients" binding:"required"`
	Sender      string                 `json:"sender,omitempty"`
	Priority    NotificationPriority   `json:"priority,omitempty"`
	TemplateID  *string                `json:"template_id,omitempty"`
	TemplateData map[string]interface{} `json:"template_data,omitempty"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
	TenantID    string                 `json:"tenant_id" binding:"required"`
	ScheduledAt *time.Time             `json:"scheduled_at,omitempty"`
}

// NotificationResponse represents a notification response
type NotificationResponse struct {
	ID        string             `json:"id"`
	Status    NotificationStatus `json:"status"`
	Message   string             `json:"message,omitempty"`
	Error     string             `json:"error,omitempty"`
	CreatedAt time.Time          `json:"created_at"`
}

// BulkNotificationResponse represents a bulk notification response
type BulkNotificationResponse struct {
	BatchID    string                 `json:"batch_id"`
	Total      int                    `json:"total"`
	Successful int                    `json:"successful"`
	Failed     int                    `json:"failed"`
	Results    []NotificationResponse `json:"results"`
	CreatedAt  time.Time              `json:"created_at"`
}

// TemplateRequest represents a template creation/update request
type TemplateRequest struct {
	Name      string                 `json:"name" binding:"required"`
	Type      NotificationType       `json:"type" binding:"required"`
	Subject   string                 `json:"subject,omitempty"`
	Content   string                 `json:"content" binding:"required"`
	Variables []string               `json:"variables,omitempty"`
	Metadata  map[string]interface{} `json:"metadata,omitempty"`
	TenantID  string                 `json:"tenant_id" binding:"required"`
	IsActive  bool                   `json:"is_active,omitempty"`
}

// SubscriptionRequest represents a subscription creation/update request
type SubscriptionRequest struct {
	UserID       string                 `json:"user_id" binding:"required"`
	TenantID     string                 `json:"tenant_id" binding:"required"`
	EmailEnabled bool                   `json:"email_enabled,omitempty"`
	SMSEnabled   bool                   `json:"sms_enabled,omitempty"`
	PushEnabled  bool                   `json:"push_enabled,omitempty"`
	InAppEnabled bool                   `json:"in_app_enabled,omitempty"`
	EmailAddress *string                `json:"email_address,omitempty"`
	PhoneNumber  *string                `json:"phone_number,omitempty"`
	PushToken    *string                `json:"push_token,omitempty"`
	Categories   []string               `json:"categories,omitempty"`
	Frequency    string                 `json:"frequency,omitempty"`
	QuietHours   *QuietHours            `json:"quiet_hours,omitempty"`
	Metadata     map[string]interface{} `json:"metadata,omitempty"`
}

// SettingsRequest represents settings update request
type SettingsRequest struct {
	TenantID              string                 `json:"tenant_id" binding:"required"`
	DefaultEmailTemplate  *string                `json:"default_email_template,omitempty"`
	DefaultSMSTemplate    *string                `json:"default_sms_template,omitempty"`
	DefaultPushTemplate   *string                `json:"default_push_template,omitempty"`
	MaxRetries            *int                   `json:"max_retries,omitempty"`
	RetryDelay            *int                   `json:"retry_delay,omitempty"`
	BatchSize             *int                   `json:"batch_size,omitempty"`
	QueueTimeout          *int                   `json:"queue_timeout,omitempty"`
	DefaultTTL            *int                   `json:"default_ttl,omitempty"`
	RateLimitPerMinute    *int                   `json:"rate_limit_per_minute,omitempty"`
	RateLimitPerHour      *int                   `json:"rate_limit_per_hour,omitempty"`
	RateLimitPerDay       *int                   `json:"rate_limit_per_day,omitempty"`
	Metadata              map[string]interface{} `json:"metadata,omitempty"`
}
