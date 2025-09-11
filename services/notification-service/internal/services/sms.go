package services

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/rs/zerolog/log"
)

// SMSService handles SMS notifications
type SMSService struct {
	config SMSConfig
	client *http.Client
}

// SMSConfig holds SMS service configuration
type SMSConfig struct {
	Provider   string
	APIKey     string
	APISecret  string
	FromNumber string
	BaseURL    string
	MaxRetries int
	RetryDelay time.Duration
	RateLimit  int // messages per second
	DryRun     bool
}

// SMSMessage represents an SMS message
type SMSMessage struct {
	To           string
	From         string
	Body         string
	TemplateID   string
	TemplateData map[string]interface{}
	Priority     string // low, normal, high
	ScheduleAt   *time.Time
	ExpiresAt    *time.Time
}

// SMSResult represents the result of sending an SMS
type SMSResult struct {
	MessageID        string
	To               string
	Status           string
	SentAt           time.Time
	Success          bool
	Error            string
	ProviderResponse map[string]interface{}
}

// SMSProvider interface for different SMS providers
type SMSProvider interface {
	Send(message SMSMessage) (*SMSResult, error)
	SendBulk(messages []SMSMessage) ([]*SMSResult, error)
	GetStatus(messageID string) (*SMSResult, error)
	GetBalance() (float64, error)
}

// TwilioProvider implements SMSProvider for Twilio
type TwilioProvider struct {
	config SMSConfig
	client *http.Client
}

// NetgsmProvider implements SMSProvider for Netgsm
type NetgsmProvider struct {
	config SMSConfig
	client *http.Client
}

// NewSMSService creates a new SMS service instance
func NewSMSService(config SMSConfig) *SMSService {
	return &SMSService{
		config: config,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// SendSMS sends a single SMS
func (s *SMSService) SendSMS(message SMSMessage) (*SMSResult, error) {
	log.Info().
		Str("to", message.To).
		Str("body", truncateString(message.Body, 50)).
		Msg("Sending SMS")

	// Set default values
	if message.From == "" {
		message.From = s.config.FromNumber
	}

	// Validate message
	if err := s.validateMessage(message); err != nil {
		return nil, fmt.Errorf("message validation failed: %w", err)
	}

	// Get provider
	provider, err := s.getProvider()
	if err != nil {
		return nil, fmt.Errorf("failed to get SMS provider: %w", err)
	}

	// Send with retries
	var result *SMSResult
	var lastErr error

	for attempt := 0; attempt <= s.config.MaxRetries; attempt++ {
		if attempt > 0 {
			log.Info().Int("attempt", attempt).Msg("Retrying SMS send")
			time.Sleep(s.config.RetryDelay * time.Duration(attempt))
		}

		result, lastErr = provider.Send(message)
		if lastErr == nil {
			break
		}

		log.Warn().
			Int("attempt", attempt+1).
			Err(lastErr).
			Msg("SMS send attempt failed")
	}

	if lastErr != nil {
		log.Error().Err(lastErr).Msg("All SMS send attempts failed")
		return &SMSResult{
			To:      message.To,
			Status:  "failed",
			Success: false,
			Error:   lastErr.Error(),
		}, lastErr
	}

	log.Info().
		Str("messageID", result.MessageID).
		Str("to", result.To).
		Msg("SMS sent successfully")

	return result, nil
}

// SendBulkSMS sends SMS messages to multiple recipients
func (s *SMSService) SendBulkSMS(messages []SMSMessage) ([]*SMSResult, error) {
	log.Info().Int("count", len(messages)).Msg("Sending bulk SMS")

	if len(messages) == 0 {
		return []*SMSResult{}, nil
	}

	// Validate all messages
	for i, message := range messages {
		if err := s.validateMessage(message); err != nil {
			return nil, fmt.Errorf("message %d validation failed: %w", i, err)
		}
	}

	// Get provider
	provider, err := s.getProvider()
	if err != nil {
		return nil, fmt.Errorf("failed to get SMS provider: %w", err)
	}

	// Send bulk messages
	results, err := provider.SendBulk(messages)
	if err != nil {
		log.Error().Err(err).Msg("Bulk SMS send failed")
		return nil, err
	}

	// Log results
	successCount := 0
	failureCount := 0
	for _, result := range results {
		if result.Success {
			successCount++
		} else {
			failureCount++
		}
	}

	log.Info().
		Int("total", len(messages)).
		Int("success", successCount).
		Int("failure", failureCount).
		Msg("Bulk SMS send completed")

	return results, nil
}

// SendOTP sends an OTP SMS
func (s *SMSService) SendOTP(phoneNumber string, otpCode string, templateID string) (*SMSResult, error) {
	log.Info().
		Str("phone", phoneNumber).
		Str("template", templateID).
		Msg("Sending OTP SMS")

	message := SMSMessage{
		To:         phoneNumber,
		TemplateID: templateID,
		TemplateData: map[string]interface{}{
			"otp_code":   otpCode,
			"expires_in": "5 dakika",
		},
		Priority:  "high",
		ExpiresAt: &time.Time{}.Add(5 * time.Minute),
	}

	return s.SendSMS(message)
}

// SendWelcomeSMS sends a welcome SMS to new users
func (s *SMSService) SendWelcomeSMS(phoneNumber string, userName string, companyName string) (*SMSResult, error) {
	message := SMSMessage{
		To:         phoneNumber,
		TemplateID: "welcome",
		TemplateData: map[string]interface{}{
			"user_name":    userName,
			"company_name": companyName,
		},
		Priority: "normal",
	}

	return s.SendSMS(message)
}

// SendAlertSMS sends an alert SMS
func (s *SMSService) SendAlertSMS(phoneNumber string, alertType string, description string, severity string) (*SMSResult, error) {
	message := SMSMessage{
		To:         phoneNumber,
		TemplateID: "alert",
		TemplateData: map[string]interface{}{
			"alert_type":  alertType,
			"description": description,
			"severity":    severity,
			"timestamp":   time.Now().Format("02.01.2006 15:04"),
		},
		Priority: "high",
	}

	return s.SendSMS(message)
}

// SendReminderSMS sends a reminder SMS
func (s *SMSService) SendReminderSMS(phoneNumber string, reminderType string, dueDate string, actionRequired string) (*SMSResult, error) {
	message := SMSMessage{
		To:         phoneNumber,
		TemplateID: "reminder",
		TemplateData: map[string]interface{}{
			"reminder_type":   reminderType,
			"due_date":        dueDate,
			"action_required": actionRequired,
		},
		Priority: "normal",
	}

	return s.SendSMS(message)
}

// GetSMSStatus gets the status of a sent SMS
func (s *SMSService) GetSMSStatus(messageID string) (*SMSResult, error) {
	log.Info().Str("messageID", messageID).Msg("Getting SMS status")

	provider, err := s.getProvider()
	if err != nil {
		return nil, fmt.Errorf("failed to get SMS provider: %w", err)
	}

	result, err := provider.GetStatus(messageID)
	if err != nil {
		log.Error().Err(err).Str("messageID", messageID).Msg("Failed to get SMS status")
		return nil, err
	}

	return result, nil
}

// GetBalance gets the SMS account balance
func (s *SMSService) GetBalance() (float64, error) {
	log.Info().Msg("Getting SMS account balance")

	provider, err := s.getProvider()
	if err != nil {
		return 0, fmt.Errorf("failed to get SMS provider: %w", err)
	}

	balance, err := provider.GetBalance()
	if err != nil {
		log.Error().Err(err).Msg("Failed to get SMS balance")
		return 0, err
	}

	log.Info().Float64("balance", balance).Msg("SMS balance retrieved")
	return balance, nil
}

// TestConnection tests the SMS service connection
func (s *SMSService) TestConnection() error {
	log.Info().Msg("Testing SMS service connection")

	// Send a test SMS to the service number
	testMessage := SMSMessage{
		To:   s.config.FromNumber, // Send to self
		Body: "Bu bir test mesajıdır. SMS servisi başarıyla çalışıyor.",
	}

	_, err := s.SendSMS(testMessage)
	if err != nil {
		log.Error().Err(err).Msg("SMS service connection test failed")
		return fmt.Errorf("connection test failed: %w", err)
	}

	log.Info().Msg("SMS service connection test successful")
	return nil
}

// validateMessage validates an SMS message
func (s *SMSService) validateMessage(message SMSMessage) error {
	if message.To == "" {
		return fmt.Errorf("recipient phone number is required")
	}

	if message.Body == "" && message.TemplateID == "" {
		return fmt.Errorf("message body or template ID is required")
	}

	if message.Body != "" && len(message.Body) > 160 {
		return fmt.Errorf("message body exceeds 160 characters")
	}

	// Validate phone number format (basic validation)
	if !isValidPhoneNumber(message.To) {
		return fmt.Errorf("invalid phone number format: %s", message.To)
	}

	return nil
}

// getProvider returns the appropriate SMS provider
func (s *SMSService) getProvider() (SMSProvider, error) {
	switch strings.ToLower(s.config.Provider) {
	case "twilio":
		return &TwilioProvider{
			config: s.config,
			client: s.client,
		}, nil
	case "netgsm":
		return &NetgsmProvider{
			config: s.config,
			client: s.client,
		}, nil
	default:
		return nil, fmt.Errorf("unsupported SMS provider: %s", s.config.Provider)
	}
}

// TwilioProvider implementation
func (p *TwilioProvider) Send(message SMSMessage) (*SMSResult, error) {
	// Twilio API endpoint
	url := fmt.Sprintf("%s/2010-04-01/Accounts/%s/Messages.json", p.config.BaseURL, p.config.APISecret)

	// Prepare form data
	formData := url.Values{}
	formData.Set("To", message.To)
	formData.Set("From", message.From)
	formData.Set("Body", message.Body)

	// Make request
	resp, err := p.client.PostForm(url, formData)
	if err != nil {
		return nil, fmt.Errorf("Twilio API request failed: %w", err)
	}
	defer resp.Body.Close()

	// Parse response
	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode Twilio response: %w", err)
	}

	// Check for errors
	if resp.StatusCode != http.StatusCreated {
		errorMsg := "unknown error"
		if errMsg, ok := result["message"].(string); ok {
			errorMsg = errMsg
		}
		return nil, fmt.Errorf("Twilio API error: %s", errorMsg)
	}

	// Extract message ID
	messageID := ""
	if sid, ok := result["sid"].(string); ok {
		messageID = sid
	}

	return &SMSResult{
		MessageID:        messageID,
		To:               message.To,
		Status:           "sent",
		SentAt:           time.Now(),
		Success:          true,
		ProviderResponse: result,
	}, nil
}

func (p *TwilioProvider) SendBulk(messages []SMSMessage) ([]*SMSResult, error) {
	var results []*SMSResult

	for _, message := range messages {
		result, err := p.Send(message)
		if err != nil {
			result = &SMSResult{
				To:      message.To,
				Status:  "failed",
				Success: false,
				Error:   err.Error(),
			}
		}
		results = append(results, result)
	}

	return results, nil
}

func (p *TwilioProvider) GetStatus(messageID string) (*SMSResult, error) {
	url := fmt.Sprintf("%s/2010-04-01/Accounts/%s/Messages/%s.json", p.config.BaseURL, p.config.APISecret, messageID)

	resp, err := p.client.Get(url)
	if err != nil {
		return nil, fmt.Errorf("Twilio API request failed: %w", err)
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode Twilio response: %w", err)
	}

	status := "unknown"
	if statusStr, ok := result["status"].(string); ok {
		status = statusStr
	}

	return &SMSResult{
		MessageID:        messageID,
		Status:           status,
		Success:          status == "delivered",
		ProviderResponse: result,
	}, nil
}

func (p *TwilioProvider) GetBalance() (float64, error) {
	url := fmt.Sprintf("%s/2010-04-01/Accounts/%s/Balance.json", p.config.BaseURL, p.config.APISecret)

	resp, err := p.client.Get(url)
	if err != nil {
		return 0, fmt.Errorf("Twilio API request failed: %w", err)
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return 0, fmt.Errorf("failed to decode Twilio response: %w", err)
	}

	balance := 0.0
	if balanceStr, ok := result["balance"].(string); ok {
		if parsed, err := parseFloat(balanceStr); err == nil {
			balance = parsed
		}
	}

	return balance, nil
}

// NetgsmProvider implementation
func (p *NetgsmProvider) Send(message SMSMessage) (*SMSResult, error) {
	// Netgsm API endpoint
	url := fmt.Sprintf("%s/sms/send/get", p.config.BaseURL)

	// Prepare query parameters
	params := url.Values{}
	params.Set("usercode", p.config.APIKey)
	params.Set("password", p.config.APISecret)
	params.Set("gsmno", message.To)
	params.Set("message", message.Body)
	params.Set("msgheader", message.From)
	params.Set("dil", "TR")

	// Make request
	resp, err := p.client.Get(fmt.Sprintf("%s?%s", url, params.Encode()))
	if err != nil {
		return nil, fmt.Errorf("Netgsm API request failed: %w", err)
	}
	defer resp.Body.Close()

	// Parse response
	var response string
	if _, err := fmt.Fscanf(resp.Body, "%s", &response); err != nil {
		return nil, fmt.Errorf("failed to read Netgsm response: %w", err)
	}

	// Check response code
	if !strings.HasPrefix(response, "00") {
		return nil, fmt.Errorf("Netgsm API error: %s", response)
	}

	// Extract message ID
	parts := strings.Split(response, " ")
	messageID := ""
	if len(parts) > 1 {
		messageID = parts[1]
	}

	return &SMSResult{
		MessageID:        messageID,
		To:               message.To,
		Status:           "sent",
		SentAt:           time.Now(),
		Success:          true,
		ProviderResponse: map[string]interface{}{"response": response},
	}, nil
}

func (p *NetgsmProvider) SendBulk(messages []SMSMessage) ([]*SMSResult, error) {
	var results []*SMSResult

	for _, message := range messages {
		result, err := p.Send(message)
		if err != nil {
			result = &SMSResult{
				To:      message.To,
				Status:  "failed",
				Success: false,
				Error:   err.Error(),
			}
		}
		results = append(results, result)
	}

	return results, nil
}

func (p *NetgsmProvider) GetStatus(messageID string) (*SMSResult, error) {
	// Netgsm doesn't provide detailed status, return basic info
	return &SMSResult{
		MessageID: messageID,
		Status:    "unknown",
		Success:   false,
		Error:     "Netgsm doesn't support message status queries",
	}, nil
}

func (p *NetgsmProvider) GetBalance() (float64, error) {
	url := fmt.Sprintf("%s/balance/list", p.config.BaseURL)

	params := url.Values{}
	params.Set("usercode", p.config.APIKey)
	params.Set("password", p.config.APISecret)

	resp, err := p.client.Get(fmt.Sprintf("%s?%s", url, params.Encode()))
	if err != nil {
		return 0, fmt.Errorf("Netgsm API request failed: %w", err)
	}
	defer resp.Body.Close()

	var response string
	if _, err := fmt.Fscanf(resp.Body, "%s", &response); err != nil {
		return 0, fmt.Errorf("failed to read Netgsm response: %w", err)
	}

	// Parse balance from response
	balance := 0.0
	if parsed, err := parseFloat(response); err == nil {
		balance = parsed
	}

	return balance, nil
}

// Helper functions
func isValidPhoneNumber(phone string) bool {
	// Basic phone number validation
	phone = strings.TrimSpace(phone)

	// Remove common prefixes
	phone = strings.TrimPrefix(phone, "+")
	phone = strings.TrimPrefix(phone, "00")

	// Check if it's a valid Turkish mobile number
	if strings.HasPrefix(phone, "90") {
		phone = strings.TrimPrefix(phone, "90")
	}

	if strings.HasPrefix(phone, "0") {
		phone = strings.TrimPrefix(phone, "0")
	}

	// Turkish mobile numbers start with 5 and are 10 digits
	return len(phone) == 10 && strings.HasPrefix(phone, "5")
}

func parseFloat(s string) (float64, error) {
	// Remove any non-numeric characters except decimal point
	s = strings.TrimSpace(s)
	var result float64
	_, err := fmt.Sscanf(s, "%f", &result)
	return result, err
}
