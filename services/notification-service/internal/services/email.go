package services

import (
	"bytes"
	"crypto/tls"
	"fmt"
	"html/template"
	"io"
	"strings"
	"time"

	"github.com/rs/zerolog/log"
	"gopkg.in/gomail.v2"
)

// EmailService handles email notifications
type EmailService struct {
	config EmailConfig
}

// EmailConfig holds email service configuration
type EmailConfig struct {
	Host     string
	Port     int
	Username string
	Password string
	From     string
	FromName string
	UseTLS   bool
	UseSSL   bool
}

// EmailMessage represents an email message
type EmailMessage struct {
	To          []string
	Cc          []string
	Bcc         []string
	Subject     string
	Body        string
	HTMLBody    string
	Attachments []EmailAttachment
	Headers     map[string]string
}

// EmailAttachment represents an email attachment
type EmailAttachment struct {
	Name        string
	ContentType string
	Data        []byte
}

// EmailTemplate represents an email template
type EmailTemplate struct {
	Name    string
	Subject string
	HTML    string
	Text    string
}

// EmailResult represents the result of sending an email
type EmailResult struct {
	MessageID string
	SentAt    time.Time
	Success   bool
	Error     string
}

// NewEmailService creates a new email service instance
func NewEmailService(config EmailConfig) *EmailService {
	return &EmailService{
		config: config,
	}
}

// SendEmail sends a single email
func (s *EmailService) SendEmail(message EmailMessage) (*EmailResult, error) {
	log.Info().
		Str("to", strings.Join(message.To, ",")).
		Str("subject", message.Subject).
		Msg("Sending email")

	// Create gomail message
	m := gomail.NewMessage()

	// Set headers
	m.SetHeader("From", fmt.Sprintf("%s <%s>", s.config.FromName, s.config.From))
	m.SetHeader("To", message.To...)
	if len(message.Cc) > 0 {
		m.SetHeader("Cc", message.Cc...)
	}
	if len(message.Bcc) > 0 {
		m.SetHeader("Bcc", message.Bcc...)
	}
	m.SetHeader("Subject", message.Subject)

	// Set custom headers
	for key, value := range message.Headers {
		m.SetHeader(key, value)
	}

	// Set body
	if message.HTMLBody != "" {
		m.SetBody("text/html", message.HTMLBody)
		if message.Body != "" {
			m.AddAlternative("text/plain", message.Body)
		}
	} else {
		m.SetBody("text/plain", message.Body)
	}

	// Add attachments
	for _, attachment := range message.Attachments {
		m.Attach(attachment.Name, gomail.SetCopyFunc(func(w io.Writer) error {
			_, err := w.Write(attachment.Data)
			return err
		}))
	}

	// Create dialer
	dialer := gomail.NewDialer(s.config.Host, s.config.Port, s.config.Username, s.config.Password)

	if s.config.UseTLS {
		dialer.TLSConfig = &tls.Config{InsecureSkipVerify: false}
	}
	if s.config.UseSSL {
		dialer.SSL = true
	}

	// Send email
	if err := dialer.DialAndSend(m); err != nil {
		log.Error().Err(err).Msg("Failed to send email")
		return &EmailResult{
			Success: false,
			Error:   err.Error(),
		}, err
	}

	result := &EmailResult{
		MessageID: generateMessageID(),
		SentAt:    time.Now(),
		Success:   true,
	}

	log.Info().
		Str("messageID", result.MessageID).
		Msg("Email sent successfully")

	return result, nil
}

// SendBulkEmail sends emails to multiple recipients
func (s *EmailService) SendBulkEmail(messages []EmailMessage) ([]*EmailResult, error) {
	log.Info().Int("count", len(messages)).Msg("Sending bulk emails")

	var results []*EmailResult
	var errors []error

	// Send emails concurrently (limit concurrency to avoid overwhelming SMTP server)
	semaphore := make(chan struct{}, 10) // Max 10 concurrent sends
	resultsChan := make(chan *EmailResult, len(messages))

	for _, message := range messages {
		go func(msg EmailMessage) {
			semaphore <- struct{}{}        // Acquire semaphore
			defer func() { <-semaphore }() // Release semaphore

			result, err := s.SendEmail(msg)
			if err != nil {
				result = &EmailResult{
					Success: false,
					Error:   err.Error(),
				}
			}
			resultsChan <- result
		}(message)
	}

	// Collect results
	for i := 0; i < len(messages); i++ {
		result := <-resultsChan
		results = append(results, result)
		if !result.Success {
			errors = append(errors, fmt.Errorf("email %d failed: %s", i, result.Error))
		}
	}

	if len(errors) > 0 {
		log.Warn().Int("errorCount", len(errors)).Msg("Some emails failed to send")
		return results, fmt.Errorf("bulk email send completed with %d errors", len(errors))
	}

	log.Info().Msg("All bulk emails sent successfully")
	return results, nil
}

// SendTemplatedEmail sends an email using a template
func (s *EmailService) SendTemplatedEmail(
	to []string,
	templateName string,
	templateData map[string]interface{},
	subject string,
) (*EmailResult, error) {
	// Load template
	tmpl, err := s.loadTemplate(templateName)
	if err != nil {
		return nil, fmt.Errorf("failed to load template %s: %w", templateName, err)
	}

	// Render template
	htmlBody, textBody, err := s.renderTemplate(tmpl, templateData)
	if err != nil {
		return nil, fmt.Errorf("failed to render template: %w", err)
	}

	message := EmailMessage{
		To:       to,
		Subject:  subject,
		HTMLBody: htmlBody,
		Body:     textBody,
	}

	return s.SendEmail(message)
}

// SendWelcomeEmail sends a welcome email to new users
func (s *EmailService) SendWelcomeEmail(to string, userName string, companyName string) (*EmailResult, error) {
	templateData := map[string]interface{}{
		"UserName":     userName,
		"CompanyName":  companyName,
		"LoginURL":     "https://app.claude-talimat.com/login",
		"SupportEmail": "support@claude-talimat.com",
	}

	return s.SendTemplatedEmail(
		[]string{to},
		"welcome",
		templateData,
		fmt.Sprintf("Hoş Geldiniz - %s", companyName),
	)
}

// SendPasswordResetEmail sends a password reset email
func (s *EmailService) SendPasswordResetEmail(to string, resetToken string, userName string) (*EmailResult, error) {
	resetURL := fmt.Sprintf("https://app.claude-talimat.com/reset-password?token=%s", resetToken)

	templateData := map[string]interface{}{
		"UserName":    userName,
		"ResetURL":    resetURL,
		"ExpiryHours": 24,
	}

	return s.SendTemplatedEmail(
		[]string{to},
		"password_reset",
		templateData,
		"Şifre Sıfırlama Talebi",
	)
}

// SendDocumentNotification sends a notification about a document
func (s *EmailService) SendDocumentNotification(
	to []string,
	documentTitle string,
	documentType string,
	action string,
	documentURL string,
) (*EmailResult, error) {
	templateData := map[string]interface{}{
		"DocumentTitle": documentTitle,
		"DocumentType":  documentType,
		"Action":        action,
		"DocumentURL":   documentURL,
		"Timestamp":     time.Now().Format("02.01.2006 15:04"),
	}

	return s.SendTemplatedEmail(
		to,
		"document_notification",
		templateData,
		fmt.Sprintf("Doküman %s: %s", action, documentTitle),
	)
}

// SendComplianceAlert sends a compliance alert email
func (s *EmailService) SendComplianceAlert(
	to []string,
	alertType string,
	description string,
	severity string,
	actionRequired string,
) (*EmailResult, error) {
	templateData := map[string]interface{}{
		"AlertType":      alertType,
		"Description":    description,
		"Severity":       severity,
		"ActionRequired": actionRequired,
		"Timestamp":      time.Now().Format("02.01.2006 15:04"),
		"DashboardURL":   "https://app.claude-talimat.com/compliance",
	}

	return s.SendTemplatedEmail(
		to,
		"compliance_alert",
		templateData,
		fmt.Sprintf("Uyumluluk Uyarısı: %s", alertType),
	)
}

// SendDailyDigest sends a daily digest email
func (s *EmailService) SendDailyDigest(
	to []string,
	digestData map[string]interface{},
) (*EmailResult, error) {
	templateData := map[string]interface{}{
		"Date":         time.Now().Format("02.01.2006"),
		"DigestData":   digestData,
		"DashboardURL": "https://app.claude-talimat.com/dashboard",
	}

	return s.SendTemplatedEmail(
		to,
		"daily_digest",
		templateData,
		"Günlük Özet - Claude Talimat",
	)
}

// SendWeeklyReport sends a weekly report email
func (s *EmailService) SendWeeklyReport(
	to []string,
	reportData map[string]interface{},
) (*EmailResult, error) {
	templateData := map[string]interface{}{
		"WeekStart":  time.Now().AddDate(0, 0, -7).Format("02.01.2006"),
		"WeekEnd":    time.Now().Format("02.01.2006"),
		"ReportData": reportData,
		"ReportsURL": "https://app.claude-talimat.com/reports",
	}

	return s.SendTemplatedEmail(
		to,
		"weekly_report",
		templateData,
		"Haftalık Rapor - Claude Talimat",
	)
}

// TestConnection tests the email service connection
func (s *EmailService) TestConnection() error {
	log.Info().Msg("Testing email service connection")

	// Create a test message
	testMessage := EmailMessage{
		To:      []string{s.config.From}, // Send to self
		Subject: "Test Connection - Claude Talimat",
		Body:    "Bu bir test mesajıdır. Email servisi başarıyla çalışıyor.",
	}

	// Try to send
	_, err := s.SendEmail(testMessage)
	if err != nil {
		log.Error().Err(err).Msg("Email service connection test failed")
		return fmt.Errorf("connection test failed: %w", err)
	}

	log.Info().Msg("Email service connection test successful")
	return nil
}

// GetQuotaInfo returns email service quota information
func (s *EmailService) GetQuotaInfo() (map[string]interface{}, error) {
	// This is a placeholder - implement based on your email provider's API
	quotaInfo := map[string]interface{}{
		"daily_limit":   1000,
		"daily_sent":    0,
		"monthly_limit": 30000,
		"monthly_sent":  0,
		"remaining":     1000,
		"reset_time":    time.Now().AddDate(0, 0, 1).Format(time.RFC3339),
	}

	return quotaInfo, nil
}

// loadTemplate loads an email template
func (s *EmailService) loadTemplate(templateName string) (*EmailTemplate, error) {
	// In a real implementation, load templates from database or filesystem
	// For now, return a basic template
	templates := map[string]*EmailTemplate{
		"welcome": {
			Name:    "welcome",
			Subject: "Hoş Geldiniz",
			HTML:    `<h1>Hoş Geldiniz {{.UserName}}!</h1><p>{{.CompanyName}} ailesine katıldığınız için teşekkürler.</p>`,
			Text:    "Hoş Geldiniz {{.UserName}}! {{.CompanyName}} ailesine katıldığınız için teşekkürler.",
		},
		"password_reset": {
			Name:    "password_reset",
			Subject: "Şifre Sıfırlama",
			HTML:    `<h1>Şifre Sıfırlama</h1><p>Şifrenizi sıfırlamak için <a href="{{.ResetURL}}">buraya tıklayın</a>.</p>`,
			Text:    "Şifre Sıfırlama\n\nŞifrenizi sıfırlamak için: {{.ResetURL}}",
		},
		"document_notification": {
			Name:    "document_notification",
			Subject: "Doküman Bildirimi",
			HTML:    `<h1>Doküman {{.Action}}</h1><p>{{.DocumentTitle}} dokümanı {{.Action}}.</p>`,
			Text:    "Doküman {{.Action}}\n\n{{.DocumentTitle}} dokümanı {{.Action}}.",
		},
		"compliance_alert": {
			Name:    "compliance_alert",
			Subject: "Uyumluluk Uyarısı",
			HTML:    `<h1>Uyumluluk Uyarısı</h1><p>{{.Description}}</p><p>Gerekli Aksiyon: {{.ActionRequired}}</p>`,
			Text:    "Uyumluluk Uyarısı\n\n{{.Description}}\n\nGerekli Aksiyon: {{.ActionRequired}}",
		},
		"daily_digest": {
			Name:    "daily_digest",
			Subject: "Günlük Özet",
			HTML:    `<h1>Günlük Özet - {{.Date}}</h1><p>Bugünkü aktiviteleri görüntüleyin.</p>`,
			Text:    "Günlük Özet - {{.Date}}\n\nBugünkü aktiviteleri görüntüleyin.",
		},
		"weekly_report": {
			Name:    "weekly_report",
			Subject: "Haftalık Rapor",
			HTML:    `<h1>Haftalık Rapor</h1><p>{{.WeekStart}} - {{.WeekEnd}} arası rapor.</p>`,
			Text:    "Haftalık Rapor\n\n{{.WeekStart}} - {{.WeekEnd}} arası rapor.",
		},
	}

	template, exists := templates[templateName]
	if !exists {
		return nil, fmt.Errorf("template %s not found", templateName)
	}

	return template, nil
}

// renderTemplate renders a template with data
func (s *EmailService) renderTemplate(
	tmpl *EmailTemplate,
	data map[string]interface{},
) (string, string, error) {
	// Render HTML template
	htmlTemplate, err := template.New("html").Parse(tmpl.HTML)
	if err != nil {
		return "", "", fmt.Errorf("failed to parse HTML template: %w", err)
	}

	var htmlBuffer bytes.Buffer
	if err := htmlTemplate.Execute(&htmlBuffer, data); err != nil {
		return "", "", fmt.Errorf("failed to execute HTML template: %w", err)
	}

	// Render text template
	textTemplate, err := template.New("text").Parse(tmpl.Text)
	if err != nil {
		return "", "", fmt.Errorf("failed to parse text template: %w", err)
	}

	var textBuffer bytes.Buffer
	if err := textTemplate.Execute(&textBuffer, data); err != nil {
		return "", "", fmt.Errorf("failed to execute text template: %w", err)
	}

	return htmlBuffer.String(), textBuffer.String(), nil
}

// generateMessageID generates a unique message ID
func generateMessageID() string {
	return fmt.Sprintf("msg_%d_%s", time.Now().UnixNano(), randomString(8))
}

// randomString generates a random string of specified length
func randomString(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, length)
	for i := range b {
		b[i] = charset[time.Now().UnixNano()%int64(len(charset))]
	}
	return string(b)
}
