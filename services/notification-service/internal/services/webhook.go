package services

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/go-redis/redis/v8"
	"github.com/rs/zerolog/log"
)

// WebhookService handles webhook notifications
type WebhookService struct {
	redis  *redis.Client
	config WebhookConfig
	client *http.Client
}

// WebhookConfig holds webhook service configuration
type WebhookConfig struct {
	RedisURL      string
	RedisPassword string
	RedisDB       int
	MaxRetries    int
	RetryDelay    time.Duration
	Timeout       time.Duration
	MaxPayload    int64
	SecretKey     string
}

// WebhookEndpoint represents a webhook endpoint
type WebhookEndpoint struct {
	ID          string                 `json:"id"`
	Name        string                 `json:"name"`
	URL         string                 `json:"url"`
	Method      string                 `json:"method"` // GET, POST, PUT, PATCH
	Headers     map[string]string      `json:"headers"`
	Events      []string               `json:"events"` // Event types to trigger webhook
	Secret      string                 `json:"secret"` // Secret for signature verification
	IsActive    bool                   `json:"is_active"`
	RetryCount  int                    `json:"retry_count"`
	Timeout     time.Duration          `json:"timeout"`
	CreatedAt   time.Time              `json:"created_at"`
	UpdatedAt   time.Time              `json:"updated_at"`
	LastTrigger *time.Time             `json:"last_trigger,omitempty"`
	LastSuccess *time.Time             `json:"last_success,omitempty"`
	LastError   string                 `json:"last_error,omitempty"`
	Metadata    map[string]interface{} `json:"metadata"`
}

// WebhookPayload represents a webhook payload
type WebhookPayload struct {
	ID        string                 `json:"id"`
	Event     string                 `json:"event"`
	Timestamp time.Time              `json:"timestamp"`
	Data      map[string]interface{} `json:"data"`
	Source    string                 `json:"source"`
	Version   string                 `json:"version"`
}

// WebhookDelivery represents a webhook delivery attempt
type WebhookDelivery struct {
	ID              string                 `json:"id"`
	EndpointID      string                 `json:"endpoint_id"`
	PayloadID       string                 `json:"payload_id"`
	Status          string                 `json:"status"` // pending, sent, failed, retrying
	Attempts        int                    `json:"attempts"`
	MaxAttempts     int                    `json:"max_attempts"`
	LastAttempt     *time.Time             `json:"last_attempt,omitempty"`
	NextRetry       *time.Time             `json:"next_retry,omitempty"`
	ResponseCode    int                    `json:"response_code,omitempty"`
	ResponseBody    string                 `json:"response_body,omitempty"`
	ResponseHeaders map[string]string      `json:"response_headers,omitempty"`
	Error           string                 `json:"error,omitempty"`
	CreatedAt       time.Time              `json:"created_at"`
	CompletedAt     *time.Time             `json:"completed_at,omitempty"`
	Metadata        map[string]interface{} `json:"metadata"`
}

// WebhookEvent represents a webhook event
type WebhookEvent struct {
	ID          string                 `json:"id"`
	Type        string                 `json:"type"`
	Source      string                 `json:"source"`
	Data        map[string]interface{} `json:"data"`
	Timestamp   time.Time              `json:"timestamp"`
	UserID      string                 `json:"user_id,omitempty"`
	TenantID    string                 `json:"tenant_id,omitempty"`
	Priority    string                 `json:"priority"`
	RetryCount  int                    `json:"retry_count"`
	MaxRetries  int                    `json:"max_retries"`
	IsProcessed bool                   `json:"is_processed"`
	CreatedAt   time.Time              `json:"created_at"`
	ProcessedAt *time.Time             `json:"processed_at,omitempty"`
}

// NewWebhookService creates a new webhook service instance
func NewWebhookService(config WebhookConfig) (*WebhookService, error) {
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

	// Create HTTP client
	httpClient := &http.Client{
		Timeout: config.Timeout,
	}

	return &WebhookService{
		redis:  redisClient,
		config: config,
		client: httpClient,
	}, nil
}

// CreateEndpoint creates a new webhook endpoint
func (s *WebhookService) CreateEndpoint(endpoint WebhookEndpoint) (*WebhookEndpoint, error) {
	log.Info().
		Str("name", endpoint.Name).
		Str("url", endpoint.URL).
		Msg("Creating webhook endpoint")

	// Validate endpoint
	if err := s.validateEndpoint(endpoint); err != nil {
		return nil, fmt.Errorf("endpoint validation failed: %w", err)
	}

	// Set default values
	if endpoint.ID == "" {
		endpoint.ID = generateWebhookID()
	}
	if endpoint.CreatedAt.IsZero() {
		endpoint.CreatedAt = time.Now()
	}
	endpoint.UpdatedAt = time.Now()
	if endpoint.Method == "" {
		endpoint.Method = "POST"
	}
	if endpoint.Timeout == 0 {
		endpoint.Timeout = 30 * time.Second
	}
	if endpoint.RetryCount == 0 {
		endpoint.RetryCount = 3
	}

	// Store in Redis
	ctx := context.Background()
	key := s.getEndpointKey(endpoint.ID)

	endpointJSON, err := json.Marshal(endpoint)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal endpoint: %w", err)
	}

	if err := s.redis.Set(ctx, key, endpointJSON, 0).Err(); err != nil {
		return nil, fmt.Errorf("failed to store endpoint: %w", err)
	}

	// Add to endpoints index
	endpointsKey := s.getEndpointsKey(endpoint.TenantID)
	if err := s.redis.ZAdd(ctx, endpointsKey, &redis.Z{
		Score:  float64(endpoint.CreatedAt.Unix()),
		Member: endpoint.ID,
	}).Err(); err != nil {
		log.Error().Err(err).Msg("Failed to add endpoint to index")
	}

	// Add to event index
	for _, event := range endpoint.Events {
		eventKey := s.getEventEndpointsKey(event, endpoint.TenantID)
		if err := s.redis.SAdd(ctx, eventKey, endpoint.ID).Err(); err != nil {
			log.Error().Err(err).Msg("Failed to add endpoint to event index")
		}
	}

	log.Info().
		Str("endpointID", endpoint.ID).
		Msg("Webhook endpoint created successfully")

	return &endpoint, nil
}

// GetEndpoint gets a webhook endpoint by ID
func (s *WebhookService) GetEndpoint(endpointID string) (*WebhookEndpoint, error) {
	ctx := context.Background()
	key := s.getEndpointKey(endpointID)

	endpointJSON, err := s.redis.Get(ctx, key).Result()
	if err != nil {
		if err == redis.Nil {
			return nil, fmt.Errorf("endpoint not found: %s", endpointID)
		}
		return nil, fmt.Errorf("failed to get endpoint: %w", err)
	}

	var endpoint WebhookEndpoint
	if err := json.Unmarshal([]byte(endpointJSON), &endpoint); err != nil {
		return nil, fmt.Errorf("failed to unmarshal endpoint: %w", err)
	}

	return &endpoint, nil
}

// UpdateEndpoint updates a webhook endpoint
func (s *WebhookService) UpdateEndpoint(endpointID string, updates map[string]interface{}) (*WebhookEndpoint, error) {
	log.Info().
		Str("endpointID", endpointID).
		Msg("Updating webhook endpoint")

	endpoint, err := s.GetEndpoint(endpointID)
	if err != nil {
		return nil, fmt.Errorf("failed to get endpoint: %w", err)
	}

	// Apply updates
	endpoint.UpdatedAt = time.Now()

	// Update fields based on updates map
	if name, ok := updates["name"].(string); ok {
		endpoint.Name = name
	}
	if url, ok := updates["url"].(string); ok {
		endpoint.URL = url
	}
	if method, ok := updates["method"].(string); ok {
		endpoint.Method = method
	}
	if headers, ok := updates["headers"].(map[string]string); ok {
		endpoint.Headers = headers
	}
	if events, ok := updates["events"].([]string); ok {
		endpoint.Events = events
	}
	if secret, ok := updates["secret"].(string); ok {
		endpoint.Secret = secret
	}
	if isActive, ok := updates["is_active"].(bool); ok {
		endpoint.IsActive = isActive
	}
	if retryCount, ok := updates["retry_count"].(int); ok {
		endpoint.RetryCount = retryCount
	}
	if timeout, ok := updates["timeout"].(time.Duration); ok {
		endpoint.Timeout = timeout
	}

	// Store updated endpoint
	ctx := context.Background()
	key := s.getEndpointKey(endpointID)

	endpointJSON, err := json.Marshal(endpoint)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal endpoint: %w", err)
	}

	if err := s.redis.Set(ctx, key, endpointJSON, 0).Err(); err != nil {
		return nil, fmt.Errorf("failed to update endpoint: %w", err)
	}

	log.Info().
		Str("endpointID", endpointID).
		Msg("Webhook endpoint updated successfully")

	return endpoint, nil
}

// DeleteEndpoint deletes a webhook endpoint
func (s *WebhookService) DeleteEndpoint(endpointID string) error {
	log.Info().
		Str("endpointID", endpointID).
		Msg("Deleting webhook endpoint")

	endpoint, err := s.GetEndpoint(endpointID)
	if err != nil {
		return fmt.Errorf("failed to get endpoint: %w", err)
	}

	ctx := context.Background()

	// Remove from Redis
	key := s.getEndpointKey(endpointID)
	if err := s.redis.Del(ctx, key).Err(); err != nil {
		return fmt.Errorf("failed to delete endpoint: %w", err)
	}

	// Remove from endpoints index
	endpointsKey := s.getEndpointsKey(endpoint.TenantID)
	if err := s.redis.ZRem(ctx, endpointsKey, endpointID).Err(); err != nil {
		log.Error().Err(err).Msg("Failed to remove endpoint from index")
	}

	// Remove from event indices
	for _, event := range endpoint.Events {
		eventKey := s.getEventEndpointsKey(event, endpoint.TenantID)
		if err := s.redis.SRem(ctx, eventKey, endpointID).Err(); err != nil {
			log.Error().Err(err).Msg("Failed to remove endpoint from event index")
		}
	}

	log.Info().
		Str("endpointID", endpointID).
		Msg("Webhook endpoint deleted")

	return nil
}

// TriggerWebhook triggers a webhook for a specific event
func (s *WebhookService) TriggerWebhook(event WebhookEvent) error {
	log.Info().
		Str("eventID", event.ID).
		Str("eventType", event.Type).
		Str("source", event.Source).
		Msg("Triggering webhook")

	// Get endpoints for this event
	endpoints, err := s.getEndpointsForEvent(event.Type, event.TenantID)
	if err != nil {
		return fmt.Errorf("failed to get endpoints for event: %w", err)
	}

	if len(endpoints) == 0 {
		log.Info().Str("eventType", event.Type).Msg("No webhook endpoints found for event")
		return nil
	}

	// Create payload
	payload := WebhookPayload{
		ID:        generatePayloadID(),
		Event:     event.Type,
		Timestamp: time.Now(),
		Data:      event.Data,
		Source:    event.Source,
		Version:   "1.0",
	}

	// Store payload
	if err := s.storePayload(payload); err != nil {
		return fmt.Errorf("failed to store payload: %w", err)
	}

	// Send to each endpoint
	for _, endpoint := range endpoints {
		if !endpoint.IsActive {
			continue
		}

		delivery := WebhookDelivery{
			ID:          generateDeliveryID(),
			EndpointID:  endpoint.ID,
			PayloadID:   payload.ID,
			Status:      "pending",
			Attempts:    0,
			MaxAttempts: endpoint.RetryCount,
			CreatedAt:   time.Now(),
		}

		// Store delivery
		if err := s.storeDelivery(delivery); err != nil {
			log.Error().Err(err).Msg("Failed to store delivery")
			continue
		}

		// Send webhook asynchronously
		go s.sendWebhook(delivery, endpoint, payload)
	}

	return nil
}

// sendWebhook sends a webhook to an endpoint
func (s *WebhookService) sendWebhook(delivery WebhookDelivery, endpoint WebhookEndpoint, payload WebhookPayload) {
	log.Info().
		Str("deliveryID", delivery.ID).
		Str("endpointID", endpoint.ID).
		Str("url", endpoint.URL).
		Msg("Sending webhook")

	// Prepare request
	payloadJSON, err := json.Marshal(payload)
	if err != nil {
		s.updateDeliveryStatus(delivery.ID, "failed", err.Error())
		return
	}

	// Create request
	req, err := http.NewRequest(endpoint.Method, endpoint.URL, bytes.NewBuffer(payloadJSON))
	if err != nil {
		s.updateDeliveryStatus(delivery.ID, "failed", err.Error())
		return
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "Claude-Talimat-Webhook/1.0")
	req.Header.Set("X-Webhook-ID", delivery.ID)
	req.Header.Set("X-Event-Type", payload.Event)
	req.Header.Set("X-Timestamp", payload.Timestamp.Format(time.RFC3339))

	// Add custom headers
	for key, value := range endpoint.Headers {
		req.Header.Set(key, value)
	}

	// Add signature if secret is provided
	if endpoint.Secret != "" {
		signature := s.generateSignature(payloadJSON, endpoint.Secret)
		req.Header.Set("X-Signature", signature)
	}

	// Send request
	ctx, cancel := context.WithTimeout(context.Background(), endpoint.Timeout)
	defer cancel()

	req = req.WithContext(ctx)
	resp, err := s.client.Do(req)
	if err != nil {
		s.handleDeliveryError(delivery.ID, err.Error(), endpoint)
		return
	}
	defer resp.Body.Close()

	// Read response
	var responseBody string
	if resp.Body != nil {
		bodyBytes, _ := json.Marshal(resp.Body)
		responseBody = string(bodyBytes)
	}

	// Update delivery status
	delivery.Status = "sent"
	delivery.ResponseCode = resp.StatusCode
	delivery.ResponseBody = responseBody
	delivery.LastAttempt = &time.Time{}
	delivery.CompletedAt = &time.Time{}
	delivery.Attempts++

	// Store response headers
	delivery.ResponseHeaders = make(map[string]string)
	for key, values := range resp.Header {
		if len(values) > 0 {
			delivery.ResponseHeaders[key] = values[0]
		}
	}

	// Check if successful
	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		delivery.Status = "sent"
		s.updateEndpointSuccess(endpoint.ID)
	} else {
		delivery.Status = "failed"
		delivery.Error = fmt.Sprintf("HTTP %d: %s", resp.StatusCode, responseBody)
		s.handleDeliveryError(delivery.ID, delivery.Error, endpoint)
	}

	// Update delivery
	s.updateDelivery(delivery)

	log.Info().
		Str("deliveryID", delivery.ID).
		Int("statusCode", resp.StatusCode).
		Msg("Webhook sent")
}

// handleDeliveryError handles webhook delivery errors
func (s *WebhookService) handleDeliveryError(deliveryID string, errorMsg string, endpoint WebhookEndpoint) {
	delivery, err := s.getDelivery(deliveryID)
	if err != nil {
		log.Error().Err(err).Msg("Failed to get delivery for error handling")
		return
	}

	delivery.Attempts++
	delivery.LastAttempt = &time.Time{}
	delivery.Error = errorMsg

	if delivery.Attempts < delivery.MaxAttempts {
		// Schedule retry
		delivery.Status = "retrying"
		retryDelay := s.config.RetryDelay * time.Duration(delivery.Attempts)
		delivery.NextRetry = &time.Time{}.Add(retryDelay)

		// Schedule retry
		time.AfterFunc(retryDelay, func() {
			s.retryWebhook(delivery.ID)
		})
	} else {
		// Max retries reached
		delivery.Status = "failed"
		delivery.CompletedAt = &time.Time{}
		s.updateEndpointError(endpoint.ID, errorMsg)
	}

	s.updateDelivery(*delivery)
}

// retryWebhook retries a failed webhook delivery
func (s *WebhookService) retryWebhook(deliveryID string) {
	delivery, err := s.getDelivery(deliveryID)
	if err != nil {
		log.Error().Err(err).Msg("Failed to get delivery for retry")
		return
	}

	endpoint, err := s.GetEndpoint(delivery.EndpointID)
	if err != nil {
		log.Error().Err(err).Msg("Failed to get endpoint for retry")
		return
	}

	payload, err := s.getPayload(delivery.PayloadID)
	if err != nil {
		log.Error().Err(err).Msg("Failed to get payload for retry")
		return
	}

	// Send webhook again
	s.sendWebhook(*delivery, *endpoint, *payload)
}

// GetDelivery gets a webhook delivery by ID
func (s *WebhookService) GetDelivery(deliveryID string) (*WebhookDelivery, error) {
	return s.getDelivery(deliveryID)
}

// GetDeliveries gets webhook deliveries for an endpoint
func (s *WebhookService) GetDeliveries(endpointID string, page int, limit int) ([]*WebhookDelivery, int, error) {
	ctx := context.Background()
	key := s.getEndpointDeliveriesKey(endpointID)

	// Get total count
	total, err := s.redis.ZCard(ctx, key).Result()
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get delivery count: %w", err)
	}

	// Calculate pagination
	start := int64((page - 1) * limit)
	stop := start + int64(limit) - 1

	// Get delivery IDs (newest first)
	deliveryIDs, err := s.redis.ZRevRange(ctx, key, start, stop).Result()
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get delivery IDs: %w", err)
	}

	// Get delivery details
	var deliveries []*WebhookDelivery
	for _, id := range deliveryIDs {
		delivery, err := s.getDelivery(id)
		if err != nil {
			log.Warn().Err(err).Str("deliveryID", id).Msg("Failed to get delivery")
			continue
		}
		deliveries = append(deliveries, delivery)
	}

	return deliveries, int(total), nil
}

// TestEndpoint tests a webhook endpoint
func (s *WebhookService) TestEndpoint(endpointID string) error {
	log.Info().
		Str("endpointID", endpointID).
		Msg("Testing webhook endpoint")

	endpoint, err := s.GetEndpoint(endpointID)
	if err != nil {
		return fmt.Errorf("failed to get endpoint: %w", err)
	}

	// Create test payload
	testPayload := WebhookPayload{
		ID:        generatePayloadID(),
		Event:     "test",
		Timestamp: time.Now(),
		Data: map[string]interface{}{
			"message":   "Bu bir test webhook'udur.",
			"timestamp": time.Now().Unix(),
		},
		Source:  "webhook-test",
		Version: "1.0",
	}

	// Create test delivery
	testDelivery := WebhookDelivery{
		ID:          generateDeliveryID(),
		EndpointID:  endpoint.ID,
		PayloadID:   testPayload.ID,
		Status:      "pending",
		Attempts:    0,
		MaxAttempts: 1,
		CreatedAt:   time.Now(),
	}

	// Store test data
	if err := s.storePayload(testPayload); err != nil {
		return fmt.Errorf("failed to store test payload: %w", err)
	}

	if err := s.storeDelivery(testDelivery); err != nil {
		return fmt.Errorf("failed to store test delivery: %w", err)
	}

	// Send test webhook
	go s.sendWebhook(testDelivery, *endpoint, testPayload)

	return nil
}

// TestConnection tests the webhook service connection
func (s *WebhookService) TestConnection() error {
	log.Info().Msg("Testing webhook service connection")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := s.redis.Ping(ctx).Err(); err != nil {
		log.Error().Err(err).Msg("Webhook service connection test failed")
		return fmt.Errorf("connection test failed: %w", err)
	}

	log.Info().Msg("Webhook service connection test successful")
	return nil
}

// validateEndpoint validates a webhook endpoint
func (s *WebhookService) validateEndpoint(endpoint WebhookEndpoint) error {
	if endpoint.Name == "" {
		return fmt.Errorf("endpoint name is required")
	}

	if endpoint.URL == "" {
		return fmt.Errorf("endpoint URL is required")
	}

	if len(endpoint.Events) == 0 {
		return fmt.Errorf("at least one event type is required")
	}

	return nil
}

// getEndpointsForEvent gets endpoints that should be triggered for a specific event
func (s *WebhookService) getEndpointsForEvent(eventType string, tenantID string) ([]*WebhookEndpoint, error) {
	ctx := context.Background()
	eventKey := s.getEventEndpointsKey(eventType, tenantID)

	// Get endpoint IDs for this event
	endpointIDs, err := s.redis.SMembers(ctx, eventKey).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to get endpoint IDs for event: %w", err)
	}

	// Get endpoint details
	var endpoints []*WebhookEndpoint
	for _, id := range endpointIDs {
		endpoint, err := s.GetEndpoint(id)
		if err != nil {
			log.Warn().Err(err).Str("endpointID", id).Msg("Failed to get endpoint")
			continue
		}
		if endpoint.IsActive {
			endpoints = append(endpoints, endpoint)
		}
	}

	return endpoints, nil
}

// storePayload stores a webhook payload
func (s *WebhookService) storePayload(payload WebhookPayload) error {
	ctx := context.Background()
	key := s.getPayloadKey(payload.ID)

	payloadJSON, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal payload: %w", err)
	}

	// Store with TTL (24 hours)
	return s.redis.Set(ctx, key, payloadJSON, 24*time.Hour).Err()
}

// storeDelivery stores a webhook delivery
func (s *WebhookService) storeDelivery(delivery WebhookDelivery) error {
	ctx := context.Background()
	key := s.getDeliveryKey(delivery.ID)

	deliveryJSON, err := json.Marshal(delivery)
	if err != nil {
		return fmt.Errorf("failed to marshal delivery: %w", err)
	}

	// Store delivery
	if err := s.redis.Set(ctx, key, deliveryJSON, 0).Err(); err != nil {
		return fmt.Errorf("failed to store delivery: %w", err)
	}

	// Add to endpoint deliveries index
	endpointDeliveriesKey := s.getEndpointDeliveriesKey(delivery.EndpointID)
	return s.redis.ZAdd(ctx, endpointDeliveriesKey, &redis.Z{
		Score:  float64(delivery.CreatedAt.Unix()),
		Member: delivery.ID,
	}).Err()
}

// getDelivery gets a webhook delivery by ID
func (s *WebhookService) getDelivery(deliveryID string) (*WebhookDelivery, error) {
	ctx := context.Background()
	key := s.getDeliveryKey(deliveryID)

	deliveryJSON, err := s.redis.Get(ctx, key).Result()
	if err != nil {
		if err == redis.Nil {
			return nil, fmt.Errorf("delivery not found: %s", deliveryID)
		}
		return nil, fmt.Errorf("failed to get delivery: %w", err)
	}

	var delivery WebhookDelivery
	if err := json.Unmarshal([]byte(deliveryJSON), &delivery); err != nil {
		return nil, fmt.Errorf("failed to unmarshal delivery: %w", err)
	}

	return &delivery, nil
}

// getPayload gets a webhook payload by ID
func (s *WebhookService) getPayload(payloadID string) (*WebhookPayload, error) {
	ctx := context.Background()
	key := s.getPayloadKey(payloadID)

	payloadJSON, err := s.redis.Get(ctx, key).Result()
	if err != nil {
		if err == redis.Nil {
			return nil, fmt.Errorf("payload not found: %s", payloadID)
		}
		return nil, fmt.Errorf("failed to get payload: %w", err)
	}

	var payload WebhookPayload
	if err := json.Unmarshal([]byte(payloadJSON), &payload); err != nil {
		return nil, fmt.Errorf("failed to unmarshal payload: %w", err)
	}

	return &payload, nil
}

// updateDeliveryStatus updates a delivery status
func (s *WebhookService) updateDeliveryStatus(deliveryID string, status string, errorMsg string) {
	delivery, err := s.getDelivery(deliveryID)
	if err != nil {
		log.Error().Err(err).Msg("Failed to get delivery for status update")
		return
	}

	delivery.Status = status
	delivery.Error = errorMsg
	delivery.LastAttempt = &time.Time{}

	if status == "sent" || status == "failed" {
		delivery.CompletedAt = &time.Time{}
	}

	s.updateDelivery(*delivery)
}

// updateDelivery updates a webhook delivery
func (s *WebhookService) updateDelivery(delivery WebhookDelivery) error {
	ctx := context.Background()
	key := s.getDeliveryKey(delivery.ID)

	deliveryJSON, err := json.Marshal(delivery)
	if err != nil {
		return fmt.Errorf("failed to marshal delivery: %w", err)
	}

	return s.redis.Set(ctx, key, deliveryJSON, 0).Err()
}

// updateEndpointSuccess updates endpoint success metrics
func (s *WebhookService) updateEndpointSuccess(endpointID string) {
	ctx := context.Background()
	key := s.getEndpointKey(endpointID)

	// Get current endpoint
	endpoint, err := s.GetEndpoint(endpointID)
	if err != nil {
		log.Error().Err(err).Msg("Failed to get endpoint for success update")
		return
	}

	// Update success metrics
	now := time.Now()
	endpoint.LastSuccess = &now
	endpoint.LastError = ""
	endpoint.UpdatedAt = now

	// Store updated endpoint
	endpointJSON, err := json.Marshal(endpoint)
	if err != nil {
		log.Error().Err(err).Msg("Failed to marshal endpoint for success update")
		return
	}

	if err := s.redis.Set(ctx, key, endpointJSON, 0).Err(); err != nil {
		log.Error().Err(err).Msg("Failed to update endpoint for success")
	}
}

// updateEndpointError updates endpoint error metrics
func (s *WebhookService) updateEndpointError(endpointID string, errorMsg string) {
	ctx := context.Background()
	key := s.getEndpointKey(endpointID)

	// Get current endpoint
	endpoint, err := s.GetEndpoint(endpointID)
	if err != nil {
		log.Error().Err(err).Msg("Failed to get endpoint for error update")
		return
	}

	// Update error metrics
	now := time.Now()
	endpoint.LastError = errorMsg
	endpoint.UpdatedAt = now

	// Store updated endpoint
	endpointJSON, err := json.Marshal(endpoint)
	if err != nil {
		log.Error().Err(err).Msg("Failed to marshal endpoint for error update")
		return
	}

	if err := s.redis.Set(ctx, key, endpointJSON, 0).Err(); err != nil {
		log.Error().Err(err).Msg("Failed to update endpoint for error")
	}
}

// generateSignature generates a signature for webhook payload
func (s *WebhookService) generateSignature(payload []byte, secret string) string {
	h := hmac.New(sha256.New, []byte(secret))
	h.Write(payload)
	return "sha256=" + hex.EncodeToString(h.Sum(nil))
}

// Redis key generators
func (s *WebhookService) getEndpointKey(endpointID string) string {
	return fmt.Sprintf("webhook_endpoint:%s", endpointID)
}

func (s *WebhookService) getEndpointsKey(tenantID string) string {
	if tenantID == "" {
		return "webhook_endpoints:global"
	}
	return fmt.Sprintf("webhook_endpoints:%s", tenantID)
}

func (s *WebhookService) getEventEndpointsKey(eventType string, tenantID string) string {
	if tenantID == "" {
		return fmt.Sprintf("webhook_event_endpoints:%s:global", eventType)
	}
	return fmt.Sprintf("webhook_event_endpoints:%s:%s", eventType, tenantID)
}

func (s *WebhookService) getPayloadKey(payloadID string) string {
	return fmt.Sprintf("webhook_payload:%s", payloadID)
}

func (s *WebhookService) getDeliveryKey(deliveryID string) string {
	return fmt.Sprintf("webhook_delivery:%s", deliveryID)
}

func (s *WebhookService) getEndpointDeliveriesKey(endpointID string) string {
	return fmt.Sprintf("webhook_endpoint_deliveries:%s", endpointID)
}

// Helper functions
func generatePayloadID() string {
	return fmt.Sprintf("payload_%d", time.Now().UnixNano())
}

func generateDeliveryID() string {
	return fmt.Sprintf("delivery_%d", time.Now().UnixNano())
}
