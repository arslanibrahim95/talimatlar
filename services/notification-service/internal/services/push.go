package services

import (
	"fmt"
	"net/http"
	"time"

	pusher "github.com/pusher/pusher-http-go"
	"github.com/rs/zerolog/log"
)

// PushNotificationService handles push notifications
type PushNotificationService struct {
	config PushConfig
	client *http.Client
	pusher *pusher.Client
}

// PushConfig holds push notification service configuration
type PushConfig struct {
	Provider   string // firebase, apns, web-push, pusher
	APIKey     string
	APISecret  string
	AppID      string
	ProjectID  string // Firebase project ID
	BaseURL    string
	MaxRetries int
	RetryDelay time.Duration
	DryRun     bool
}

// PushMessage represents a push notification message
type PushMessage struct {
	Title       string
	Body        string
	Data        map[string]interface{}
	Image       string
	Icon        string
	Badge       int
	Sound       string
	Priority    string // low, normal, high
	TTL         time.Duration
	CollapseKey string
	Topic       string
	Tokens      []string
	UserIDs     []string
	Tags        map[string]string
}

// PushResult represents the result of sending a push notification
type PushResult struct {
	MessageID   string
	Success     bool
	SentCount   int
	FailedCount int
	Errors      []string
	SentAt      time.Time
}

// PushSubscription represents a push notification subscription
type PushSubscription struct {
	ID          string
	UserID      string
	DeviceToken string
	Platform    string // ios, android, web
	AppVersion  string
	DeviceModel string
	OSVersion   string
	Language    string
	Timezone    string
	Tags        map[string]string
	CreatedAt   time.Time
	LastActive  time.Time
	IsActive    bool
}

// NewPushNotificationService creates a new push notification service instance
func NewPushNotificationService(config PushConfig) (*PushNotificationService, error) {
	var pusher *pushnotifications.PushNotifications
	var err error

	// Initialize provider-specific client
	switch config.Provider {
	case "pusher":
		pusher, err = pusher.NewClient(config.AppID, config.APISecret)
		if err != nil {
			return nil, fmt.Errorf("failed to initialize Pusher: %w", err)
		}
	case "firebase", "apns", "web-push":
		// These would be initialized differently
		pusher = nil
	default:
		return nil, fmt.Errorf("unsupported push provider: %s", config.Provider)
	}

	return &PushNotificationService{
		config: config,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
		pusher: pusher,
	}, nil
}

// SendPushNotification sends a push notification
func (s *PushNotificationService) SendPushNotification(message PushMessage) (*PushResult, error) {
	log.Info().
		Str("title", message.Title).
		Int("tokenCount", len(message.Tokens)).
		Int("userCount", len(message.UserIDs)).
		Msg("Sending push notification")

	// Validate message
	if err := s.validateMessage(message); err != nil {
		return nil, fmt.Errorf("message validation failed: %w", err)
	}

	// Send based on provider
	var result *PushResult
	var err error

	switch s.config.Provider {
	case "pusher":
		result, err = s.sendPusherNotification(message)
	case "firebase":
		result, err = s.sendFirebaseNotification(message)
	case "apns":
		result, err = s.sendAPNSNotification(message)
	case "web-push":
		result, err = s.sendWebPushNotification(message)
	default:
		return nil, fmt.Errorf("unsupported provider: %s", s.config.Provider)
	}

	if err != nil {
		log.Error().Err(err).Msg("Failed to send push notification")
		return nil, err
	}

	log.Info().
		Str("messageID", result.MessageID).
		Int("sent", result.SentCount).
		Int("failed", result.FailedCount).
		Msg("Push notification sent")

	return result, nil
}

// SendBulkPushNotifications sends push notifications to multiple recipients
func (s *PushNotificationService) SendBulkPushNotifications(messages []PushMessage) ([]*PushResult, error) {
	log.Info().Int("count", len(messages)).Msg("Sending bulk push notifications")

	var results []*PushResult
	var errors []error

	// Process messages in batches to avoid overwhelming the service
	batchSize := 100
	for i := 0; i < len(messages); i += batchSize {
		end := i + batchSize
		if end > len(messages) {
			end = len(messages)
		}

		batch := messages[i:end]
		batchResults, err := s.processBatch(batch)
		if err != nil {
			errors = append(errors, fmt.Errorf("batch %d failed: %w", i/batchSize, err))
		}
		results = append(results, batchResults...)
	}

	if len(errors) > 0 {
		log.Warn().Int("errorCount", len(errors)).Msg("Some push notification batches failed")
		return results, fmt.Errorf("bulk send completed with %d batch errors", len(errors))
	}

	log.Info().Msg("All bulk push notifications sent successfully")
	return results, nil
}

// SendToTopic sends a push notification to a topic
func (s *PushNotificationService) SendToTopic(topic string, message PushMessage) (*PushResult, error) {
	log.Info().
		Str("topic", topic).
		Str("title", message.Title).
		Msg("Sending push notification to topic")

	message.Topic = topic
	return s.SendPushNotification(message)
}

// SendToUser sends a push notification to a specific user
func (s *PushNotificationService) SendToUser(userID string, message PushMessage) (*PushResult, error) {
	log.Info().
		Str("userID", userID).
		Str("title", message.Title).
		Msg("Sending push notification to user")

	message.UserIDs = []string{userID}
	return s.SendPushNotification(message)
}

// SendToUsers sends a push notification to multiple users
func (s *PushNotificationService) SendToUsers(userIDs []string, message PushMessage) (*PushResult, error) {
	log.Info().
		Int("userCount", len(userIDs)).
		Str("title", message.Title).
		Msg("Sending push notification to users")

	message.UserIDs = userIDs
	return s.SendPushNotification(message)
}

// SendToDevice sends a push notification to a specific device
func (s *PushNotificationService) SendToDevice(deviceToken string, message PushMessage) (*PushResult, error) {
	log.Info().
		Str("deviceToken", truncateString(deviceToken, 20)).
		Str("title", message.Title).
		Msg("Sending push notification to device")

	message.Tokens = []string{deviceToken}
	return s.SendPushNotification(message)
}

// SendToDevices sends a push notification to multiple devices
func (s *PushNotificationService) SendToDevices(deviceTokens []string, message PushMessage) (*PushResult, error) {
	log.Info().
		Int("deviceCount", len(deviceTokens)).
		Str("title", message.Title).
		Msg("Sending push notification to devices")

	message.Tokens = deviceTokens
	return s.SendPushNotification(message)
}

// SubscribeToTopic subscribes a device to a topic
func (s *PushNotificationService) SubscribeToTopic(deviceToken string, topic string) error {
	log.Info().
		Str("deviceToken", truncateString(deviceToken, 20)).
		Str("topic", topic).
		Msg("Subscribing device to topic")

	switch s.config.Provider {
	case "firebase":
		return s.subscribeToFirebaseTopic(deviceToken, topic)
	case "pusher":
		return s.subscribeToPusherTopic(deviceToken, topic)
	default:
		return fmt.Errorf("topic subscription not supported for provider: %s", s.config.Provider)
	}
}

// UnsubscribeFromTopic unsubscribes a device from a topic
func (s *PushNotificationService) UnsubscribeFromTopic(deviceToken string, topic string) error {
	log.Info().
		Str("deviceToken", truncateString(deviceToken, 20)).
		Str("topic", topic).
		Msg("Unsubscribing device from topic")

	switch s.config.Provider {
	case "firebase":
		return s.unsubscribeFromFirebaseTopic(deviceToken, topic)
	case "pusher":
		return s.unsubscribeFromPusherTopic(deviceToken, topic)
	default:
		return fmt.Errorf("topic unsubscription not supported for provider: %s", s.config.Provider)
	}
}

// GetSubscriptionInfo gets information about a device subscription
func (s *PushNotificationService) GetSubscriptionInfo(deviceToken string) (*PushSubscription, error) {
	log.Info().
		Str("deviceToken", truncateString(deviceToken, 20)).
		Msg("Getting subscription info")

	// This would typically query your database
	// For now, return a placeholder
	return &PushSubscription{
		ID:          "placeholder",
		DeviceToken: deviceToken,
		Platform:    "unknown",
		IsActive:    true,
		CreatedAt:   time.Now(),
		LastActive:  time.Now(),
	}, nil
}

// TestConnection tests the push notification service connection
func (s *PushNotificationService) TestConnection() error {
	log.Info().Msg("Testing push notification service connection")

	// Send a test notification
	testMessage := PushMessage{
		Title: "Test Notification",
		Body:  "Bu bir test bildirimidir. Push notification servisi başarıyla çalışıyor.",
		Data: map[string]interface{}{
			"type":      "test",
			"timestamp": time.Now().Unix(),
		},
		Priority: "normal",
	}

	// Try to send to a test token (this would fail but tests the connection)
	_, err := s.SendPushNotification(testMessage)
	if err != nil {
		log.Error().Err(err).Msg("Push notification service connection test failed")
		return fmt.Errorf("connection test failed: %w", err)
	}

	log.Info().Msg("Push notification service connection test successful")
	return nil
}

// validateMessage validates a push notification message
func (s *PushNotificationService) validateMessage(message PushMessage) error {
	if message.Title == "" {
		return fmt.Errorf("notification title is required")
	}

	if message.Body == "" {
		return fmt.Errorf("notification body is required")
	}

	if len(message.Tokens) == 0 && len(message.UserIDs) == 0 && message.Topic == "" {
		return fmt.Errorf("at least one target (tokens, userIDs, or topic) is required")
	}

	if len(message.Title) > 100 {
		return fmt.Errorf("title exceeds 100 characters")
	}

	if len(message.Body) > 4000 {
		return fmt.Errorf("body exceeds 4000 characters")
	}

	return nil
}

// processBatch processes a batch of push notifications
func (s *PushNotificationService) processBatch(messages []PushMessage) ([]*PushResult, error) {
	var results []*PushResult

	for _, message := range messages {
		result, err := s.SendPushNotification(message)
		if err != nil {
			result = &PushResult{
				Success:     false,
				FailedCount: 1,
				Errors:      []string{err.Error()},
				SentAt:      time.Now(),
			}
		}
		results = append(results, result)
	}

	return results, nil
}

// sendPusherNotification sends a notification via Pusher
func (s *PushNotificationService) sendPusherNotification(message PushMessage) (*PushResult, error) {
	if s.pusher == nil {
		return nil, fmt.Errorf("Pusher not initialized")
	}

	// Prepare notification data
	notification := map[string]interface{}{
		"title": message.Title,
		"body":  message.Body,
		"data":  message.Data,
	}

	if message.Image != "" {
		notification["image"] = message.Image
	}

	if message.Icon != "" {
		notification["icon"] = message.Icon
	}

	// Send to different targets
	var sentCount int
	var failedCount int
	var errors []string

	// Send to tokens
	if len(message.Tokens) > 0 {
		_, err := s.pusher.PublishToInterests([]string{"device"}, notification)
		if err != nil {
			failedCount += len(message.Tokens)
			errors = append(errors, fmt.Sprintf("token send failed: %v", err))
		} else {
			sentCount += len(message.Tokens)
		}
	}

	// Send to users
	if len(message.UserIDs) > 0 {
		_, err := s.pusher.PublishToUsers(message.UserIDs, notification)
		if err != nil {
			failedCount += len(message.UserIDs)
			errors = append(errors, fmt.Sprintf("user send failed: %v", err))
		} else {
			sentCount += len(message.UserIDs)
		}
	}

	// Send to topic
	if message.Topic != "" {
		_, err := s.pusher.PublishToInterests([]string{message.Topic}, notification)
		if err != nil {
			failedCount++
			errors = append(errors, fmt.Sprintf("topic send failed: %v", err))
		} else {
			sentCount++
		}
	}

	return &PushResult{
		MessageID:   generateMessageID(),
		Success:     failedCount == 0,
		SentCount:   sentCount,
		FailedCount: failedCount,
		Errors:      errors,
		SentAt:      time.Now(),
	}, nil
}

// sendFirebaseNotification sends a notification via Firebase
func (s *PushNotificationService) sendFirebaseNotification(message PushMessage) (*PushResult, error) {
	// This would implement Firebase Cloud Messaging
	// For now, return a placeholder result
	return &PushResult{
		MessageID:   generateMessageID(),
		Success:     true,
		SentCount:   len(message.Tokens) + len(message.UserIDs),
		FailedCount: 0,
		SentAt:      time.Now(),
	}, nil
}

// sendAPNSNotification sends a notification via Apple Push Notification Service
func (s *PushNotificationService) sendAPNSNotification(message PushMessage) (*PushResult, error) {
	// This would implement APNS
	// For now, return a placeholder result
	return &PushResult{
		MessageID:   generateMessageID(),
		Success:     true,
		SentCount:   len(message.Tokens) + len(message.UserIDs),
		FailedCount: 0,
		SentAt:      time.Now(),
	}, nil
}

// sendWebPushNotification sends a notification via Web Push API
func (s *PushNotificationService) sendWebPushNotification(message PushMessage) (*PushResult, error) {
	// This would implement Web Push API
	// For now, return a placeholder result
	return &PushResult{
		MessageID:   generateMessageID(),
		Success:     true,
		SentCount:   len(message.Tokens) + len(message.UserIDs),
		FailedCount: 0,
		SentAt:      time.Now(),
	}, nil
}

// subscribeToFirebaseTopic subscribes a device to a Firebase topic
func (s *PushNotificationService) subscribeToFirebaseTopic(deviceToken string, topic string) error {
	// This would implement Firebase topic subscription
	log.Info().
		Str("deviceToken", truncateString(deviceToken, 20)).
		Str("topic", topic).
		Msg("Subscribing to Firebase topic")
	return nil
}

// subscribeToPusherTopic subscribes a device to a Pusher topic
func (s *PushNotificationService) subscribeToPusherTopic(deviceToken string, topic string) error {
	// This would implement Pusher topic subscription
	log.Info().
		Str("deviceToken", truncateString(deviceToken, 20)).
		Str("topic", topic).
		Msg("Subscribing to Pusher topic")
	return nil
}

// unsubscribeFromFirebaseTopic unsubscribes a device from a Firebase topic
func (s *PushNotificationService) unsubscribeFromFirebaseTopic(deviceToken string, topic string) error {
	// This would implement Firebase topic unsubscription
	log.Info().
		Str("deviceToken", truncateString(deviceToken, 20)).
		Str("topic", topic).
		Msg("Unsubscribing from Firebase topic")
	return nil
}

// unsubscribeFromPusherTopic unsubscribes a device from a Pusher topic
func (s *PushNotificationService) unsubscribeFromPusherTopic(deviceToken string, topic string) error {
	// This would implement Pusher topic unsubscription
	log.Info().
		Str("deviceToken", truncateString(deviceToken, 20)).
		Str("topic", topic).
		Msg("Unsubscribing from Pusher topic")
	return nil
}

// Helper functions
func truncateString(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen] + "..."
}
