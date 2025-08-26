package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/sirupsen/logrus"

	"claude-notification-service/config"
	"claude-notification-service/handlers"
	"claude-notification-service/middleware"
	"claude-notification-service/services"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// Initialize logger
	logger := logrus.New()
	logger.SetFormatter(&logrus.JSONFormatter{})
	logger.SetOutput(os.Stdout)

	// Load configuration
	cfg := config.Load()

	// Initialize services
	notificationService := services.NewNotificationService(cfg, logger)
	emailService := services.NewEmailService(cfg, logger)
	smsService := services.NewSMSService(cfg, logger)

	// Set Gin mode
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Create Gin router
	router := gin.New()

	// Add middleware
	router.Use(gin.Logger())
	router.Use(gin.Recovery())
	router.Use(middleware.CORS())
	router.Use(middleware.RequestID())
	router.Use(middleware.Logger(logger))

	// Initialize handlers
	notificationHandler := handlers.NewNotificationHandler(notificationService, logger)
	healthHandler := handlers.NewHealthHandler(logger)

	// Setup routes
	setupRoutes(router, notificationHandler, healthHandler)

	// Create HTTP server
	server := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server in a goroutine
	go func() {
		logger.WithFields(logrus.Fields{
			"port":        cfg.Port,
			"environment": cfg.Environment,
		}).Info("Starting Notification Service")

		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.WithError(err).Fatal("Failed to start server")
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("Shutting down server...")

	// Create context with timeout for graceful shutdown
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Shutdown server gracefully
	if err := server.Shutdown(ctx); err != nil {
		logger.WithError(err).Fatal("Server forced to shutdown")
	}

	logger.Info("Server exited")
}

func setupRoutes(router *gin.Engine, notificationHandler *handlers.NotificationHandler, healthHandler *handlers.HealthHandler) {
	// Health check
	router.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"service": "Claude Notification Service",
			"version": "1.0.0",
			"status":  "running",
		})
	})

	router.GET("/health", healthHandler.HealthCheck)

	// API routes
	api := router.Group("/api/v1")
	{
		// Notification routes
		notifications := api.Group("/notifications")
		{
			notifications.POST("/send", notificationHandler.SendNotification)
			notifications.POST("/email", notificationHandler.SendEmail)
			notifications.POST("/sms", notificationHandler.SendSMS)
			notifications.POST("/push", notificationHandler.SendPushNotification)
			notifications.POST("/bulk", notificationHandler.SendBulkNotifications)
		}

		// Template routes
		templates := api.Group("/templates")
		{
			templates.GET("/", notificationHandler.GetTemplates)
			templates.POST("/", notificationHandler.CreateTemplate)
			templates.GET("/:id", notificationHandler.GetTemplate)
			templates.PUT("/:id", notificationHandler.UpdateTemplate)
			templates.DELETE("/:id", notificationHandler.DeleteTemplate)
		}

		// Subscription routes
		subscriptions := api.Group("/subscriptions")
		{
			subscriptions.POST("/", notificationHandler.CreateSubscription)
			subscriptions.GET("/:id", notificationHandler.GetSubscription)
			subscriptions.PUT("/:id", notificationHandler.UpdateSubscription)
			subscriptions.DELETE("/:id", notificationHandler.DeleteSubscription)
		}

		// Settings routes
		settings := api.Group("/settings")
		{
			settings.GET("/", notificationHandler.GetSettings)
			settings.PUT("/", notificationHandler.UpdateSettings)
		}
	}
}
