package main

import (
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// NotificationRequest represents a notification request
type NotificationRequest struct {
	ID        string                 `json:"id"`
	Type      string                 `json:"type"`      // email, sms, push, inapp
	Recipient string                 `json:"recipient"` // email address, phone number, user ID
	Title     string                 `json:"title"`
	Message   string                 `json:"message"`
	Priority  string                 `json:"priority"` // low, normal, high, urgent
	Category  string                 `json:"category"`
	Data      map[string]interface{} `json:"data,omitempty"`
	Schedule  *time.Time             `json:"schedule,omitempty"`
}

// NotificationResponse represents a notification response
type NotificationResponse struct {
	ID        string    `json:"id"`
	Status    string    `json:"status"` // pending, sent, failed
	Message   string    `json:"message"`
	Timestamp time.Time `json:"timestamp"`
}

// HealthResponse represents health check response
type HealthResponse struct {
	Status    string `json:"status"`
	Service   string `json:"service"`
	Timestamp int64  `json:"timestamp"`
	Version   string `json:"version"`
	Uptime    string `json:"uptime"`
}

var startTime = time.Now()

func main() {
	// Set Gin to release mode
	gin.SetMode(gin.ReleaseMode)

	// Create router
	router := gin.New()

	// Add middleware
	router.Use(gin.Logger())
	router.Use(gin.Recovery())
	router.Use(corsMiddleware())

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		uptime := time.Since(startTime).String()
		response := HealthResponse{
			Status:    "healthy",
			Service:   "notification-service",
			Timestamp: time.Now().Unix(),
			Version:   "1.0.0",
			Uptime:    uptime,
		}
		c.JSON(http.StatusOK, response)
	})

	// Root endpoint
	router.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"service": "Claude Notification Service",
			"version": "1.0.0",
			"status":  "running",
			"endpoints": gin.H{
				"health": "/health",
				"send":   "/api/v1/notifications/send",
				"status": "/api/v1/notifications/:id/status",
			},
		})
	})

	// API v1 routes
	api := router.Group("/api/v1")
	{
		// Notifications group
		notifications := api.Group("/notifications")
		{
			// Send notification
			notifications.POST("/send", sendNotification)

			// Get notification status
			notifications.GET("/:id/status", getNotificationStatus)

			// Send bulk notifications
			notifications.POST("/send-bulk", sendBulkNotifications)
		}

		// Templates group
		templates := api.Group("/templates")
		{
			// Get available templates
			templates.GET("/", getTemplates)

			// Get template by ID
			templates.GET("/:id", getTemplate)
		}

		// Statistics group
		stats := api.Group("/stats")
		{
			// Get notification statistics
			stats.GET("/", getNotificationStats)
		}
	}

	// Start server
	log.Printf("Starting Notification Service on port 8007")
	if err := router.Run(":8007"); err != nil {
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

// sendNotification handles single notification requests
func sendNotification(c *gin.Context) {
	var request NotificationRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request",
			"message": err.Error(),
		})
		return
	}

	// Validate required fields
	if request.Type == "" || request.Recipient == "" || request.Title == "" || request.Message == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Missing required fields",
			"message": "Type, recipient, title, and message are required",
		})
		return
	}

	// Generate notification ID if not provided
	if request.ID == "" {
		request.ID = generateID()
	}

	// Set default values
	if request.Priority == "" {
		request.Priority = "normal"
	}
	if request.Category == "" {
		request.Category = "general"
	}

	// Simulate notification processing
	response := NotificationResponse{
		ID:        request.ID,
		Status:    "pending",
		Message:   "Notification queued for delivery",
		Timestamp: time.Now(),
	}

	log.Printf("Notification queued: ID=%s, Type=%s, Recipient=%s", request.ID, request.Type, request.Recipient)

	c.JSON(http.StatusOK, response)
}

// sendBulkNotifications handles bulk notification requests
func sendBulkNotifications(c *gin.Context) {
	var request struct {
		Notifications []NotificationRequest `json:"notifications"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request",
			"message": err.Error(),
		})
		return
	}

	if len(request.Notifications) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "No notifications provided",
			"message": "At least one notification is required",
		})
		return
	}

	// Process each notification
	var responses []NotificationResponse
	for _, notification := range request.Notifications {
		// Generate ID if not provided
		if notification.ID == "" {
			notification.ID = generateID()
		}

		// Set default values
		if notification.Priority == "" {
			notification.Priority = "normal"
		}
		if notification.Category == "" {
			notification.Category = "general"
		}

		response := NotificationResponse{
			ID:        notification.ID,
			Status:    "pending",
			Message:   "Notification queued for delivery",
			Timestamp: time.Now(),
		}

		responses = append(responses, response)
		log.Printf("Bulk notification queued: ID=%s, Type=%s, Recipient=%s", notification.ID, notification.Type, notification.Recipient)
	}

	c.JSON(http.StatusOK, gin.H{
		"success":       true,
		"total":         len(responses),
		"notifications": responses,
		"message":       "Bulk notifications queued for delivery",
	})
}

// getNotificationStatus returns the status of a notification
func getNotificationStatus(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Missing notification ID",
			"message": "Notification ID is required",
		})
		return
	}

	// Simulate status lookup
	status := "sent"              // In real implementation, this would query a database
	if time.Now().Unix()%3 == 0 { // Simulate some failed notifications
		status = "failed"
	}

	response := NotificationResponse{
		ID:        id,
		Status:    status,
		Message:   "Notification status retrieved",
		Timestamp: time.Now(),
	}

	c.JSON(http.StatusOK, response)
}

// getTemplates returns available notification templates
func getTemplates(c *gin.Context) {
	templates := []gin.H{
		{
			"id":          "welcome",
			"name":        "Welcome Template",
			"type":        "email",
			"category":    "onboarding",
			"description": "Welcome email for new users",
		},
		{
			"id":          "reminder",
			"name":        "Reminder Template",
			"type":        "sms",
			"category":    "reminder",
			"description": "SMS reminder for appointments",
		},
		{
			"id":          "alert",
			"name":        "Alert Template",
			"type":        "push",
			"category":    "security",
			"description": "Push notification for security alerts",
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"templates": templates,
		"total":     len(templates),
	})
}

// getTemplate returns a specific template by ID
func getTemplate(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Missing template ID",
			"message": "Template ID is required",
		})
		return
	}

	// Simulate template lookup
	template := gin.H{
		"id":          id,
		"name":        "Template " + id,
		"type":        "email",
		"category":    "general",
		"description": "Template description for " + id,
		"variables":   []string{"name", "company", "date"},
		"created_at":  time.Now().Format(time.RFC3339),
	}

	c.JSON(http.StatusOK, gin.H{
		"success":  true,
		"template": template,
	})
}

// getNotificationStats returns notification statistics
func getNotificationStats(c *gin.Context) {
	stats := gin.H{
		"total":        150,
		"sent":         120,
		"failed":       15,
		"pending":      15,
		"success_rate": 80.0,
		"by_type": gin.H{
			"email": 50,
			"sms":   30,
			"push":  40,
			"inapp": 30,
		},
		"by_category": gin.H{
			"general":    40,
			"onboarding": 30,
			"reminder":   35,
			"security":   25,
			"marketing":  20,
		},
		"period": "last_24_hours",
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"stats":   stats,
	})
}

// generateID generates a unique ID
func generateID() string {
	return "notif_" + time.Now().Format("20060102150405") + "_" + time.Now().Format("000000000")
}
