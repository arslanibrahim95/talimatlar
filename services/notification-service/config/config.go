package config

import (
	"os"
	"strconv"
)

// Config holds all configuration for the application
type Config struct {
	// Server configuration
	Port        string
	Environment string

	// Database configuration
	DatabaseURL string

	// Redis configuration
	RedisURL      string
	RedisPassword string
	RedisDB       int

	// JWT configuration
	JWTSecret string

	// Email configuration
	SMTPHost     string
	SMTPPort     int
	SMTPUser     string
	SMTPPassword string
	SMTPFrom     string
	SMTPTLS      bool

	// SMS configuration (Twilio)
	TwilioAccountSID string
	TwilioAuthToken  string
	TwilioPhoneNumber string

	// Notification settings
	MaxRetries     int
	RetryDelay     int
	BatchSize      int
	QueueTimeout   int
	DefaultTTL     int

	// CORS configuration
	CORSOrigins []string

	// Logging configuration
	LogLevel string
}

// Load loads configuration from environment variables
func Load() *Config {
	config := &Config{
		// Server configuration
		Port:        getEnv("PORT", "8004"),
		Environment: getEnv("NODE_ENV", "development"),

		// Database configuration
		DatabaseURL: getEnv("DATABASE_URL", "postgresql://safety_admin:strong_password_here@localhost:5432/safety_production"),

		// Redis configuration
		RedisURL:      getEnv("REDIS_URL", "redis://localhost:6379"),
		RedisPassword: getEnv("REDIS_PASSWORD", ""),
		RedisDB:       getEnvAsInt("REDIS_DB", 0),

		// JWT configuration
		JWTSecret: getEnv("JWT_SECRET", "your-super-secret-jwt-key-here"),

		// Email configuration
		SMTPHost:     getEnv("SMTP_HOST", "smtp.gmail.com"),
		SMTPPort:     getEnvAsInt("SMTP_PORT", 587),
		SMTPUser:     getEnv("SMTP_USER", ""),
		SMTPPassword: getEnv("SMTP_PASS", ""),
		SMTPFrom:     getEnv("SMTP_FROM", "noreply@claude-talimat.com"),
		SMTPTLS:      getEnvAsBool("SMTP_TLS", true),

		// SMS configuration
		TwilioAccountSID:  getEnv("TWILIO_ACCOUNT_SID", ""),
		TwilioAuthToken:   getEnv("TWILIO_AUTH_TOKEN", ""),
		TwilioPhoneNumber: getEnv("TWILIO_PHONE_NUMBER", ""),

		// Notification settings
		MaxRetries:   getEnvAsInt("MAX_RETRIES", 3),
		RetryDelay:   getEnvAsInt("RETRY_DELAY", 5),
		BatchSize:    getEnvAsInt("BATCH_SIZE", 100),
		QueueTimeout: getEnvAsInt("QUEUE_TIMEOUT", 30),
		DefaultTTL:   getEnvAsInt("DEFAULT_TTL", 3600),

		// CORS configuration
		CORSOrigins: getEnvAsSlice("CORS_ORIGINS", []string{"http://localhost:3000", "http://localhost:8080"}),

		// Logging configuration
		LogLevel: getEnv("LOG_LEVEL", "info"),
	}

	return config
}

// Helper functions to get environment variables with defaults
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

func getEnvAsBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		if boolValue, err := strconv.ParseBool(value); err == nil {
			return boolValue
		}
	}
	return defaultValue
}

func getEnvAsSlice(key string, defaultValue []string) []string {
	if value := os.Getenv(key); value != "" {
		// Simple comma-separated values
		// In production, you might want more sophisticated parsing
		return []string{value}
	}
	return defaultValue
}

// IsProduction returns true if the environment is production
func (c *Config) IsProduction() bool {
	return c.Environment == "production"
}

// IsDevelopment returns true if the environment is development
func (c *Config) IsDevelopment() bool {
	return c.Environment == "development"
}

// IsTest returns true if the environment is test
func (c *Config) IsTest() bool {
	return c.Environment == "test"
}
