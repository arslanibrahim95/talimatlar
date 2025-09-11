package api

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"claude-talimat-notifications/internal/services"
	"claude-talimat-notifications/models"
)

type NotificationHandler struct {
	notificationService *services.NotificationService
	emailService        *services.EmailService
	smsService          *services.SMSService
	pushService         *services.PushService
}

func NewNotificationHandler(
	notificationService *services.NotificationService,
	emailService *services.EmailService,
	smsService *services.SMSService,
	pushService *services.PushService,
) *NotificationHandler {
	return &NotificationHandler{
		notificationService: notificationService,
		emailService:        emailService,
		smsService:          smsService,
		pushService:         pushService,
	}
}

// SendNotification handles sending a single notification
func (h *NotificationHandler) SendNotification(c *gin.Context) {
	var request struct {
		Type        string                 `json:"type" binding:"required"`
		RecipientID string                 `json:"recipient_id" binding:"required"`
		Title       string                 `json:"title" binding:"required"`
		Message     string                 `json:"message" binding:"required"`
		Data        map[string]interface{} `json:"data,omitempty"`
		Priority    string                 `json:"priority,omitempty"`
		Channels    []string               `json:"channels,omitempty"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request data: " + err.Error(),
		})
		return
	}

	// Create notification record
	notification := &models.Notification{
		ID:        uuid.New().String(),
		Type:      request.Type,
		Recipient: request.RecipientID,
		Title:     request.Title,
		Message:   request.Message,
		Data:      request.Data,
		Priority:  request.Priority,
		Channels:  request.Channels,
		Status:    "pending",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	// Save notification to database
	if err := h.notificationService.CreateNotification(notification); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to create notification: " + err.Error(),
		})
		return
	}

	// Send notification through appropriate channels
	go func() {
		if err := h.sendNotification(notification); err != nil {
			// Update status to failed
			notification.Status = "failed"
			notification.UpdatedAt = time.Now()
			h.notificationService.UpdateNotification(notification)
		}
	}()

	c.JSON(http.StatusOK, gin.H{
		"success":         true,
		"notification_id": notification.ID,
		"message":         "Notification queued for delivery",
	})
}

// SendBulkNotifications handles sending multiple notifications
func (h *NotificationHandler) SendBulkNotifications(c *gin.Context) {
	var request struct {
		Type         string                 `json:"type" binding:"required"`
		RecipientIDs []string               `json:"recipient_ids" binding:"required"`
		Title        string                 `json:"title" binding:"required"`
		Message      string                 `json:"message" binding:"required"`
		Data         map[string]interface{} `json:"data,omitempty"`
		Priority     string                 `json:"priority,omitempty"`
		Channels     []string               `json:"channels,omitempty"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request data: " + err.Error(),
		})
		return
	}

	var notifications []*models.Notification
	var notificationIDs []string

	// Create notifications for each recipient
	for _, recipientID := range request.RecipientIDs {
		notification := &models.Notification{
			ID:        uuid.New().String(),
			Type:      request.Type,
			Recipient: recipientID,
			Title:     request.Title,
			Message:   request.Message,
			Data:      request.Data,
			Priority:  request.Priority,
			Channels:  request.Channels,
			Status:    "pending",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}

		notifications = append(notifications, notification)
		notificationIDs = append(notificationIDs, notification.ID)
	}

	// Save all notifications to database
	if err := h.notificationService.CreateBulkNotifications(notifications); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to create notifications: " + err.Error(),
		})
		return
	}

	// Send notifications asynchronously
	go func() {
		for _, notification := range notifications {
			if err := h.sendNotification(notification); err != nil {
				// Update status to failed
				notification.Status = "failed"
				notification.UpdatedAt = time.Now()
				h.notificationService.UpdateNotification(notification)
			}
		}
	}()

	c.JSON(http.StatusOK, gin.H{
		"success":          true,
		"notification_ids": notificationIDs,
		"message":          "Bulk notifications queued for delivery",
	})
}

// GetNotificationStatus returns the status of a specific notification
func (h *NotificationHandler) GetNotificationStatus(c *gin.Context) {
	notificationID := c.Param("id")
	if notificationID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Notification ID is required",
		})
		return
	}

	notification, err := h.notificationService.GetNotification(notificationID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Notification not found: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    notification,
	})
}

// GetNotificationHistory returns notification history with pagination
func (h *NotificationHandler) GetNotificationHistory(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	recipientID := c.Query("recipient_id")
	status := c.Query("status")
	notificationType := c.Query("type")

	filters := map[string]interface{}{
		"recipient_id": recipientID,
		"status":       status,
		"type":         notificationType,
	}

	notifications, total, err := h.notificationService.GetNotificationHistory(page, limit, filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to get notification history: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"notifications": notifications,
			"pagination": gin.H{
				"page":        page,
				"limit":       limit,
				"total":       total,
				"total_pages": (total + limit - 1) / limit,
			},
		},
	})
}

// GetTemplates returns available notification templates
func (h *NotificationHandler) GetTemplates(c *gin.Context) {
	templates, err := h.notificationService.GetTemplates()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to get templates: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    templates,
	})
}

// CreateTemplate creates a new notification template
func (h *NotificationHandler) CreateTemplate(c *gin.Context) {
	var template models.NotificationTemplate
	if err := c.ShouldBindJSON(&template); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid template data: " + err.Error(),
		})
		return
	}

	template.ID = uuid.New().String()
	template.CreatedAt = time.Now()
	template.UpdatedAt = time.Now()

	if err := h.notificationService.CreateTemplate(&template); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to create template: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    template,
	})
}

// UpdateTemplate updates an existing notification template
func (h *NotificationHandler) UpdateTemplate(c *gin.Context) {
	templateID := c.Param("id")
	if templateID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Template ID is required",
		})
		return
	}

	var updateData map[string]interface{}
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid update data: " + err.Error(),
		})
		return
	}

	updateData["updated_at"] = time.Now()

	if err := h.notificationService.UpdateTemplate(templateID, updateData); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to update template: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Template updated successfully",
	})
}

// DeleteTemplate deletes a notification template
func (h *NotificationHandler) DeleteTemplate(c *gin.Context) {
	templateID := c.Param("id")
	if templateID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Template ID is required",
		})
		return
	}

	if err := h.notificationService.DeleteTemplate(templateID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to delete template: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Template deleted successfully",
	})
}

// GetUserPreferences returns notification preferences for a user
func (h *NotificationHandler) GetUserPreferences(c *gin.Context) {
	userID := c.Param("user_id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "User ID is required",
		})
		return
	}

	preferences, err := h.notificationService.GetUserPreferences(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "User preferences not found: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    preferences,
	})
}

// UpdateUserPreferences updates notification preferences for a user
func (h *NotificationHandler) UpdateUserPreferences(c *gin.Context) {
	userID := c.Param("user_id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "User ID is required",
		})
		return
	}

	var preferences map[string]interface{}
	if err := c.ShouldBindJSON(&preferences); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid preferences data: " + err.Error(),
		})
		return
	}

	if err := h.notificationService.UpdateUserPreferences(userID, preferences); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to update preferences: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "User preferences updated successfully",
	})
}

// TestNotification sends a test notification
func (h *NotificationHandler) TestNotification(c *gin.Context) {
	var request struct {
		Type      string `json:"type" binding:"required"`
		Recipient string `json:"recipient" binding:"required"`
		Channel   string `json:"channel" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request data: " + err.Error(),
		})
		return
	}

	// Send test notification
	var err error
	switch request.Channel {
	case "email":
		err = h.emailService.SendTestEmail(request.Recipient)
	case "sms":
		err = h.smsService.SendTestSMS(request.Recipient)
	case "push":
		err = h.pushService.SendTestPush(request.Recipient)
	default:
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Unsupported channel: " + request.Channel,
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to send test notification: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Test notification sent successfully",
	})
}

// HealthCheck returns service health status
func (h *NotificationHandler) HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":    "healthy",
		"service":   "notification-service",
		"timestamp": time.Now().Unix(),
	})
}

// sendNotification sends a notification through appropriate channels
func (h *NotificationHandler) sendNotification(notification *models.Notification) error {
	var lastError error

	// Send through each configured channel
	for _, channel := range notification.Channels {
		var err error

		switch channel {
		case "email":
			err = h.emailService.SendEmail(notification)
		case "sms":
			err = h.smsService.SendSMS(notification)
		case "push":
			err = h.pushService.SendPush(notification)
		case "in_app":
			err = h.notificationService.SendInAppNotification(notification)
		}

		if err != nil {
			lastError = err
			// Continue with other channels even if one fails
		}
	}

	// Update notification status
	if lastError == nil {
		notification.Status = "delivered"
	} else {
		notification.Status = "failed"
	}
	notification.UpdatedAt = time.Now()

	return h.notificationService.UpdateNotification(notification)
}
