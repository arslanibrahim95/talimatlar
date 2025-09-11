package main

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/go-redis/redis/v8"
)

// MessageQueueIntegration handles message queue operations for notifications
type MessageQueueIntegration struct {
	rdb     *redis.Client
	ctx     context.Context
	service string
}

// NotificationMessage represents a notification message in the queue
type NotificationMessage struct {
	ID        string                 `json:"id"`
	Type      string                 `json:"type"`
	Recipient string                 `json:"recipient"`
	Title     string                 `json:"title"`
	Message   string                 `json:"message"`
	Priority  string                 `json:"priority"`
	Category  string                 `json:"category"`
	Data      map[string]interface{} `json:"data,omitempty"`
	Schedule  *time.Time             `json:"schedule,omitempty"`
}

// NewMessageQueueIntegration creates a new message queue integration
func NewMessageQueueIntegration(redisURL string) *MessageQueueIntegration {
	rdb := redis.NewClient(&redis.Options{
		Addr:     redisURL,
		Password: "",
		DB:       1, // Use DB 1 for message queue
	})

	return &MessageQueueIntegration{
		rdb:     rdb,
		ctx:     context.Background(),
		service: "notification-service",
	}
}

// PublishNotification publishes a notification to the message queue
func (mq *MessageQueueIntegration) PublishNotification(notification NotificationMessage) error {
	// Convert notification to message queue format
	message := map[string]interface{}{
		"topic": "notifications",
		"payload": map[string]interface{}{
			"type":      notification.Type,
			"recipient": notification.Recipient,
			"title":     notification.Title,
			"message":   notification.Message,
			"priority":  notification.Priority,
			"category":  notification.Category,
			"data":      notification.Data,
			"schedule":  notification.Schedule,
		},
		"priority":    mq.getPriorityValue(notification.Priority),
		"max_retries": 3,
		"metadata": map[string]interface{}{
			"created_by": mq.service,
			"category":   "notification",
		},
	}

	// Serialize message
	messageData, err := json.Marshal(message)
	if err != nil {
		return err
	}

	// Add to Redis Stream
	streamKey := "mq:topic:notifications"
	args := &redis.XAddArgs{
		Stream: streamKey,
		Values: map[string]interface{}{
			"message":  string(messageData),
			"priority": mq.getPriorityValue(notification.Priority),
		},
	}

	_, err = mq.rdb.XAdd(mq.ctx, args).Result()
	if err != nil {
		return err
	}

	log.Printf("Notification published to queue: Type=%s, Recipient=%s", notification.Type, notification.Recipient)
	return nil
}

// PublishBulkNotifications publishes multiple notifications
func (mq *MessageQueueIntegration) PublishBulkNotifications(notifications []NotificationMessage) error {
	for _, notification := range notifications {
		if err := mq.PublishNotification(notification); err != nil {
			log.Printf("Failed to publish notification: %v", err)
			// Continue with other notifications
		}
	}
	return nil
}

// ConsumeNotifications consumes notifications from the queue
func (mq *MessageQueueIntegration) ConsumeNotifications(consumerName string, count int64) ([]NotificationMessage, error) {
	streamKey := "mq:topic:notifications"
	consumerGroup := "mq:group:notifications"

	// Create consumer group if it doesn't exist
	_, err := mq.rdb.XGroupCreateMkStream(mq.ctx, streamKey, consumerGroup, "0").Result()
	if err != nil && err.Error() != "BUSYGROUP Consumer Group name already exists" {
		return nil, err
	}

	// Read messages
	args := &redis.XReadGroupArgs{
		Group:    consumerGroup,
		Consumer: consumerName,
		Streams:  []string{streamKey, ">"},
		Count:    count,
		Block:    time.Second,
	}

	streams, err := mq.rdb.XReadGroup(mq.ctx, args).Result()
	if err != nil {
		if err == redis.Nil {
			return []NotificationMessage{}, nil
		}
		return nil, err
	}

	var notifications []NotificationMessage
	for _, stream := range streams {
		for _, message := range stream.Messages {
			var msg map[string]interface{}
			if err := json.Unmarshal([]byte(message.Values["message"].(string)), &msg); err != nil {
				continue
			}

			payload := msg["payload"].(map[string]interface{})
			notification := NotificationMessage{
				ID:        message.ID,
				Type:      payload["type"].(string),
				Recipient: payload["recipient"].(string),
				Title:     payload["title"].(string),
				Message:   payload["message"].(string),
				Priority:  payload["priority"].(string),
				Category:  payload["category"].(string),
			}

			// Handle optional fields
			if data, ok := payload["data"].(map[string]interface{}); ok {
				notification.Data = data
			}

			notifications = append(notifications, notification)
		}
	}

	return notifications, nil
}

// AcknowledgeNotification acknowledges a processed notification
func (mq *MessageQueueIntegration) AcknowledgeNotification(messageID, consumerName string) error {
	streamKey := "mq:topic:notifications"
	consumerGroup := "mq:group:notifications"

	_, err := mq.rdb.XAck(mq.ctx, streamKey, consumerGroup, messageID).Result()
	if err != nil {
		return err
	}

	log.Printf("Notification acknowledged: ID=%s", messageID)
	return nil
}

// NegativeAcknowledgeNotification negatively acknowledges a notification
func (mq *MessageQueueIntegration) NegativeAcknowledgeNotification(messageID, consumerName string, retry bool) error {
	streamKey := "mq:topic:notifications"
	consumerGroup := "mq:group:notifications"

	if retry {
		// Claim message for retry
		args := &redis.XClaimArgs{
			Stream:   streamKey,
			Group:    consumerGroup,
			Consumer: consumerName,
			MinIdle:  time.Second,
			Messages: []string{messageID},
		}

		_, err := mq.rdb.XClaim(mq.ctx, args).Result()
		if err != nil {
			return err
		}
	} else {
		// Acknowledge and move to dead letter queue
		_, err := mq.rdb.XAck(mq.ctx, streamKey, consumerGroup, messageID).Result()
		if err != nil {
			return err
		}

		// Move to dead letter queue
		deadLetterKey := "mq:dlq:notifications"
		mq.rdb.XAdd(mq.ctx, &redis.XAddArgs{
			Stream: deadLetterKey,
			Values: map[string]interface{}{
				"original_id": messageID,
				"failed_at":   time.Now().Unix(),
				"reason":      "negative_acknowledgment",
			},
		})
	}

	log.Printf("Notification nacked: ID=%s, Retry=%t", messageID, retry)
	return nil
}

// getPriorityValue converts priority string to numeric value
func (mq *MessageQueueIntegration) getPriorityValue(priority string) int {
	switch priority {
	case "urgent":
		return 9
	case "high":
		return 7
	case "normal":
		return 5
	case "low":
		return 3
	default:
		return 5
	}
}

// Close closes the Redis connection
func (mq *MessageQueueIntegration) Close() error {
	return mq.rdb.Close()
}

// Example usage in the notification service
func ExampleUsage() {
	// Initialize message queue integration
	mq := NewMessageQueueIntegration("redis:6379")
	defer mq.Close()

	// Publish a notification
	notification := NotificationMessage{
		Type:      "email",
		Recipient: "user@example.com",
		Title:     "Welcome",
		Message:   "Welcome to our system!",
		Priority:  "normal",
		Category:  "onboarding",
		Data: map[string]interface{}{
			"template": "welcome",
			"user_id":  "123",
		},
	}

	if err := mq.PublishNotification(notification); err != nil {
		log.Printf("Failed to publish notification: %v", err)
	}

	// Consume notifications
	notifications, err := mq.ConsumeNotifications("notification-worker", 1)
	if err != nil {
		log.Printf("Failed to consume notifications: %v", err)
		return
	}

	for _, notification := range notifications {
		// Process notification
		log.Printf("Processing notification: %+v", notification)

		// Acknowledge after successful processing
		if err := mq.AcknowledgeNotification(notification.ID, "notification-worker"); err != nil {
			log.Printf("Failed to acknowledge notification: %v", err)
		}
	}
}
