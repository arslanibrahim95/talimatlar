package config

import (
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

// Config holds all configuration for the notification service
type Config struct {
	Port         string
	Environment  string
	LogLevel     string
	Redis        RedisConfig
	Email        EmailConfig
	SMS          SMSConfig
	Push         PushConfig
	InApp        InAppConfig
	Webhook      WebhookConfig
	Template     TemplateConfig
	Notification NotificationConfig
}

// RedisConfig holds Redis configuration
type RedisConfig struct {
	URL      string
	Password string
	DB       int
}

// EmailConfig holds email service configuration
type EmailConfig struct {
	Host     string
	Port     int
	Username string
	Password string
	From     string
	FromName string
	UseTLS   bool
	UseSSL   bool
}

// SMSConfig holds SMS service configuration
type SMSConfig struct {
	Provider   string
	APIKey     string
	APISecret  string
	FromNumber string
	BaseURL    string
	MaxRetries int
	RetryDelay int
	DryRun     bool
}

// PushConfig holds push notification configuration
type PushConfig struct {
	Provider   string
	APIKey     string
	APISecret  string
	AppID      string
	ProjectID  string
	BaseURL    string
	MaxRetries int
	RetryDelay int
	DryRun     bool
}

// InAppConfig holds in-app notification configuration
type InAppConfig struct {
	TTL        int
	MaxRetries int
	BatchSize  int
}

// WebhookConfig holds webhook configuration
type WebhookConfig struct {
	MaxRetries int
	RetryDelay int
	Timeout    int
	MaxPayload int64
	SecretKey  string
}

// TemplateConfig holds template configuration
type TemplateConfig struct {
	DefaultLocale string
	CacheTTL      int
	MaxTemplates  int
}

// NotificationConfig holds main notification service configuration
type NotificationConfig struct {
	MaxRetries  int
	RetryDelay  int
	BatchSize   int
	QueueSize   int
	WorkerCount int
}

// Load loads configuration from environment variables
func Load() (*Config, error) {
	// Load .env file if it exists
	godotenv.Load()

	config := &Config{
		Port:        getEnv("PORT", "8003"),
		Environment: getEnv("ENVIRONMENT", "development"),
		LogLevel:    getEnv("LOG_LEVEL", "info"),
		Redis: RedisConfig{
			URL:      getEnv("REDIS_URL", "redis://localhost:6379"),
			Password: getEnv("REDIS_PASSWORD", ""),
			DB:       getEnvAsInt("REDIS_DB", 0),
		},
		Email: EmailConfig{
			Host:     getEnv("EMAIL_HOST", "localhost"),
			Port:     getEnvAsInt("EMAIL_PORT", 587),
			Username: getEnv("EMAIL_USERNAME", ""),
			Password: getEnv("EMAIL_PASSWORD", ""),
			From:     getEnv("EMAIL_FROM", "noreply@claude-talimat.com"),
			FromName: getEnv("EMAIL_FROM_NAME", "Claude Talimat"),
			UseTLS:   getEnvAsBool("EMAIL_USE_TLS", true),
			UseSSL:   getEnvAsBool("EMAIL_USE_SSL", false),
		},
		SMS: SMSConfig{
			Provider:   getEnv("SMS_PROVIDER", "netgsm"),
			APIKey:     getEnv("SMS_API_KEY", ""),
			APISecret:  getEnv("SMS_API_SECRET", ""),
			FromNumber: getEnv("SMS_FROM_NUMBER", ""),
			BaseURL:    getEnv("SMS_BASE_URL", ""),
			MaxRetries: getEnvAsInt("SMS_MAX_RETRIES", 3),
			RetryDelay: getEnvAsInt("SMS_RETRY_DELAY", 5),
			DryRun:     getEnvAsBool("SMS_DRY_RUN", false),
		},
		Push: PushConfig{
			Provider:   getEnv("PUSH_PROVIDER", "pusher"),
			APIKey:     getEnv("PUSH_API_KEY", ""),
			APISecret:  getEnv("PUSH_API_SECRET", ""),
			AppID:      getEnv("PUSH_APP_ID", ""),
			ProjectID:  getEnv("PUSH_PROJECT_ID", ""),
			BaseURL:    getEnv("PUSH_BASE_URL", ""),
			MaxRetries: getEnvAsInt("PUSH_MAX_RETRIES", 3),
			RetryDelay: getEnvAsInt("PUSH_RETRY_DELAY", 5),
			DryRun:     getEnvAsBool("PUSH_DRY_RUN", false),
		},
		InApp: InAppConfig{
			TTL:        getEnvAsInt("INAPP_TTL", 24),
			MaxRetries: getEnvAsInt("INAPP_MAX_RETRIES", 3),
			BatchSize:  getEnvAsInt("INAPP_BATCH_SIZE", 100),
		},
		Webhook: WebhookConfig{
			MaxRetries: getEnvAsInt("WEBHOOK_MAX_RETRIES", 3),
			RetryDelay: getEnvAsInt("WEBHOOK_RETRY_DELAY", 5),
			Timeout:    getEnvAsInt("WEBHOOK_TIMEOUT", 30),
			MaxPayload: getEnvAsInt64("WEBHOOK_MAX_PAYLOAD", 1048576), // 1MB
			SecretKey:  getEnv("WEBHOOK_SECRET_KEY", ""),
		},
		Template: TemplateConfig{
			DefaultLocale: getEnv("TEMPLATE_DEFAULT_LOCALE", "tr"),
			CacheTTL:      getEnvAsInt("TEMPLATE_CACHE_TTL", 1),
			MaxTemplates:  getEnvAsInt("TEMPLATE_MAX_TEMPLATES", 1000),
		},
		Notification: NotificationConfig{
			MaxRetries:  getEnvAsInt("NOTIFICATION_MAX_RETRIES", 3),
			RetryDelay:  getEnvAsInt("NOTIFICATION_RETRY_DELAY", 5),
			BatchSize:   getEnvAsInt("NOTIFICATION_BATCH_SIZE", 100),
			QueueSize:   getEnvAsInt("NOTIFICATION_QUEUE_SIZE", 1000),
			WorkerCount: getEnvAsInt("NOTIFICATION_WORKER_COUNT", 5),
		},
	}

	return config, nil
}

// getEnv gets an environment variable with a default value
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// getEnvAsInt gets an environment variable as an integer with a default value
func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

// getEnvAsInt64 gets an environment variable as an int64 with a default value
func getEnvAsInt64(key string, defaultValue int64) int64 {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.ParseInt(value, 10, 64); err == nil {
			return intValue
		}
	}
	return defaultValue
}

// getEnvAsBool gets an environment variable as a boolean with a default value
func getEnvAsBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		if boolValue, err := strconv.ParseBool(value); err == nil {
			return boolValue
		}
	}
	return defaultValue
}

// getEnvAsDuration gets an environment variable as a duration with a default value
func getEnvAsDuration(key string, defaultValue time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		if duration, err := time.ParseDuration(value); err == nil {
			return duration
		}
	}
	return defaultValue
}
