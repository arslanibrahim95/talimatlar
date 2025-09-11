package services

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"github.com/go-redis/redis/v8"
	"github.com/rs/zerolog/log"
)

// NotificationService handles all notification operations
type NotificationService struct {
	emailService    *EmailService
	smsService      *SMSService
	pushService     *PushNotificationService
	inAppService    *InAppNotificationService
	webhookService  *WebhookService
	templateService *TemplateService
	redis           *redis.Client
	config          NotificationConfig
	mu              sync.RWMutex
}

// NotificationConfig holds notification service configuration
type NotificationConfig struct {
	RedisURL       string
	RedisPassword  string
	RedisDB        int
	EmailConfig    EmailConfig
	SMSConfig      SMSConfig
	PushConfig     PushConfig
	InAppConfig    InAppConfig
	WebhookConfig  WebhookConfig
	TemplateConfig TemplateConfig
	MaxRetries     int
	RetryDelay     time.Duration
	BatchSize      int
	QueueSize      int
	WorkerCount    int
}

// NotificationRequest represents a notification request
type NotificationRequest struct {
	ID           string                 `json:"id"`
	Type         string                 `json:"type"` // email, sms, push, inapp, webhook, all
	Recipients   []string               `json:"recipients"`
	TemplateID   string                 `json:"template_id"`
	TemplateData map[string]interface{} `json:"template_data"`
	Subject      string                 `json:"subject"`
	Title        string                 `json:"title"`
	Message      string                 `json:"message"`
	HTMLBody     string                 `json:"html_body"`
	TextBody     string                 `json:"text_body"`
	Priority     string                 `json:"priority"`
	Category     string                 `json:"category"`
	TenantID     string                 `json:"tenant_id"`
	UserID       string                 `json:"user_id"`
	Metadata     map[string]interface{} `json:"metadata"`
	ScheduleAt   *time.Time             `json:"schedule_at,omitempty"`
	ExpiresAt    *time.Time             `json:"expires_at,omitempty"`
	CreatedAt    time.Time              `json:"created_at"`
}

// NotificationResult represents the result of sending a notification
type NotificationResult struct {
	ID          string                 `json:"id"`
	RequestID   string                 `json:"request_id"`
	Type        string                 `json:"type"`
	Recipient   string                 `json:"recipient"`
	Status      string                 `json:"status"` // pending, sent, failed, cancelled
	MessageID   string                 `json:"message_id,omitempty"`
	Error       string                 `json:"error,omitempty"`
	SentAt      *time.Time             `json:"sent_at,omitempty"`
	Attempts    int                    `json:"attempts"`
	MaxAttempts int                    `json:"max_attempts"`
	Metadata    map[string]interface{} `json:"metadata"`
}

// NotificationStats represents notification statistics
type NotificationStats struct {
	Total       int            `json:"total"`
	Sent        int            `json:"sent"`
	Failed      int            `json:"failed"`
	Pending     int            `json:"pending"`
	ByType      map[string]int `json:"by_type"`
	ByCategory  map[string]int `json:"by_category"`
	ByPriority  map[string]int `json:"by_priority"`
	ByDate      map[string]int `json:"by_date"`
	SuccessRate float64        `json:"success_rate"`
	AverageTime float64        `json:"average_time"`
}

// NewNotificationService creates a new notification service instance
func NewNotificationService(config NotificationConfig) (*NotificationService, error) {
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

	// Initialize sub-services
	emailService := NewEmailService(config.EmailConfig)

	smsService := NewSMSService(config.SMSConfig)

	pushService, err := NewPushNotificationService(config.PushConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to create push service: %w", err)
	}

	inAppService, err := NewInAppNotificationService(config.InAppConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to create in-app service: %w", err)
	}

	webhookService, err := NewWebhookService(config.WebhookConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to create webhook service: %w", err)
	}

	templateService, err := NewTemplateService(config.TemplateConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to create template service: %w", err)
	}

	// Set default values
	if config.MaxRetries == 0 {
		config.MaxRetries = 3
	}
	if config.RetryDelay == 0 {
		config.RetryDelay = 5 * time.Second
	}
	if config.BatchSize == 0 {
		config.BatchSize = 100
	}
	if config.QueueSize == 0 {
		config.QueueSize = 1000
	}
	if config.WorkerCount == 0 {
		config.WorkerCount = 5
	}

	service := &NotificationService{
		emailService:    emailService,
		smsService:      smsService,
		pushService:     pushService,
		inAppService:    inAppService,
		webhookService:  webhookService,
		templateService: templateService,
		redis:           redisClient,
		config:          config,
	}

	// Start background workers
	go service.startWorkers()

	return service, nil
}

// SendNotification sends a single notification
func (s *NotificationService) SendNotification(request NotificationRequest) (*NotificationResult, error) {
	log.Info().
		Str("requestID", request.ID).
		Str("type", request.Type).
		Int("recipientCount", len(request.Recipients)).
		Msg("Sending notification")

	// Validate request
	if err := s.validateRequest(request); err != nil {
		return nil, fmt.Errorf("request validation failed: %w", err)
	}

	// Set default values
	if request.ID == "" {
		request.ID = generateNotificationID()
	}
	if request.CreatedAt.IsZero() {
		request.CreatedAt = time.Now()
	}
	if request.Priority == "" {
		request.Priority = "normal"
	}

	// Store request
	if err := s.storeRequest(request); err != nil {
		return nil, fmt.Errorf("failed to store request: %w", err)
	}

	// Process notification based on type
	switch request.Type {
	case "email":
		return s.sendEmailNotification(request)
	case "sms":
		return s.sendSMSNotification(request)
	case "push":
		return s.sendPushNotification(request)
	case "inapp":
		return s.sendInAppNotification(request)
	case "webhook":
		return s.sendWebhookNotification(request)
	case "all":
		return s.sendAllNotifications(request)
	default:
		return nil, fmt.Errorf("unsupported notification type: %s", request.Type)
	}
}

// SendBulkNotifications sends notifications to multiple recipients
func (s *NotificationService) SendBulkNotifications(requests []NotificationRequest) ([]*NotificationResult, error) {
	log.Info().Int("count", len(requests)).Msg("Sending bulk notifications")

	var results []*NotificationResult
	var errors []error

	// Process requests in batches
	batchSize := s.config.BatchSize
	for i := 0; i < len(requests); i += batchSize {
		end := i + batchSize
		if end > len(requests) {
			end = len(requests)
		}

		batch := requests[i:end]
		batchResults, err := s.processBatch(batch)
		if err != nil {
			errors = append(errors, fmt.Errorf("batch %d failed: %w", i/batchSize, err))
		}
		results = append(results, batchResults...)
	}

	if len(errors) > 0 {
		log.Warn().Int("errorCount", len(errors)).Msg("Some notification batches failed")
		return results, fmt.Errorf("bulk send completed with %d batch errors", len(errors))
	}

	log.Info().Msg("All bulk notifications sent successfully")
	return results, nil
}

// SendTemplateNotification sends a notification using a template
func (s *NotificationService) SendTemplateNotification(
	templateID string,
	recipients []string,
	data map[string]interface{},
	notificationType string,
) ([]*NotificationResult, error) {
	log.Info().
		Str("templateID", templateID).
		Str("type", notificationType).
		Int("recipientCount", len(recipients)).
		Msg("Sending template notification")

	// Get template
	template, err := s.templateService.GetTemplate(templateID)
	if err != nil {
		return nil, fmt.Errorf("failed to get template: %w", err)
	}

	// Render template
	renderResult, err := s.templateService.RenderTemplate(templateID, data)
	if err != nil {
		return nil, fmt.Errorf("failed to render template: %w", err)
	}

	// Create notification requests
	var requests []NotificationRequest
	for _, recipient := range recipients {
		request := NotificationRequest{
			ID:           generateNotificationID(),
			Type:         notificationType,
			Recipients:   []string{recipient},
			TemplateID:   templateID,
			TemplateData: data,
			Subject:      renderResult.Subject,
			Title:        renderResult.Title,
			Message:      renderResult.Message,
			HTMLBody:     renderResult.HTMLBody,
			TextBody:     renderResult.TextBody,
			Priority:     template.Priority,
			Category:     template.Category,
			CreatedAt:    time.Now(),
		}
		requests = append(requests, request)
	}

	// Send notifications
	return s.SendBulkNotifications(requests)
}

// GetNotificationStatus gets the status of a notification
func (s *NotificationService) GetNotificationStatus(notificationID string) (*NotificationResult, error) {
	ctx := context.Background()
	key := s.getResultKey(notificationID)

	resultJSON, err := s.redis.Get(ctx, key).Result()
	if err != nil {
		if err == redis.Nil {
			return nil, fmt.Errorf("notification not found: %s", notificationID)
		}
		return nil, fmt.Errorf("failed to get notification: %w", err)
	}

	var result NotificationResult
	if err := json.Unmarshal([]byte(resultJSON), &result); err != nil {
		return nil, fmt.Errorf("failed to unmarshal result: %w", err)
	}

	return &result, nil
}

// GetNotificationStats gets notification statistics
func (s *NotificationService) GetNotificationStats(tenantID string, days int) (*NotificationStats, error) {
	log.Info().
		Str("tenantID", tenantID).
		Int("days", days).
		Msg("Getting notification statistics")

	ctx := context.Background()
	statsKey := s.getStatsKey(tenantID, days)

	// Try to get cached stats
	statsJSON, err := s.redis.Get(ctx, statsKey).Result()
	if err == nil {
		var stats NotificationStats
		if err := json.Unmarshal([]byte(statsJSON), &stats); err == nil {
			return &stats, nil
		}
	}

	// Calculate stats
	stats, err := s.calculateStats(tenantID, days)
	if err != nil {
		return nil, fmt.Errorf("failed to calculate stats: %w", err)
	}

	// Cache stats for 1 hour
	statsJSON, _ := json.Marshal(stats)
	s.redis.Set(ctx, statsKey, string(statsJSON), 1*time.Hour)

	return stats, nil
}

// CancelNotification cancels a pending notification
func (s *NotificationService) CancelNotification(notificationID string) error {
	log.Info().
		Str("notificationID", notificationID).
		Msg("Cancelling notification")

	result, err := s.GetNotificationStatus(notificationID)
	if err != nil {
		return fmt.Errorf("failed to get notification: %w", err)
	}

	if result.Status != "pending" {
		return fmt.Errorf("cannot cancel notification with status: %s", result.Status)
	}

	// Update status
	result.Status = "cancelled"
	result.Metadata["cancelled_at"] = time.Now()

	// Store updated result
	ctx := context.Background()
	key := s.getResultKey(notificationID)

	resultJSON, err := json.Marshal(result)
	if err != nil {
		return fmt.Errorf("failed to marshal result: %w", err)
	}

	if err := s.redis.Set(ctx, key, resultJSON, 0).Err(); err != nil {
		return fmt.Errorf("failed to update result: %w", err)
	}

	log.Info().
		Str("notificationID", notificationID).
		Msg("Notification cancelled")

	return nil
}

// RetryFailedNotification retries a failed notification
func (s *NotificationService) RetryFailedNotification(notificationID string) error {
	log.Info().
		Str("notificationID", notificationID).
		Msg("Retrying failed notification")

	result, err := s.GetNotificationStatus(notificationID)
	if err != nil {
		return fmt.Errorf("failed to get notification: %w", err)
	}

	if result.Status != "failed" {
		return fmt.Errorf("cannot retry notification with status: %s", result.Status)
	}

	if result.Attempts >= result.MaxAttempts {
		return fmt.Errorf("max retry attempts reached")
	}

	// Get original request
	request, err := s.getRequest(result.RequestID)
	if err != nil {
		return fmt.Errorf("failed to get original request: %w", err)
	}

	// Reset result
	result.Status = "pending"
	result.Attempts = 0
	result.Error = ""
	result.SentAt = nil

	// Store updated result
	ctx := context.Background()
	key := s.getResultKey(notificationID)

	resultJSON, err := json.Marshal(result)
	if err != nil {
		return fmt.Errorf("failed to marshal result: %w", err)
	}

	if err := s.redis.Set(ctx, key, resultJSON, 0).Err(); err != nil {
		return fmt.Errorf("failed to update result: %w", err)
	}

	// Re-queue for processing
	if err := s.queueNotification(request, result); err != nil {
		return fmt.Errorf("failed to re-queue notification: %w", err)
	}

	log.Info().
		Str("notificationID", notificationID).
		Msg("Failed notification queued for retry")

	return nil
}

// TestConnection tests all notification service connections
func (s *NotificationService) TestConnection() error {
	log.Info().Msg("Testing notification service connections")

	// Test Redis
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := s.redis.Ping(ctx).Err(); err != nil {
		return fmt.Errorf("Redis connection failed: %w", err)
	}

	// Test sub-services
	if err := s.emailService.TestConnection(); err != nil {
		return fmt.Errorf("Email service connection failed: %w", err)
	}

	if err := s.smsService.TestConnection(); err != nil {
		return fmt.Errorf("SMS service connection failed: %w", err)
	}

	if err := s.pushService.TestConnection(); err != nil {
		return fmt.Errorf("Push service connection failed: %w", err)
	}

	if err := s.inAppService.TestConnection(); err != nil {
		return fmt.Errorf("In-app service connection failed: %w", err)
	}

	if err := s.webhookService.TestConnection(); err != nil {
		return fmt.Errorf("Webhook service connection failed: %w", err)
	}

	if err := s.templateService.TestConnection(); err != nil {
		return fmt.Errorf("Template service connection failed: %w", err)
	}

	log.Info().Msg("All notification service connections successful")
	return nil
}

// sendEmailNotification sends an email notification
func (s *NotificationService) sendEmailNotification(request NotificationRequest) (*NotificationResult, error) {
	if len(request.Recipients) == 0 {
		return nil, fmt.Errorf("no recipients specified")
	}

	// Create email message
	emailMessage := EmailMessage{
		To:       request.Recipients,
		Subject:  request.Subject,
		Body:     request.TextBody,
		HTMLBody: request.HTMLBody,
		Priority: request.Priority,
	}

	// Send email
	emailResult, err := s.emailService.SendEmail(emailMessage)
	if err != nil {
		return s.createFailedResult(request, "email", request.Recipients[0], err.Error())
	}

	return s.createSuccessResult(request, "email", request.Recipients[0], emailResult.MessageID), nil
}

// sendSMSNotification sends an SMS notification
func (s *NotificationService) sendSMSNotification(request NotificationRequest) (*NotificationResult, error) {
	if len(request.Recipients) == 0 {
		return nil, fmt.Errorf("no recipients specified")
	}

	// Create SMS message
	smsMessage := SMSMessage{
		To:       request.Recipients[0],
		Body:     request.Message,
		Priority: request.Priority,
	}

	// Send SMS
	smsResult, err := s.smsService.SendSMS(smsMessage)
	if err != nil {
		return s.createFailedResult(request, "sms", request.Recipients[0], err.Error())
	}

	return s.createSuccessResult(request, "sms", request.Recipients[0], smsResult.MessageID), nil
}

// sendPushNotification sends a push notification
func (s *NotificationService) sendPushNotification(request NotificationRequest) (*NotificationResult, error) {
	if len(request.Recipients) == 0 {
		return nil, fmt.Errorf("no recipients specified")
	}

	// Create push message
	pushMessage := PushMessage{
		Title:    request.Title,
		Body:     request.Message,
		Data:     request.TemplateData,
		Priority: request.Priority,
		Tokens:   request.Recipients,
	}

	// Send push notification
	pushResult, err := s.pushService.SendPushNotification(pushMessage)
	if err != nil {
		return s.createFailedResult(request, "push", request.Recipients[0], err.Error())
	}

	return s.createSuccessResult(request, "push", request.Recipients[0], pushResult.MessageID), nil
}

// sendInAppNotification sends an in-app notification
func (s *NotificationService) sendInAppNotification(request NotificationRequest) (*NotificationResult, error) {
	if len(request.Recipients) == 0 {
		return nil, fmt.Errorf("no recipients specified")
	}

	// Create in-app notification
	inAppNotification := InAppNotification{
		UserID:    request.Recipients[0],
		TenantID:  request.TenantID,
		Type:      request.Category,
		Title:     request.Title,
		Message:   request.Message,
		Data:      request.TemplateData,
		Priority:  request.Priority,
		Category:  request.Category,
		CreatedAt: time.Now(),
	}

	// Send in-app notification
	_, err := s.inAppService.CreateNotification(inAppNotification)
	if err != nil {
		return s.createFailedResult(request, "inapp", request.Recipients[0], err.Error())
	}

	return s.createSuccessResult(request, "inapp", request.Recipients[0], ""), nil
}

// sendWebhookNotification sends a webhook notification
func (s *NotificationService) sendWebhookNotification(request NotificationRequest) (*NotificationResult, error) {
	// Create webhook event
	webhookEvent := WebhookEvent{
		ID:        generateWebhookID(),
		Type:      request.Category,
		Source:    "notification-service",
		Data:      request.TemplateData,
		Timestamp: time.Now(),
		UserID:    request.UserID,
		TenantID:  request.TenantID,
		Priority:  request.Priority,
		CreatedAt: time.Now(),
	}

	// Trigger webhook
	err := s.webhookService.TriggerWebhook(webhookEvent)
	if err != nil {
		return s.createFailedResult(request, "webhook", "webhook", err.Error())
	}

	return s.createSuccessResult(request, "webhook", "webhook", webhookEvent.ID), nil
}

// sendAllNotifications sends notifications to all channels
func (s *NotificationService) sendAllNotifications(request NotificationRequest) (*NotificationResult, error) {
	// This would send to all available channels
	// For now, just send email
	return s.sendEmailNotification(request)
}

// processBatch processes a batch of notification requests
func (s *NotificationService) processBatch(requests []NotificationRequest) ([]*NotificationResult, error) {
	var results []*NotificationResult

	for _, request := range requests {
		result, err := s.SendNotification(request)
		if err != nil {
			result = &NotificationResult{
				ID:          generateNotificationID(),
				RequestID:   request.ID,
				Type:        request.Type,
				Status:      "failed",
				Error:       err.Error(),
				Attempts:    1,
				MaxAttempts: s.config.MaxRetries,
			}
		}
		results = append(results, result)
	}

	return results, nil
}

// startWorkers starts background workers for processing notifications
func (s *NotificationService) startWorkers() {
	log.Info().Int("workerCount", s.config.WorkerCount).Msg("Starting notification workers")

	for i := 0; i < s.config.WorkerCount; i++ {
		go s.worker(i)
	}
}

// worker processes notifications from the queue
func (s *NotificationService) worker(id int) {
	log.Info().Int("workerID", id).Msg("Notification worker started")

	for {
		// Process queued notifications
		s.processQueuedNotifications()

		// Sleep before next iteration
		time.Sleep(1 * time.Second)
	}
}

// processQueuedNotifications processes notifications from the queue
func (s *NotificationService) processQueuedNotifications() {
	ctx := context.Background()
	queueKey := s.getQueueKey()

	// Get next notification from queue
	result, err := s.redis.ZRangeWithScores(ctx, queueKey, 0, 0).Result()
	if err != nil || len(result) == 0 {
		return
	}

	// Get notification data
	notificationData := result[0].Member.(string)
	score := result[0].Score

	// Check if it's time to process
	if score > float64(time.Now().Unix()) {
		return
	}

	// Remove from queue
	s.redis.ZRem(ctx, queueKey, notificationData)

	// Parse notification data
	var notification struct {
		RequestID string `json:"request_id"`
		ResultID  string `json:"result_id"`
	}

	if err := json.Unmarshal([]byte(notificationData), &notification); err != nil {
		log.Error().Err(err).Msg("Failed to parse queued notification")
		return
	}

	// Get request and result
	request, err := s.getRequest(notification.RequestID)
	if err != nil {
		log.Error().Err(err).Msg("Failed to get queued request")
		return
	}

	result, err := s.GetNotificationStatus(notification.ResultID)
	if err != nil {
		log.Error().Err(err).Msg("Failed to get queued result")
		return
	}

	// Process notification
	s.processNotification(*request, result)
}

// processNotification processes a single notification
func (s *NotificationService) processNotification(request NotificationRequest, result *NotificationResult) {
	log.Info().
		Str("requestID", request.ID).
		Str("resultID", result.ID).
		Str("type", request.Type).
		Msg("Processing notification")

	// Increment attempt count
	result.Attempts++

	// Send notification based on type
	var err error
	switch request.Type {
	case "email":
		_, err = s.sendEmailNotification(request)
	case "sms":
		_, err = s.sendSMSNotification(request)
	case "push":
		_, err = s.sendPushNotification(request)
	case "inapp":
		_, err = s.sendInAppNotification(request)
	case "webhook":
		_, err = s.sendWebhookNotification(request)
	default:
		err = fmt.Errorf("unsupported notification type: %s", request.Type)
	}

	// Update result
	if err != nil {
		result.Status = "failed"
		result.Error = err.Error()
	} else {
		result.Status = "sent"
		now := time.Now()
		result.SentAt = &now
	}

	// Store updated result
	s.storeResult(*result)

	// Retry if failed and attempts remaining
	if result.Status == "failed" && result.Attempts < result.MaxAttempts {
		s.scheduleRetry(request, result)
	}
}

// scheduleRetry schedules a notification for retry
func (s *NotificationService) scheduleRetry(request NotificationRequest, result *NotificationResult) {
	retryDelay := s.config.RetryDelay * time.Duration(result.Attempts)
	retryTime := time.Now().Add(retryDelay)

	// Queue for retry
	s.queueNotification(request, result)
}

// validateRequest validates a notification request
func (s *NotificationService) validateRequest(request NotificationRequest) error {
	if request.Type == "" {
		return fmt.Errorf("notification type is required")
	}

	if len(request.Recipients) == 0 && request.Type != "webhook" {
		return fmt.Errorf("at least one recipient is required")
	}

	if request.Message == "" && request.TemplateID == "" {
		return fmt.Errorf("message or template ID is required")
	}

	return nil
}

// storeRequest stores a notification request
func (s *NotificationService) storeRequest(request NotificationRequest) error {
	ctx := context.Background()
	key := s.getRequestKey(request.ID)

	requestJSON, err := json.Marshal(request)
	if err != nil {
		return fmt.Errorf("failed to marshal request: %w", err)
	}

	return s.redis.Set(ctx, key, requestJSON, 24*time.Hour).Err()
}

// getRequest gets a notification request by ID
func (s *NotificationService) getRequest(requestID string) (*NotificationRequest, error) {
	ctx := context.Background()
	key := s.getRequestKey(requestID)

	requestJSON, err := s.redis.Get(ctx, key).Result()
	if err != nil {
		if err == redis.Nil {
			return nil, fmt.Errorf("request not found: %s", requestID)
		}
		return nil, fmt.Errorf("failed to get request: %w", err)
	}

	var request NotificationRequest
	if err := json.Unmarshal([]byte(requestJSON), &request); err != nil {
		return nil, fmt.Errorf("failed to unmarshal request: %w", err)
	}

	return &request, nil
}

// storeResult stores a notification result
func (s *NotificationService) storeResult(result NotificationResult) error {
	ctx := context.Background()
	key := s.getResultKey(result.ID)

	resultJSON, err := json.Marshal(result)
	if err != nil {
		return fmt.Errorf("failed to marshal result: %w", err)
	}

	return s.redis.Set(ctx, key, resultJSON, 7*24*time.Hour).Err()
}

// queueNotification queues a notification for processing
func (s *NotificationService) queueNotification(request NotificationRequest, result *NotificationResult) error {
	ctx := context.Background()
	queueKey := s.getQueueKey()

	// Create queue data
	queueData := map[string]string{
		"request_id": request.ID,
		"result_id":  result.ID,
	}

	queueJSON, err := json.Marshal(queueData)
	if err != nil {
		return fmt.Errorf("failed to marshal queue data: %w", err)
	}

	// Add to queue with score (timestamp)
	score := float64(time.Now().Unix())
	return s.redis.ZAdd(ctx, queueKey, &redis.Z{
		Score:  score,
		Member: string(queueJSON),
	}).Err()
}

// calculateStats calculates notification statistics
func (s *NotificationService) calculateStats(tenantID string, days int) (*NotificationStats, error) {
	// This is a simplified implementation
	// In production, you'd query a proper database
	stats := &NotificationStats{
		Total:       0,
		Sent:        0,
		Failed:      0,
		Pending:     0,
		ByType:      make(map[string]int),
		ByCategory:  make(map[string]int),
		ByPriority:  make(map[string]int),
		ByDate:      make(map[string]int),
		SuccessRate: 0.0,
		AverageTime: 0.0,
	}

	return stats, nil
}

// createSuccessResult creates a successful notification result
func (s *NotificationService) createSuccessResult(
	request NotificationRequest,
	notificationType string,
	recipient string,
	messageID string,
) *NotificationResult {
	now := time.Now()
	return &NotificationResult{
		ID:          generateNotificationID(),
		RequestID:   request.ID,
		Type:        notificationType,
		Recipient:   recipient,
		Status:      "sent",
		MessageID:   messageID,
		SentAt:      &now,
		Attempts:    1,
		MaxAttempts: s.config.MaxRetries,
		Metadata:    request.Metadata,
	}
}

// createFailedResult creates a failed notification result
func (s *NotificationService) createFailedResult(
	request NotificationRequest,
	notificationType string,
	recipient string,
	errorMsg string,
) *NotificationResult {
	return &NotificationResult{
		ID:          generateNotificationID(),
		RequestID:   request.ID,
		Type:        notificationType,
		Recipient:   recipient,
		Status:      "failed",
		Error:       errorMsg,
		Attempts:    1,
		MaxAttempts: s.config.MaxRetries,
		Metadata:    request.Metadata,
	}
}

// Redis key generators
func (s *NotificationService) getRequestKey(requestID string) string {
	return fmt.Sprintf("notification_request:%s", requestID)
}

func (s *NotificationService) getResultKey(resultID string) string {
	return fmt.Sprintf("notification_result:%s", resultID)
}

func (s *NotificationService) getQueueKey() string {
	return "notification_queue"
}

func (s *NotificationService) getStatsKey(tenantID string, days int) string {
	return fmt.Sprintf("notification_stats:%s:%d", tenantID, days)
}

// Helper functions
func generateWebhookID() string {
	return fmt.Sprintf("webhook_%d", time.Now().UnixNano())
}
