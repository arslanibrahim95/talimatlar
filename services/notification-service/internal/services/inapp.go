package services

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/go-redis/redis/v8"
	"github.com/rs/zerolog/log"
)

// InAppNotificationService handles in-app notifications
type InAppNotificationService struct {
	redis  *redis.Client
	config InAppConfig
}

// InAppConfig holds in-app notification service configuration
type InAppConfig struct {
	RedisURL      string
	RedisPassword string
	RedisDB       int
	TTL           time.Duration // Default TTL for notifications
	MaxRetries    int
	BatchSize     int
}

// InAppNotification represents an in-app notification
type InAppNotification struct {
	ID         string                 `json:"id"`
	UserID     string                 `json:"user_id"`
	TenantID   string                 `json:"tenant_id"`
	Type       string                 `json:"type"`
	Title      string                 `json:"title"`
	Message    string                 `json:"message"`
	Data       map[string]interface{} `json:"data"`
	Priority   string                 `json:"priority"` // low, normal, high, urgent
	Category   string                 `json:"category"`
	Read       bool                   `json:"read"`
	Archived   bool                   `json:"archived"`
	CreatedAt  time.Time              `json:"created_at"`
	ReadAt     *time.Time             `json:"read_at,omitempty"`
	ExpiresAt  *time.Time             `json:"expires_at,omitempty"`
	ActionURL  string                 `json:"action_url,omitempty"`
	ActionText string                 `json:"action_text,omitempty"`
	Tags       []string               `json:"tags"`
}

// NotificationTemplate represents a notification template
type NotificationTemplate struct {
	ID         string                 `json:"id"`
	Name       string                 `json:"name"`
	Type       string                 `json:"type"`
	Title      string                 `json:"title"`
	Message    string                 `json:"message"`
	DataSchema map[string]interface{} `json:"data_schema"`
	Priority   string                 `json:"priority"`
	Category   string                 `json:"category"`
	TTL        time.Duration          `json:"ttl"`
	IsActive   bool                   `json:"is_active"`
	TenantID   string                 `json:"tenant_id"`
	CreatedAt  time.Time              `json:"created_at"`
	UpdatedAt  time.Time              `json:"updated_at"`
}

// NotificationPreferences represents user notification preferences
type NotificationPreferences struct {
	UserID     string          `json:"user_id"`
	TenantID   string          `json:"tenant_id"`
	Categories map[string]bool `json:"categories"`
	Types      map[string]bool `json:"types"`
	Priority   map[string]bool `json:"priority"`
	QuietHours QuietHours      `json:"quiet_hours"`
	Email      bool            `json:"email"`
	SMS        bool            `json:"sms"`
	Push       bool            `json:"push"`
	InApp      bool            `json:"in_app"`
	UpdatedAt  time.Time       `json:"updated_at"`
}

// QuietHours represents quiet hours configuration
type QuietHours struct {
	Enabled    bool   `json:"enabled"`
	StartTime  string `json:"start_time"` // HH:MM format
	EndTime    string `json:"end_time"`   // HH:MM format
	Timezone   string `json:"timezone"`
	DaysOfWeek []int  `json:"days_of_week"` // 0=Sunday, 1=Monday, etc.
}

// NewInAppNotificationService creates a new in-app notification service instance
func NewInAppNotificationService(config InAppConfig) (*InAppNotificationService, error) {
	// Parse Redis URL
	redisOpts, err := redis.ParseURL(config.RedisURL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse Redis URL: %w", err)
	}

	// Override with config values
	if config.RedisPassword != "" {
		redisOpts.Password = config.RedisPassword
	}
	if config.RedisDB != 0 {
		redisOpts.DB = config.RedisDB
	}

	// Create Redis client
	redisClient := redis.NewClient(redisOpts)

	// Test connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := redisClient.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("failed to connect to Redis: %w", err)
	}

	return &InAppNotificationService{
		redis:  redisClient,
		config: config,
	}, nil
}

// CreateNotification creates a new in-app notification
func (s *InAppNotificationService) CreateNotification(notification InAppNotification) (*InAppNotification, error) {
	log.Info().
		Str("userID", notification.UserID).
		Str("type", notification.Type).
		Str("title", notification.Title).
		Msg("Creating in-app notification")

	// Validate notification
	if err := s.validateNotification(notification); err != nil {
		return nil, fmt.Errorf("notification validation failed: %w", err)
	}

	// Set default values
	if notification.ID == "" {
		notification.ID = generateNotificationID()
	}
	if notification.CreatedAt.IsZero() {
		notification.CreatedAt = time.Now()
	}
	if notification.ExpiresAt == nil {
		expiresAt := time.Now().Add(s.config.TTL)
		notification.ExpiresAt = &expiresAt
	}

	// Store in Redis
	ctx := context.Background()
	key := s.getNotificationKey(notification.ID)

	notificationJSON, err := json.Marshal(notification)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal notification: %w", err)
	}

	// Store notification
	if err := s.redis.Set(ctx, key, notificationJSON, s.config.TTL).Err(); err != nil {
		return nil, fmt.Errorf("failed to store notification: %w", err)
	}

	// Add to user's notification list
	userKey := s.getUserNotificationsKey(notification.UserID, notification.TenantID)
	if err := s.redis.ZAdd(ctx, userKey, &redis.Z{
		Score:  float64(notification.CreatedAt.Unix()),
		Member: notification.ID,
	}).Err(); err != nil {
		log.Error().Err(err).Msg("Failed to add notification to user list")
	}

	// Add to unread set
	unreadKey := s.getUnreadKey(notification.UserID, notification.TenantID)
	if err := s.redis.SAdd(ctx, unreadKey, notification.ID).Err(); err != nil {
		log.Error().Err(err).Msg("Failed to add notification to unread set")
	}

	// Add to category index
	categoryKey := s.getCategoryKey(notification.Category, notification.TenantID)
	if err := s.redis.ZAdd(ctx, categoryKey, &redis.Z{
		Score:  float64(notification.CreatedAt.Unix()),
		Member: notification.ID,
	}).Err(); err != nil {
		log.Error().Err(err).Msg("Failed to add notification to category index")
	}

	log.Info().
		Str("notificationID", notification.ID).
		Msg("In-app notification created successfully")

	return &notification, nil
}

// GetUserNotifications gets notifications for a specific user
func (s *InAppNotificationService) GetUserNotifications(
	userID string,
	tenantID string,
	page int,
	limit int,
	filters map[string]interface{},
) ([]*InAppNotification, int, error) {
	log.Info().
		Str("userID", userID).
		Int("page", page).
		Int("limit", limit).
		Msg("Getting user notifications")

	ctx := context.Background()
	userKey := s.getUserNotificationsKey(userID, tenantID)

	// Get total count
	total, err := s.redis.ZCard(ctx, userKey).Result()
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get notification count: %w", err)
	}

	// Calculate pagination
	start := int64((page - 1) * limit)
	stop := start + int64(limit) - 1

	// Get notification IDs (newest first)
	notificationIDs, err := s.redis.ZRevRange(ctx, userKey, start, stop).Result()
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get notification IDs: %w", err)
	}

	// Get notification details
	var notifications []*InAppNotification
	for _, id := range notificationIDs {
		notification, err := s.GetNotification(id)
		if err != nil {
			log.Warn().Err(err).Str("notificationID", id).Msg("Failed to get notification")
			continue
		}

		// Apply filters
		if s.matchesFilters(notification, filters) {
			notifications = append(notifications, notification)
		}
	}

	return notifications, int(total), nil
}

// GetNotification gets a specific notification by ID
func (s *InAppNotificationService) GetNotification(notificationID string) (*InAppNotification, error) {
	ctx := context.Background()
	key := s.getNotificationKey(notificationID)

	notificationJSON, err := s.redis.Get(ctx, key).Result()
	if err != nil {
		if err == redis.Nil {
			return nil, fmt.Errorf("notification not found: %s", notificationID)
		}
		return nil, fmt.Errorf("failed to get notification: %w", err)
	}

	var notification InAppNotification
	if err := json.Unmarshal([]byte(notificationJSON), &notification); err != nil {
		return nil, fmt.Errorf("failed to unmarshal notification: %w", err)
	}

	return &notification, nil
}

// MarkAsRead marks a notification as read
func (s *InAppNotificationService) MarkAsRead(notificationID string, userID string) error {
	log.Info().
		Str("notificationID", notificationID).
		Str("userID", userID).
		Msg("Marking notification as read")

	notification, err := s.GetNotification(notificationID)
	if err != nil {
		return fmt.Errorf("failed to get notification: %w", err)
	}

	// Check if user owns this notification
	if notification.UserID != userID {
		return fmt.Errorf("user %s does not own notification %s", userID, notificationID)
	}

	// Update notification
	now := time.Now()
	notification.Read = true
	notification.ReadAt = &now

	// Store updated notification
	ctx := context.Background()
	key := s.getNotificationKey(notificationID)

	notificationJSON, err := json.Marshal(notification)
	if err != nil {
		return fmt.Errorf("failed to marshal notification: %w", err)
	}

	if err := s.redis.Set(ctx, key, notificationJSON, s.config.TTL).Err(); err != nil {
		return fmt.Errorf("failed to update notification: %w", err)
	}

	// Remove from unread set
	unreadKey := s.getUnreadKey(userID, notification.TenantID)
	if err := s.redis.SRem(ctx, unreadKey, notificationID).Err(); err != nil {
		log.Error().Err(err).Msg("Failed to remove notification from unread set")
	}

	log.Info().
		Str("notificationID", notificationID).
		Msg("Notification marked as read")

	return nil
}

// MarkAllAsRead marks all notifications as read for a user
func (s *InAppNotificationService) MarkAllAsRead(userID string, tenantID string) error {
	log.Info().
		Str("userID", userID).
		Msg("Marking all notifications as read")

	ctx := context.Background()
	unreadKey := s.getUnreadKey(userID, tenantID)

	// Get all unread notification IDs
	unreadIDs, err := s.redis.SMembers(ctx, unreadKey).Result()
	if err != nil {
		return fmt.Errorf("failed to get unread notifications: %w", err)
	}

	// Mark each as read
	for _, id := range unreadIDs {
		if err := s.MarkAsRead(id, userID); err != nil {
			log.Warn().Err(err).Str("notificationID", id).Msg("Failed to mark notification as read")
		}
	}

	log.Info().
		Int("count", len(unreadIDs)).
		Msg("All notifications marked as read")

	return nil
}

// ArchiveNotification archives a notification
func (s *InAppNotificationService) ArchiveNotification(notificationID string, userID string) error {
	log.Info().
		Str("notificationID", notificationID).
		Str("userID", userID).
		Msg("Archiving notification")

	notification, err := s.GetNotification(notificationID)
	if err != nil {
		return fmt.Errorf("failed to get notification: %w", err)
	}

	// Check if user owns this notification
	if notification.UserID != userID {
		return fmt.Errorf("user %s does not own notification %s", userID, notificationID)
	}

	// Update notification
	notification.Archived = true

	// Store updated notification
	ctx := context.Background()
	key := s.getNotificationKey(notificationID)

	notificationJSON, err := json.Marshal(notification)
	if err != nil {
		return fmt.Errorf("failed to marshal notification: %w", err)
	}

	if err := s.redis.Set(ctx, key, notificationJSON, s.config.TTL).Err(); err != nil {
		return fmt.Errorf("failed to update notification: %w", err)
	}

	log.Info().
		Str("notificationID", notificationID).
		Msg("Notification archived")

	return nil
}

// DeleteNotification deletes a notification
func (s *InAppNotificationService) DeleteNotification(notificationID string, userID string) error {
	log.Info().
		Str("notificationID", notificationID).
		Str("userID", userID).
		Msg("Deleting notification")

	notification, err := s.GetNotification(notificationID)
	if err != nil {
		return fmt.Errorf("failed to get notification: %w", err)
	}

	// Check if user owns this notification
	if notification.UserID != userID {
		return fmt.Errorf("user %s does not own notification %s", userID, notificationID)
	}

	ctx := context.Background()

	// Remove from Redis
	key := s.getNotificationKey(notificationID)
	if err := s.redis.Del(ctx, key).Err(); err != nil {
		return fmt.Errorf("failed to delete notification: %w", err)
	}

	// Remove from user's notification list
	userKey := s.getUserNotificationsKey(userID, notification.TenantID)
	if err := s.redis.ZRem(ctx, userKey, notificationID).Err(); err != nil {
		log.Error().Err(err).Msg("Failed to remove notification from user list")
	}

	// Remove from unread set
	unreadKey := s.getUnreadKey(userID, notification.TenantID)
	if err := s.redis.SRem(ctx, unreadKey, notificationID).Err(); err != nil {
		log.Error().Err(err).Msg("Failed to remove notification from unread set")
	}

	// Remove from category index
	categoryKey := s.getCategoryKey(notification.Category, notification.TenantID)
	if err := s.redis.ZRem(ctx, categoryKey, notificationID).Err(); err != nil {
		log.Error().Err(err).Msg("Failed to remove notification from category index")
	}

	log.Info().
		Str("notificationID", notificationID).
		Msg("Notification deleted")

	return nil
}

// GetUnreadCount gets the count of unread notifications for a user
func (s *InAppNotificationService) GetUnreadCount(userID string, tenantID string) (int, error) {
	ctx := context.Background()
	unreadKey := s.getUnreadKey(userID, tenantID)

	count, err := s.redis.SCard(ctx, unreadKey).Result()
	if err != nil {
		return 0, fmt.Errorf("failed to get unread count: %w", err)
	}

	return int(count), nil
}

// GetNotificationStats gets notification statistics for a user
func (s *InAppNotificationService) GetNotificationStats(userID string, tenantID string) (map[string]int, error) {
	log.Info().
		Str("userID", userID).
		Msg("Getting notification statistics")

	ctx := context.Background()
	userKey := s.getUserNotificationsKey(userID, tenantID)

	// Get total count
	total, err := s.redis.ZCard(ctx, userKey).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to get total count: %w", err)
	}

	// Get unread count
	unreadCount, err := s.GetUnreadCount(userID, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get unread count: %w", err)
	}

	// Get notifications for detailed stats
	notifications, _, err := s.GetUserNotifications(userID, tenantID, 1, 1000, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to get notifications for stats: %w", err)
	}

	// Calculate statistics
	stats := make(map[string]int)
	stats["total"] = int(total)
	stats["unread"] = int(unreadCount)

	for _, notification := range notifications {
		// Category stats
		stats[notification.Category]++

		// Type stats
		stats[notification.Type]++

		// Priority stats
		stats[notification.Priority]++

		// Date stats (group by day)
		dateKey := notification.CreatedAt.Format("2006-01-02")
		stats[dateKey]++

		// Archived count
		if notification.Archived {
			stats["archived"]++
		}
	}

	return stats, nil
}

// CreateTemplate creates a new notification template
func (s *InAppNotificationService) CreateTemplate(template NotificationTemplate) (*NotificationTemplate, error) {
	log.Info().
		Str("name", template.Name).
		Str("type", template.Type).
		Msg("Creating notification template")

	// Validate template
	if err := s.validateTemplate(template); err != nil {
		return nil, fmt.Errorf("template validation failed: %w", err)
	}

	// Set default values
	if template.ID == "" {
		template.ID = generateTemplateID()
	}
	if template.CreatedAt.IsZero() {
		template.CreatedAt = time.Now()
	}
	template.UpdatedAt = time.Now()

	// Store in Redis
	ctx := context.Background()
	key := s.getTemplateKey(template.ID)

	templateJSON, err := json.Marshal(template)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal template: %w", err)
	}

	if err := s.redis.Set(ctx, key, templateJSON, 0).Err(); err != nil {
		return nil, fmt.Errorf("failed to store template: %w", err)
	}

	// Add to templates index
	templatesKey := s.getTemplatesKey(template.TenantID)
	if err := s.redis.ZAdd(ctx, templatesKey, &redis.Z{
		Score:  float64(template.CreatedAt.Unix()),
		Member: template.ID,
	}).Err(); err != nil {
		log.Error().Err(err).Msg("Failed to add template to index")
	}

	log.Info().
		Str("templateID", template.ID).
		Msg("Notification template created successfully")

	return &template, nil
}

// GetTemplate gets a notification template by ID
func (s *InAppNotificationService) GetTemplate(templateID string) (*NotificationTemplate, error) {
	ctx := context.Background()
	key := s.getTemplateKey(templateID)

	templateJSON, err := s.redis.Get(ctx, key).Result()
	if err != nil {
		if err == redis.Nil {
			return nil, fmt.Errorf("template not found: %s", templateID)
		}
		return nil, fmt.Errorf("failed to get template: %w", err)
	}

	var template NotificationTemplate
	if err := json.Unmarshal([]byte(templateJSON), &template); err != nil {
		return nil, fmt.Errorf("failed to unmarshal template: %w", err)
	}

	return &template, nil
}

// UpdateTemplate updates a notification template
func (s *InAppNotificationService) UpdateTemplate(templateID string, updates map[string]interface{}) (*NotificationTemplate, error) {
	log.Info().
		Str("templateID", templateID).
		Msg("Updating notification template")

	template, err := s.GetTemplate(templateID)
	if err != nil {
		return nil, fmt.Errorf("failed to get template: %w", err)
	}

	// Apply updates
	template.UpdatedAt = time.Now()

	// Update fields based on updates map
	// This is a simplified approach - in production, you'd want more sophisticated field updates
	if title, ok := updates["title"].(string); ok {
		template.Title = title
	}
	if message, ok := updates["message"].(string); ok {
		template.Message = message
	}
	if priority, ok := updates["priority"].(string); ok {
		template.Priority = priority
	}
	if category, ok := updates["category"].(string); ok {
		template.Category = category
	}
	if isActive, ok := updates["is_active"].(bool); ok {
		template.IsActive = isActive
	}

	// Store updated template
	ctx := context.Background()
	key := s.getTemplateKey(templateID)

	templateJSON, err := json.Marshal(template)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal template: %w", err)
	}

	if err := s.redis.Set(ctx, key, templateJSON, 0).Err(); err != nil {
		return nil, fmt.Errorf("failed to update template: %w", err)
	}

	log.Info().
		Str("templateID", templateID).
		Msg("Notification template updated successfully")

	return template, nil
}

// DeleteTemplate deletes a notification template
func (s *InAppNotificationService) DeleteTemplate(templateID string) error {
	log.Info().
		Str("templateID", templateID).
		Msg("Deleting notification template")

	ctx := context.Background()

	// Remove from Redis
	key := s.getTemplateKey(templateID)
	if err := s.redis.Del(ctx, key).Err(); err != nil {
		return fmt.Errorf("failed to delete template: %w", err)
	}

	// Remove from templates index
	templatesKey := s.getTemplatesKey("") // Global templates
	if err := s.redis.ZRem(ctx, templatesKey, templateID).Err(); err != nil {
		log.Error().Err(err).Msg("Failed to remove template from index")
	}

	log.Info().
		Str("templateID", templateID).
		Msg("Notification template deleted")

	return nil
}

// GetUserPreferences gets notification preferences for a user
func (s *InAppNotificationService) GetUserPreferences(userID string, tenantID string) (*NotificationPreferences, error) {
	ctx := context.Background()
	key := s.getPreferencesKey(userID, tenantID)

	preferencesJSON, err := s.redis.Get(ctx, key).Result()
	if err != nil {
		if err == redis.Nil {
			// Return default preferences
			return s.getDefaultPreferences(userID, tenantID), nil
		}
		return nil, fmt.Errorf("failed to get preferences: %w", err)
	}

	var preferences NotificationPreferences
	if err := json.Unmarshal([]byte(preferencesJSON), &preferences); err != nil {
		return nil, fmt.Errorf("failed to unmarshal preferences: %w", err)
	}

	return &preferences, nil
}

// UpdateUserPreferences updates notification preferences for a user
func (s *InAppNotificationService) UpdateUserPreferences(
	userID string,
	tenantID string,
	updates map[string]interface{},
) (*NotificationPreferences, error) {
	log.Info().
		Str("userID", userID).
		Msg("Updating user notification preferences")

	preferences, err := s.GetUserPreferences(userID, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get preferences: %w", err)
	}

	// Apply updates
	preferences.UpdatedAt = time.Now()

	// Update fields based on updates map
	if categories, ok := updates["categories"].(map[string]bool); ok {
		preferences.Categories = categories
	}
	if types, ok := updates["types"].(map[string]bool); ok {
		preferences.Types = types
	}
	if priority, ok := updates["priority"].(map[string]bool); ok {
		preferences.Priority = priority
	}
	if quietHours, ok := updates["quiet_hours"].(QuietHours); ok {
		preferences.QuietHours = quietHours
	}
	if email, ok := updates["email"].(bool); ok {
		preferences.Email = email
	}
	if sms, ok := updates["sms"].(bool); ok {
		preferences.SMS = sms
	}
	if push, ok := updates["push"].(bool); ok {
		preferences.Push = push
	}
	if inApp, ok := updates["in_app"].(bool); ok {
		preferences.InApp = inApp
	}

	// Store updated preferences
	ctx := context.Background()
	key := s.getPreferencesKey(userID, tenantID)

	preferencesJSON, err := json.Marshal(preferences)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal preferences: %w", err)
	}

	if err := s.redis.Set(ctx, key, preferencesJSON, 0).Err(); err != nil {
		return nil, fmt.Errorf("failed to update preferences: %w", err)
	}

	log.Info().
		Str("userID", userID).
		Msg("User notification preferences updated successfully")

	return preferences, nil
}

// TestConnection tests the in-app notification service connection
func (s *InAppNotificationService) TestConnection() error {
	log.Info().Msg("Testing in-app notification service connection")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := s.redis.Ping(ctx).Err(); err != nil {
		log.Error().Err(err).Msg("In-app notification service connection test failed")
		return fmt.Errorf("connection test failed: %w", err)
	}

	log.Info().Msg("In-app notification service connection test successful")
	return nil
}

// validateNotification validates an in-app notification
func (s *InAppNotificationService) validateNotification(notification InAppNotification) error {
	if notification.UserID == "" {
		return fmt.Errorf("user ID is required")
	}

	if notification.TenantID == "" {
		return fmt.Errorf("tenant ID is required")
	}

	if notification.Type == "" {
		return fmt.Errorf("notification type is required")
	}

	if notification.Title == "" {
		return fmt.Errorf("notification title is required")
	}

	if notification.Message == "" {
		return fmt.Errorf("notification message is required")
	}

	if notification.Priority == "" {
		notification.Priority = "normal"
	}

	if notification.Category == "" {
		notification.Category = "general"
	}

	return nil
}

// validateTemplate validates a notification template
func (s *InAppNotificationService) validateTemplate(template NotificationTemplate) error {
	if template.Name == "" {
		return fmt.Errorf("template name is required")
	}

	if template.Type == "" {
		return fmt.Errorf("template type is required")
	}

	if template.Title == "" {
		return fmt.Errorf("template title is required")
	}

	if template.Message == "" {
		return fmt.Errorf("template message is required")
	}

	return nil
}

// matchesFilters checks if a notification matches the given filters
func (s *InAppNotificationService) matchesFilters(
	notification *InAppNotification,
	filters map[string]interface{},
) bool {
	if filters == nil {
		return true
	}

	for key, value := range filters {
		switch key {
		case "type":
			if typeStr, ok := value.(string); ok && notification.Type != typeStr {
				return false
			}
		case "category":
			if categoryStr, ok := value.(string); ok && notification.Category != categoryStr {
				return false
			}
		case "priority":
			if priorityStr, ok := value.(string); ok && notification.Priority != priorityStr {
				return false
			}
		case "read":
			if readBool, ok := value.(bool); ok && notification.Read != readBool {
				return false
			}
		case "archived":
			if archivedBool, ok := value.(bool); ok && notification.Archived != archivedBool {
				return false
			}
		}
	}

	return true
}

// getDefaultPreferences returns default notification preferences
func (s *InAppNotificationService) getDefaultPreferences(userID string, tenantID string) *NotificationPreferences {
	return &NotificationPreferences{
		UserID:   userID,
		TenantID: tenantID,
		Categories: map[string]bool{
			"general":     true,
			"security":    true,
			"compliance":  true,
			"maintenance": true,
			"updates":     true,
		},
		Types: map[string]bool{
			"info":    true,
			"warning": true,
			"error":   true,
			"success": true,
		},
		Priority: map[string]bool{
			"low":    true,
			"normal": true,
			"high":   true,
			"urgent": true,
		},
		QuietHours: QuietHours{
			Enabled:    false,
			StartTime:  "22:00",
			EndTime:    "08:00",
			Timezone:   "Europe/Istanbul",
			DaysOfWeek: []int{0, 1, 2, 3, 4, 5, 6}, // All days
		},
		Email:     true,
		SMS:       true,
		Push:      true,
		InApp:     true,
		UpdatedAt: time.Now(),
	}
}

// Redis key generators
func (s *InAppNotificationService) getNotificationKey(notificationID string) string {
	return fmt.Sprintf("notification:%s", notificationID)
}

func (s *InAppNotificationService) getUserNotificationsKey(userID string, tenantID string) string {
	return fmt.Sprintf("user_notifications:%s:%s", tenantID, userID)
}

func (s *InAppNotificationService) getUnreadKey(userID string, tenantID string) string {
	return fmt.Sprintf("unread:%s:%s", tenantID, userID)
}

func (s *InAppNotificationService) getCategoryKey(category string, tenantID string) string {
	return fmt.Sprintf("category:%s:%s", tenantID, category)
}

func (s *InAppNotificationService) getTemplateKey(templateID string) string {
	return fmt.Sprintf("template:%s", templateID)
}

func (s *InAppNotificationService) getTemplatesKey(tenantID string) string {
	if tenantID == "" {
		return "templates:global"
	}
	return fmt.Sprintf("templates:%s", tenantID)
}

func (s *InAppNotificationService) getPreferencesKey(userID string, tenantID string) string {
	return fmt.Sprintf("preferences:%s:%s", tenantID, userID)
}

// Helper functions
func generateNotificationID() string {
	return fmt.Sprintf("notif_%d", time.Now().UnixNano())
}

func generateTemplateID() string {
	return fmt.Sprintf("tmpl_%d", time.Now().UnixNano())
}
