package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-redis/redis/v8"
)

// Message represents a message in the queue
type Message struct {
	ID          string                 `json:"id"`
	Topic       string                 `json:"topic"`
	Payload     map[string]interface{} `json:"payload"`
	Priority    int                    `json:"priority"`    // 1-10, higher is more priority
	RetryCount  int                    `json:"retry_count"`
	MaxRetries  int                    `json:"max_retries"`
	CreatedAt   time.Time              `json:"created_at"`
	ScheduledAt *time.Time             `json:"scheduled_at,omitempty"`
	ExpiresAt   *time.Time             `json:"expires_at,omitempty"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
}

// MessageRequest represents a request to publish a message
type MessageRequest struct {
	Topic       string                 `json:"topic" binding:"required"`
	Payload     map[string]interface{} `json:"payload" binding:"required"`
	Priority    int                    `json:"priority"`
	MaxRetries  int                    `json:"max_retries"`
	ScheduledAt *time.Time             `json:"scheduled_at,omitempty"`
	ExpiresAt   *time.Time             `json:"expires_at,omitempty"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
}

// MessageResponse represents a response for message operations
type MessageResponse struct {
	ID        string    `json:"id"`
	Status    string    `json:"status"`
	Message   string    `json:"message"`
	Timestamp time.Time `json:"timestamp"`
}

// QueueStats represents queue statistics
type QueueStats struct {
	Topic           string `json:"topic"`
	TotalMessages   int64  `json:"total_messages"`
	PendingMessages int64  `json:"pending_messages"`
	ProcessedMessages int64 `json:"processed_messages"`
	FailedMessages  int64  `json:"failed_messages"`
	Consumers       int    `json:"consumers"`
}

// HealthResponse represents health check response
type HealthResponse struct {
	Status    string `json:"status"`
	Service   string `json:"service"`
	Timestamp int64  `json:"timestamp"`
	Version   string `json:"version"`
	Uptime    string `json:"uptime"`
	Redis     string `json:"redis_status"`
}

var (
	rdb     *redis.Client
	ctx     = context.Background()
	startTime = time.Now()
)

func main() {
	// Initialize Redis client
	rdb = redis.NewClient(&redis.Options{
		Addr:     "redis:6379",
		Password: "",
		DB:       1, // Use DB 1 for message queue
	})

	// Test Redis connection
	_, err := rdb.Ping(ctx).Result()
	if err != nil {
		log.Fatal("Failed to connect to Redis:", err)
	}

	// Set Gin to release mode
	gin.SetMode(gin.ReleaseMode)

	// Create router
	router := gin.New()

	// Add middleware
	router.Use(gin.Logger())
	router.Use(gin.Recovery())
	router.Use(corsMiddleware())

	// Health check endpoint
	router.GET("/health", healthCheck)

	// Root endpoint
	router.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"service": "Claude Message Queue Service",
			"version": "1.0.0",
			"status":  "running",
			"endpoints": gin.H{
				"health":     "/health",
				"publish":    "/api/v1/messages/publish",
				"consume":    "/api/v1/messages/consume",
				"ack":        "/api/v1/messages/:id/ack",
				"nack":       "/api/v1/messages/:id/nack",
				"stats":      "/api/v1/stats",
				"topics":     "/api/v1/topics",
			},
		})
	})

	// API v1 routes
	api := router.Group("/api/v1")
	{
		// Messages group
		messages := api.Group("/messages")
		{
			// Publish message
			messages.POST("/publish", publishMessage)
			
			// Publish bulk messages
			messages.POST("/publish-bulk", publishBulkMessages)

			// Consume messages
			messages.POST("/consume", consumeMessages)

			// Acknowledge message
			messages.POST("/:id/ack", acknowledgeMessage)

			// Negative acknowledge message
			messages.POST("/:id/nack", negativeAcknowledgeMessage)

			// Get message status
			messages.GET("/:id/status", getMessageStatus)
		}

		// Topics group
		topics := api.Group("/topics")
		{
			// List topics
			topics.GET("/", listTopics)

			// Get topic stats
			topics.GET("/:topic/stats", getTopicStats)

			// Create topic
			topics.POST("/", createTopic)

			// Delete topic
			topics.DELETE("/:topic", deleteTopic)
		}

		// Statistics group
		stats := api.Group("/stats")
		{
			// Get overall stats
			stats.GET("/", getOverallStats)

			// Get consumer stats
			stats.GET("/consumers", getConsumerStats)
		}
	}

	// Start server
	log.Printf("Starting Message Queue Service on port 8008")
	if err := router.Run(":8008"); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}

// CORS middleware
func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}

// healthCheck returns the health status of the service
func healthCheck(c *gin.Context) {
	// Check Redis connection
	redisStatus := "healthy"
	_, err := rdb.Ping(ctx).Result()
	if err != nil {
		redisStatus = "unhealthy"
	}

	uptime := time.Since(startTime).String()
	response := HealthResponse{
		Status:    "healthy",
		Service:   "message-queue-service",
		Timestamp: time.Now().Unix(),
		Version:   "1.0.0",
		Uptime:    uptime,
		Redis:     redisStatus,
	}

	statusCode := http.StatusOK
	if redisStatus == "unhealthy" {
		response.Status = "unhealthy"
		statusCode = http.StatusServiceUnavailable
	}

	c.JSON(statusCode, response)
}

// publishMessage publishes a single message to a topic
func publishMessage(c *gin.Context) {
	var request MessageRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request",
			"message": err.Error(),
		})
		return
	}

	// Set defaults
	if request.Priority == 0 {
		request.Priority = 5
	}
	if request.MaxRetries == 0 {
		request.MaxRetries = 3
	}

	// Create message
	message := Message{
		ID:         generateMessageID(),
		Topic:      request.Topic,
		Payload:    request.Payload,
		Priority:   request.Priority,
		RetryCount: 0,
		MaxRetries: request.MaxRetries,
		CreatedAt:  time.Now(),
		ScheduledAt: request.ScheduledAt,
		ExpiresAt:  request.ExpiresAt,
		Metadata:   request.Metadata,
	}

	// Serialize message
	messageData, err := json.Marshal(message)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to serialize message",
			"message": err.Error(),
		})
		return
	}

	// Add to Redis Stream
	streamKey := fmt.Sprintf("mq:topic:%s", request.Topic)
	args := &redis.XAddArgs{
		Stream: streamKey,
		Values: map[string]interface{}{
			"message": string(messageData),
			"priority": request.Priority,
		},
	}

	streamID, err := rdb.XAdd(ctx, args).Result()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to publish message",
			"message": err.Error(),
		})
		return
	}

	// Update topic stats
	updateTopicStats(request.Topic, "published")

	response := MessageResponse{
		ID:        message.ID,
		Status:    "published",
		Message:   "Message published successfully",
		Timestamp: time.Now(),
	}

	log.Printf("Message published: ID=%s, Topic=%s, StreamID=%s", message.ID, request.Topic, streamID)
	c.JSON(http.StatusOK, response)
}

// publishBulkMessages publishes multiple messages
func publishBulkMessages(c *gin.Context) {
	var request struct {
		Messages []MessageRequest `json:"messages" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request",
			"message": err.Error(),
		})
		return
	}

	var responses []MessageResponse
	var failedMessages []string

	for _, msgReq := range request.Messages {
		// Set defaults
		if msgReq.Priority == 0 {
			msgReq.Priority = 5
		}
		if msgReq.MaxRetries == 0 {
			msgReq.MaxRetries = 3
		}

		// Create message
		message := Message{
			ID:         generateMessageID(),
			Topic:      msgReq.Topic,
			Payload:    msgReq.Payload,
			Priority:   msgReq.Priority,
			RetryCount: 0,
			MaxRetries: msgReq.MaxRetries,
			CreatedAt:  time.Now(),
			ScheduledAt: msgReq.ScheduledAt,
			ExpiresAt:  msgReq.ExpiresAt,
			Metadata:   msgReq.Metadata,
		}

		// Serialize message
		messageData, err := json.Marshal(message)
		if err != nil {
			failedMessages = append(failedMessages, message.ID)
			continue
		}

		// Add to Redis Stream
		streamKey := fmt.Sprintf("mq:topic:%s", msgReq.Topic)
		args := &redis.XAddArgs{
			Stream: streamKey,
			Values: map[string]interface{}{
				"message": string(messageData),
				"priority": msgReq.Priority,
			},
		}

		_, err = rdb.XAdd(ctx, args).Result()
		if err != nil {
			failedMessages = append(failedMessages, message.ID)
			continue
		}

		// Update topic stats
		updateTopicStats(msgReq.Topic, "published")

		response := MessageResponse{
			ID:        message.ID,
			Status:    "published",
			Message:   "Message published successfully",
			Timestamp: time.Now(),
		}
		responses = append(responses, response)
	}

	c.JSON(http.StatusOK, gin.H{
		"success":        true,
		"total":          len(request.Messages),
		"published":      len(responses),
		"failed":         len(failedMessages),
		"messages":       responses,
		"failed_ids":     failedMessages,
		"message":        "Bulk publish completed",
	})
}

// consumeMessages consumes messages from a topic
func consumeMessages(c *gin.Context) {
	var request struct {
		Topic     string `json:"topic" binding:"required"`
		Consumer  string `json:"consumer" binding:"required"`
		Count     int64  `json:"count"`
		BlockTime int    `json:"block_time"` // milliseconds
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request",
			"message": err.Error(),
		})
		return
	}

	// Set defaults
	if request.Count == 0 {
		request.Count = 1
	}
	if request.BlockTime == 0 {
		request.BlockTime = 1000 // 1 second
	}

	streamKey := fmt.Sprintf("mq:topic:%s", request.Topic)
	consumerGroup := fmt.Sprintf("mq:group:%s", request.Topic)
	consumerName := request.Consumer

	// Create consumer group if it doesn't exist
	_, err := rdb.XGroupCreateMkStream(ctx, streamKey, consumerGroup, "0").Result()
	if err != nil && err.Error() != "BUSYGROUP Consumer Group name already exists" {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to create consumer group",
			"message": err.Error(),
		})
		return
	}

	// Read messages
	args := &redis.XReadGroupArgs{
		Group:    consumerGroup,
		Consumer: consumerName,
		Streams:  []string{streamKey, ">"},
		Count:    request.Count,
		Block:    time.Duration(request.BlockTime) * time.Millisecond,
	}

	streams, err := rdb.XReadGroup(ctx, args).Result()
	if err != nil {
		if err == redis.Nil {
			c.JSON(http.StatusOK, gin.H{
				"success": true,
				"messages": []Message{},
				"count":   0,
				"message": "No messages available",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to consume messages",
			"message": err.Error(),
		})
		return
	}

	var messages []Message
	for _, stream := range streams {
		for _, message := range stream.Messages {
			var msg Message
			if err := json.Unmarshal([]byte(message.Values["message"].(string)), &msg); err != nil {
				continue
			}
			msg.ID = message.ID
			messages = append(messages, msg)
		}
	}

	// Update topic stats
	updateTopicStats(request.Topic, "consumed")

	c.JSON(http.StatusOK, gin.H{
		"success":  true,
		"messages": messages,
		"count":    len(messages),
		"message":  "Messages consumed successfully",
	})
}

// acknowledgeMessage acknowledges a message
func acknowledgeMessage(c *gin.Context) {
	messageID := c.Param("id")
	if messageID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Missing message ID",
			"message": "Message ID is required",
		})
		return
	}

	var request struct {
		Topic    string `json:"topic" binding:"required"`
		Consumer string `json:"consumer" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request",
			"message": err.Error(),
		})
		return
	}

	streamKey := fmt.Sprintf("mq:topic:%s", request.Topic)
	consumerGroup := fmt.Sprintf("mq:group:%s", request.Topic)

	// Acknowledge message
	ackCount, err := rdb.XAck(ctx, streamKey, consumerGroup, messageID).Result()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to acknowledge message",
			"message": err.Error(),
		})
		return
	}

	// Update topic stats
	updateTopicStats(request.Topic, "acknowledged")

	response := MessageResponse{
		ID:        messageID,
		Status:    "acknowledged",
		Message:   "Message acknowledged successfully",
		Timestamp: time.Now(),
	}

	log.Printf("Message acknowledged: ID=%s, Topic=%s, Count=%d", messageID, request.Topic, ackCount)
	c.JSON(http.StatusOK, response)
}

// negativeAcknowledgeMessage negatively acknowledges a message
func negativeAcknowledgeMessage(c *gin.Context) {
	messageID := c.Param("id")
	if messageID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Missing message ID",
			"message": "Message ID is required",
		})
		return
	}

	var request struct {
		Topic    string `json:"topic" binding:"required"`
		Consumer string `json:"consumer" binding:"required"`
		Retry    bool   `json:"retry"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request",
			"message": err.Error(),
		})
		return
	}

	streamKey := fmt.Sprintf("mq:topic:%s", request.Topic)
	consumerGroup := fmt.Sprintf("mq:group:%s", request.Topic)

	if request.Retry {
		// Claim message for retry
		args := &redis.XClaimArgs{
			Stream:   streamKey,
			Group:    consumerGroup,
			Consumer: request.Consumer,
			MinIdle:  time.Second,
			Messages: []string{messageID},
		}

		claimedMessages, err := rdb.XClaim(ctx, args).Result()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "Failed to claim message for retry",
				"message": err.Error(),
			})
			return
		}

		if len(claimedMessages) == 0 {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "Message not found or already processed",
				"message": "Message cannot be retried",
			})
			return
		}
	} else {
		// Acknowledge and move to dead letter queue
		_, err := rdb.XAck(ctx, streamKey, consumerGroup, messageID).Result()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "Failed to acknowledge message",
				"message": err.Error(),
			})
			return
		}

		// Move to dead letter queue
		deadLetterKey := fmt.Sprintf("mq:dlq:%s", request.Topic)
		rdb.XAdd(ctx, &redis.XAddArgs{
			Stream: deadLetterKey,
			Values: map[string]interface{}{
				"original_id": messageID,
				"failed_at":   time.Now().Unix(),
				"reason":      "negative_acknowledgment",
			},
		})
	}

	// Update topic stats
	updateTopicStats(request.Topic, "failed")

	response := MessageResponse{
		ID:        messageID,
		Status:    "nack",
		Message:   "Message negatively acknowledged",
		Timestamp: time.Now(),
	}

	log.Printf("Message nacked: ID=%s, Topic=%s, Retry=%t", messageID, request.Topic, request.Retry)
	c.JSON(http.StatusOK, response)
}

// getMessageStatus returns the status of a message
func getMessageStatus(c *gin.Context) {
	messageID := c.Param("id")
	if messageID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Missing message ID",
			"message": "Message ID is required",
		})
		return
	}

	// This is a simplified implementation
	// In a real system, you would track message status in a separate data structure
	response := MessageResponse{
		ID:        messageID,
		Status:    "unknown",
		Message:   "Message status retrieved",
		Timestamp: time.Now(),
	}

	c.JSON(http.StatusOK, response)
}

// listTopics returns all available topics
func listTopics(c *gin.Context) {
	// Get all stream keys
	keys, err := rdb.Keys(ctx, "mq:topic:*").Result()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to list topics",
			"message": err.Error(),
		})
		return
	}

	var topics []string
	for _, key := range keys {
		topic := key[9:] // Remove "mq:topic:" prefix
		topics = append(topics, topic)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"topics":  topics,
		"count":   len(topics),
	})
}

// getTopicStats returns statistics for a specific topic
func getTopicStats(c *gin.Context) {
	topic := c.Param("topic")
	if topic == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Missing topic name",
			"message": "Topic name is required",
		})
		return
	}

	streamKey := fmt.Sprintf("mq:topic:%s", topic)
	
	// Get stream info
	info, err := rdb.XInfoStream(ctx, streamKey).Result()
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "Topic not found",
			"message": err.Error(),
		})
		return
	}

	// Get consumer group info
	consumerGroup := fmt.Sprintf("mq:group:%s", topic)
	groups, err := rdb.XInfoGroups(ctx, streamKey).Result()
	if err != nil {
		groups = []redis.XInfoGroup{}
	}

	stats := QueueStats{
		Topic:           topic,
		TotalMessages:   info.EntriesAdded,
		PendingMessages: info.Length,
		ProcessedMessages: info.EntriesAdded - info.Length,
		FailedMessages:  0, // Would need separate tracking
		Consumers:       len(groups),
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"stats":   stats,
	})
}

// createTopic creates a new topic
func createTopic(c *gin.Context) {
	var request struct {
		Topic string `json:"topic" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request",
			"message": err.Error(),
		})
		return
	}

	streamKey := fmt.Sprintf("mq:topic:%s", request.Topic)
	
	// Create stream with initial message
	_, err := rdb.XAdd(ctx, &redis.XAddArgs{
		Stream: streamKey,
		Values: map[string]interface{}{
			"type":    "topic_created",
			"created": time.Now().Unix(),
		},
	}).Result()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to create topic",
			"message": err.Error(),
		})
		return
	}

	// Set expiration for the initial message
	rdb.Expire(ctx, streamKey, time.Hour*24*7) // 7 days

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"topic":   request.Topic,
		"message": "Topic created successfully",
	})
}

// deleteTopic deletes a topic
func deleteTopic(c *gin.Context) {
	topic := c.Param("topic")
	if topic == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Missing topic name",
			"message": "Topic name is required",
		})
		return
	}

	streamKey := fmt.Sprintf("mq:topic:%s", topic)
	
	// Delete the stream
	_, err := rdb.Del(ctx, streamKey).Result()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to delete topic",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"topic":   topic,
		"message": "Topic deleted successfully",
	})
}

// getOverallStats returns overall message queue statistics
func getOverallStats(c *gin.Context) {
	// Get all stream keys
	keys, err := rdb.Keys(ctx, "mq:topic:*").Result()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to get stats",
			"message": err.Error(),
		})
		return
	}

	var totalMessages int64
	var totalTopics int64
	var totalConsumers int64

	for _, key := range keys {
		info, err := rdb.XInfoStream(ctx, key).Result()
		if err != nil {
			continue
		}
		totalMessages += info.EntriesAdded
		totalTopics++

		// Get consumer groups
		groups, err := rdb.XInfoGroups(ctx, key).Result()
		if err == nil {
			totalConsumers += int64(len(groups))
		}
	}

	stats := gin.H{
		"total_topics":    totalTopics,
		"total_messages":  totalMessages,
		"total_consumers": totalConsumers,
		"uptime":          time.Since(startTime).String(),
		"redis_status":    "connected",
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"stats":   stats,
	})
}

// getConsumerStats returns consumer statistics
func getConsumerStats(c *gin.Context) {
	// This would return detailed consumer statistics
	// For now, return a simple response
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"consumers": []gin.H{},
		"message":   "Consumer stats retrieved",
	})
}

// updateTopicStats updates topic statistics
func updateTopicStats(topic, action string) {
	statsKey := fmt.Sprintf("mq:stats:%s", topic)
	
	// Increment counter for the action
	rdb.HIncrBy(ctx, statsKey, action, 1)
	
	// Set expiration
	rdb.Expire(ctx, statsKey, time.Hour*24) // 24 hours
}

// generateMessageID generates a unique message ID
func generateMessageID() string {
	return fmt.Sprintf("msg_%d_%d", time.Now().UnixNano(), time.Now().Unix())
}
