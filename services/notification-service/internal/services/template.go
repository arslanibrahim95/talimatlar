package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"html/template"
	"strings"
	"time"

	"github.com/go-redis/redis/v8"
	"github.com/rs/zerolog/log"
)

// TemplateService handles notification templates
type TemplateService struct {
	redis  *redis.Client
	config TemplateConfig
}

// TemplateConfig holds template service configuration
type TemplateConfig struct {
	RedisURL      string
	RedisPassword string
	RedisDB       int
	DefaultLocale string
	CacheTTL      time.Duration
	MaxTemplates  int
}

// TemplateVariable represents a template variable
type TemplateVariable struct {
	Name         string `json:"name"`
	Type         string `json:"type"` // string, number, boolean, date, array, object
	Required     bool   `json:"required"`
	DefaultValue string `json:"default_value"`
	Description  string `json:"description"`
	Validation   string `json:"validation"` // regex pattern or validation rule
}

// TemplateRenderResult represents the result of rendering a template
type TemplateRenderResult struct {
	Subject   string            `json:"subject"`
	Title     string            `json:"title"`
	Message   string            `json:"message"`
	HTMLBody  string            `json:"html_body"`
	TextBody  string            `json:"text_body"`
	Variables map[string]string `json:"variables"`
	Errors    []string          `json:"errors"`
}

// TemplateCategory represents a template category
type TemplateCategory struct {
	ID          string                 `json:"id"`
	Name        string                 `json:"name"`
	Description string                 `json:"description"`
	Icon        string                 `json:"icon"`
	Color       string                 `json:"color"`
	IsActive    bool                   `json:"is_active"`
	CreatedAt   time.Time              `json:"created_at"`
	UpdatedAt   time.Time              `json:"updated_at"`
	TenantID    string                 `json:"tenant_id"`
	Metadata    map[string]interface{} `json:"metadata"`
}

// NewTemplateService creates a new template service instance
func NewTemplateService(config TemplateConfig) (*TemplateService, error) {
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

	// Set default values
	if config.DefaultLocale == "" {
		config.DefaultLocale = "tr"
	}
	if config.CacheTTL == 0 {
		config.CacheTTL = 1 * time.Hour
	}
	if config.MaxTemplates == 0 {
		config.MaxTemplates = 1000
	}

	return &TemplateService{
		redis:  redisClient,
		config: config,
	}, nil
}

// CreateTemplate creates a new notification template
func (s *TemplateService) CreateTemplate(template NotificationTemplate) (*NotificationTemplate, error) {
	log.Info().
		Str("name", template.Name).
		Str("type", template.Type).
		Str("category", template.Category).
		Msg("Creating notification template")

	// Validate template
	if err := s.validateTemplate(template); err != nil {
		return nil, fmt.Errorf("template validation failed: %w", err)
	}

	// Set default values
	if template.ID == "" {
		template.ID = generateTemplateID()
	}
	if template.CreatedAt.IsZero() {
		template.CreatedAt = time.Now()
	}
	template.UpdatedAt = time.Now()
	if template.Version == 0 {
		template.Version = 1
	}
	if template.Locale == "" {
		template.Locale = s.config.DefaultLocale
	}
	if template.Priority == "" {
		template.Priority = "normal"
	}

	// Extract variables from template
	template.Variables = s.extractVariables(template)

	// Store in Redis
	ctx := context.Background()
	key := s.getTemplateKey(template.ID)

	templateJSON, err := json.Marshal(template)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal template: %w", err)
	}

	if err := s.redis.Set(ctx, key, templateJSON, s.config.CacheTTL).Err(); err != nil {
		return nil, fmt.Errorf("failed to store template: %w", err)
	}

	// Add to templates index
	templatesKey := s.getTemplatesKey(template.TenantID)
	if err := s.redis.ZAdd(ctx, templatesKey, &redis.Z{
		Score:  float64(template.CreatedAt.Unix()),
		Member: template.ID,
	}).Err(); err != nil {
		log.Error().Err(err).Msg("Failed to add template to index")
	}

	// Add to type index
	typeKey := s.getTypeTemplatesKey(template.Type, template.TenantID)
	if err := s.redis.ZAdd(ctx, typeKey, &redis.Z{
		Score:  float64(template.CreatedAt.Unix()),
		Member: template.ID,
	}).Err(); err != nil {
		log.Error().Err(err).Msg("Failed to add template to type index")
	}

	// Add to category index
	categoryKey := s.getCategoryTemplatesKey(template.Category, template.TenantID)
	if err := s.redis.ZAdd(ctx, categoryKey, &redis.Z{
		Score:  float64(template.CreatedAt.Unix()),
		Member: template.ID,
	}).Err(); err != nil {
		log.Error().Err(err).Msg("Failed to add template to category index")
	}

	// Add to locale index
	localeKey := s.getLocaleTemplatesKey(template.Locale, template.TenantID)
	if err := s.redis.ZAdd(ctx, localeKey, &redis.Z{
		Score:  float64(template.CreatedAt.Unix()),
		Member: template.ID,
	}).Err(); err != nil {
		log.Error().Err(err).Msg("Failed to add template to locale index")
	}

	log.Info().
		Str("templateID", template.ID).
		Msg("Notification template created successfully")

	return &template, nil
}

// GetTemplate gets a notification template by ID
func (s *TemplateService) GetTemplate(templateID string) (*NotificationTemplate, error) {
	ctx := context.Background()
	key := s.getTemplateKey(templateID)

	templateJSON, err := s.redis.Get(ctx, key).Result()
	if err != nil {
		if err == redis.Nil {
			return nil, fmt.Errorf("template not found: %s", templateID)
		}
		return nil, fmt.Errorf("failed to get template: %w", err)
	}

	var template NotificationTemplate
	if err := json.Unmarshal([]byte(templateJSON), &template); err != nil {
		return nil, fmt.Errorf("failed to unmarshal template: %w", err)
	}

	return &template, nil
}

// GetTemplateByName gets a template by name and type
func (s *TemplateService) GetTemplateByName(name string, templateType string, tenantID string, locale string) (*NotificationTemplate, error) {
	log.Info().
		Str("name", name).
		Str("type", templateType).
		Str("locale", locale).
		Msg("Getting template by name")

	// Get all templates for the type and tenant
	templates, err := s.GetTemplatesByType(templateType, tenantID, 1, 100)
	if err != nil {
		return nil, fmt.Errorf("failed to get templates by type: %w", err)
	}

	// Find template by name and locale
	for _, template := range templates {
		if template.Name == name && template.Locale == locale {
			return template, nil
		}
	}

	// If not found in specified locale, try default locale
	if locale != s.config.DefaultLocale {
		for _, template := range templates {
			if template.Name == name && template.Locale == s.config.DefaultLocale {
				return template, nil
			}
		}
	}

	return nil, fmt.Errorf("template not found: %s (type: %s, locale: %s)", name, templateType, locale)
}

// UpdateTemplate updates a notification template
func (s *TemplateService) UpdateTemplate(templateID string, updates map[string]interface{}) (*NotificationTemplate, error) {
	log.Info().
		Str("templateID", templateID).
		Msg("Updating notification template")

	template, err := s.GetTemplate(templateID)
	if err != nil {
		return nil, fmt.Errorf("failed to get template: %w", err)
	}

	// Apply updates
	template.UpdatedAt = time.Now()
	template.Version++

	// Update fields based on updates map
	if name, ok := updates["name"].(string); ok {
		template.Name = name
	}
	if templateType, ok := updates["type"].(string); ok {
		template.Type = templateType
	}
	if category, ok := updates["category"].(string); ok {
		template.Category = category
	}
	if locale, ok := updates["locale"].(string); ok {
		template.Locale = locale
	}
	if subject, ok := updates["subject"].(string); ok {
		template.Subject = subject
	}
	if title, ok := updates["title"].(string); ok {
		template.Title = title
	}
	if message, ok := updates["message"].(string); ok {
		template.Message = message
	}
	if htmlBody, ok := updates["html_body"].(string); ok {
		template.HTMLBody = htmlBody
	}
	if textBody, ok := updates["text_body"].(string); ok {
		template.TextBody = textBody
	}
	if priority, ok := updates["priority"].(string); ok {
		template.Priority = priority
	}
	if isActive, ok := updates["is_active"].(bool); ok {
		template.IsActive = isActive
	}
	if isDefault, ok := updates["is_default"].(bool); ok {
		template.IsDefault = isDefault
	}
	if tags, ok := updates["tags"].([]string); ok {
		template.Tags = tags
	}
	if metadata, ok := updates["metadata"].(map[string]interface{}); ok {
		template.Metadata = metadata
	}

	// Re-extract variables
	template.Variables = s.extractVariables(*template)

	// Store updated template
	ctx := context.Background()
	key := s.getTemplateKey(templateID)

	templateJSON, err := json.Marshal(template)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal template: %w", err)
	}

	if err := s.redis.Set(ctx, key, templateJSON, s.config.CacheTTL).Err(); err != nil {
		return nil, fmt.Errorf("failed to update template: %w", err)
	}

	log.Info().
		Str("templateID", templateID).
		Int("version", template.Version).
		Msg("Notification template updated successfully")

	return template, nil
}

// DeleteTemplate deletes a notification template
func (s *TemplateService) DeleteTemplate(templateID string) error {
	log.Info().
		Str("templateID", templateID).
		Msg("Deleting notification template")

	template, err := s.GetTemplate(templateID)
	if err != nil {
		return fmt.Errorf("failed to get template: %w", err)
	}

	ctx := context.Background()

	// Remove from Redis
	key := s.getTemplateKey(templateID)
	if err := s.redis.Del(ctx, key).Err(); err != nil {
		return fmt.Errorf("failed to delete template: %w", err)
	}

	// Remove from indices
	templatesKey := s.getTemplatesKey(template.TenantID)
	if err := s.redis.ZRem(ctx, templatesKey, templateID).Err(); err != nil {
		log.Error().Err(err).Msg("Failed to remove template from index")
	}

	typeKey := s.getTypeTemplatesKey(template.Type, template.TenantID)
	if err := s.redis.ZRem(ctx, typeKey, templateID).Err(); err != nil {
		log.Error().Err(err).Msg("Failed to remove template from type index")
	}

	categoryKey := s.getCategoryTemplatesKey(template.Category, template.TenantID)
	if err := s.redis.ZRem(ctx, categoryKey, templateID).Err(); err != nil {
		log.Error().Err(err).Msg("Failed to remove template from category index")
	}

	localeKey := s.getLocaleTemplatesKey(template.Locale, template.TenantID)
	if err := s.redis.ZRem(ctx, localeKey, templateID).Err(); err != nil {
		log.Error().Err(err).Msg("Failed to remove template from locale index")
	}

	log.Info().
		Str("templateID", templateID).
		Msg("Notification template deleted")

	return nil
}

// GetTemplatesByType gets templates by type
func (s *TemplateService) GetTemplatesByType(templateType string, tenantID string, page int, limit int) ([]*NotificationTemplate, error) {
	ctx := context.Background()
	typeKey := s.getTypeTemplatesKey(templateType, tenantID)

	// Get total count
	total, err := s.redis.ZCard(ctx, typeKey).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to get template count: %w", err)
	}

	// Calculate pagination
	start := int64((page - 1) * limit)
	stop := start + int64(limit) - 1

	// Get template IDs (newest first)
	templateIDs, err := s.redis.ZRevRange(ctx, typeKey, start, stop).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to get template IDs: %w", err)
	}

	// Get template details
	var templates []*NotificationTemplate
	for _, id := range templateIDs {
		template, err := s.GetTemplate(id)
		if err != nil {
			log.Warn().Err(err).Str("templateID", id).Msg("Failed to get template")
			continue
		}
		templates = append(templates, template)
	}

	return templates, nil
}

// GetTemplatesByCategory gets templates by category
func (s *TemplateService) GetTemplatesByCategory(category string, tenantID string, page int, limit int) ([]*NotificationTemplate, error) {
	ctx := context.Background()
	categoryKey := s.getCategoryTemplatesKey(category, tenantID)

	// Get total count
	total, err := s.redis.ZCard(ctx, categoryKey).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to get template count: %w", err)
	}

	// Calculate pagination
	start := int64((page - 1) * limit)
	stop := start + int64(limit) - 1

	// Get template IDs (newest first)
	templateIDs, err := s.redis.ZRevRange(ctx, categoryKey, start, stop).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to get template IDs: %w", err)
	}

	// Get template details
	var templates []*NotificationTemplate
	for _, id := range templateIDs {
		template, err := s.GetTemplate(id)
		if err != nil {
			log.Warn().Err(err).Str("templateID", id).Msg("Failed to get template")
			continue
		}
		templates = append(templates, template)
	}

	return templates, nil
}

// RenderTemplate renders a template with data
func (s *TemplateService) RenderTemplate(templateID string, data map[string]interface{}) (*TemplateRenderResult, error) {
	log.Info().
		Str("templateID", templateID).
		Msg("Rendering template")

	template, err := s.GetTemplate(templateID)
	if err != nil {
		return nil, fmt.Errorf("failed to get template: %w", err)
	}

	if !template.IsActive {
		return nil, fmt.Errorf("template %s is not active", templateID)
	}

	// Validate required variables
	missingVars := s.validateRequiredVariables(template, data)
	if len(missingVars) > 0 {
		return nil, fmt.Errorf("missing required variables: %v", missingVars)
	}

	// Render template
	result := &TemplateRenderResult{
		Variables: make(map[string]string),
	}

	// Render subject
	if template.Subject != "" {
		subject, err := s.renderString(template.Subject, data)
		if err != nil {
			result.Errors = append(result.Errors, fmt.Sprintf("subject render error: %v", err))
		} else {
			result.Subject = subject
		}
	}

	// Render title
	if template.Title != "" {
		title, err := s.renderString(template.Title, data)
		if err != nil {
			result.Errors = append(result.Errors, fmt.Sprintf("title render error: %v", err))
		} else {
			result.Title = title
		}
	}

	// Render message
	if template.Message != "" {
		message, err := s.renderString(template.Message, data)
		if err != nil {
			result.Errors = append(result.Errors, fmt.Sprintf("message render error: %v", err))
		} else {
			result.Message = message
		}
	}

	// Render HTML body
	if template.HTMLBody != "" {
		htmlBody, err := s.renderString(template.HTMLBody, data)
		if err != nil {
			result.Errors = append(result.Errors, fmt.Sprintf("HTML body render error: %v", err))
		} else {
			result.HTMLBody = htmlBody
		}
	}

	// Render text body
	if template.TextBody != "" {
		textBody, err := s.renderString(template.TextBody, data)
		if err != nil {
			result.Errors = append(result.Errors, fmt.Sprintf("text body render error: %v", err))
		} else {
			result.TextBody = textBody
		}
	}

	// Store variables for reference
	for key, value := range data {
		if str, ok := value.(string); ok {
			result.Variables[key] = str
		} else {
			result.Variables[key] = fmt.Sprintf("%v", value)
		}
	}

	log.Info().
		Str("templateID", templateID).
		Int("errorCount", len(result.Errors)).
		Msg("Template rendered")

	return result, nil
}

// CreateCategory creates a new template category
func (s *TemplateService) CreateCategory(category TemplateCategory) (*TemplateCategory, error) {
	log.Info().
		Str("name", category.Name).
		Msg("Creating template category")

	// Validate category
	if err := s.validateCategory(category); err != nil {
		return nil, fmt.Errorf("category validation failed: %w", err)
	}

	// Set default values
	if category.ID == "" {
		category.ID = generateCategoryID()
	}
	if category.CreatedAt.IsZero() {
		category.CreatedAt = time.Now()
	}
	category.UpdatedAt = time.Now()

	// Store in Redis
	ctx := context.Background()
	key := s.getCategoryKey(category.ID)

	categoryJSON, err := json.Marshal(category)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal category: %w", err)
	}

	if err := s.redis.Set(ctx, key, categoryJSON, 0).Err(); err != nil {
		return nil, fmt.Errorf("failed to store category: %w", err)
	}

	// Add to categories index
	categoriesKey := s.getCategoriesKey(category.TenantID)
	if err := s.redis.ZAdd(ctx, categoriesKey, &redis.Z{
		Score:  float64(category.CreatedAt.Unix()),
		Member: category.ID,
	}).Err(); err != nil {
		log.Error().Err(err).Msg("Failed to add category to index")
	}

	log.Info().
		Str("categoryID", category.ID).
		Msg("Template category created successfully")

	return &category, nil
}

// GetCategory gets a template category by ID
func (s *TemplateService) GetCategory(categoryID string) (*TemplateCategory, error) {
	ctx := context.Background()
	key := s.getCategoryKey(categoryID)

	categoryJSON, err := s.redis.Get(ctx, key).Result()
	if err != nil {
		if err == redis.Nil {
			return nil, fmt.Errorf("category not found: %s", categoryID)
		}
		return nil, fmt.Errorf("failed to get category: %w", err)
	}

	var category TemplateCategory
	if err := json.Unmarshal([]byte(categoryJSON), &category); err != nil {
		return nil, fmt.Errorf("failed to unmarshal category: %w", err)
	}

	return &category, nil
}

// GetCategories gets all template categories
func (s *TemplateService) GetCategories(tenantID string) ([]*TemplateCategory, error) {
	ctx := context.Background()
	categoriesKey := s.getCategoriesKey(tenantID)

	// Get category IDs
	categoryIDs, err := s.redis.ZRange(ctx, categoriesKey, 0, -1).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to get category IDs: %w", err)
	}

	// Get category details
	var categories []*TemplateCategory
	for _, id := range categoryIDs {
		category, err := s.GetCategory(id)
		if err != nil {
			log.Warn().Err(err).Str("categoryID", id).Msg("Failed to get category")
			continue
		}
		if category.IsActive {
			categories = append(categories, category)
		}
	}

	return categories, nil
}

// TestConnection tests the template service connection
func (s *TemplateService) TestConnection() error {
	log.Info().Msg("Testing template service connection")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := s.redis.Ping(ctx).Err(); err != nil {
		log.Error().Err(err).Msg("Template service connection test failed")
		return fmt.Errorf("connection test failed: %w", err)
	}

	log.Info().Msg("Template service connection test successful")
	return nil
}

// validateTemplate validates a notification template
func (s *TemplateService) validateTemplate(template NotificationTemplate) error {
	if template.Name == "" {
		return fmt.Errorf("template name is required")
	}

	if template.Type == "" {
		return fmt.Errorf("template type is required")
	}

	if template.Category == "" {
		return fmt.Errorf("template category is required")
	}

	if template.Message == "" && template.HTMLBody == "" && template.TextBody == "" {
		return fmt.Errorf("at least one message format is required")
	}

	return nil
}

// validateCategory validates a template category
func (s *TemplateService) validateCategory(category TemplateCategory) error {
	if category.Name == "" {
		return fmt.Errorf("category name is required")
	}

	return nil
}

// extractVariables extracts variables from template strings
func (s *TemplateService) extractVariables(template NotificationTemplate) []string {
	variables := make(map[string]bool)

	// Extract from all text fields
	textFields := []string{
		template.Subject,
		template.Title,
		template.Message,
		template.HTMLBody,
		template.TextBody,
	}

	for _, field := range textFields {
		if field != "" {
			extracted := s.extractVariablesFromString(field)
			for _, v := range extracted {
				variables[v] = true
			}
		}
	}

	// Convert map keys to slice
	var result []string
	for v := range variables {
		result = append(result, v)
	}

	return result
}

// extractVariablesFromString extracts variables from a string
func (s *TemplateService) extractVariablesFromString(text string) []string {
	var variables []string

	// Look for {{variable}} patterns
	start := 0
	for {
		startIdx := strings.Index(text[start:], "{{")
		if startIdx == -1 {
			break
		}
		startIdx += start

		endIdx := strings.Index(text[startIdx:], "}}")
		if endIdx == -1 {
			break
		}
		endIdx += startIdx

		if endIdx > startIdx+2 {
			variable := strings.TrimSpace(text[startIdx+2 : endIdx])
			if variable != "" {
				variables = append(variables, variable)
			}
		}

		start = endIdx + 2
	}

	return variables
}

// validateRequiredVariables validates that all required variables are provided
func (s *TemplateService) validateRequiredVariables(template *NotificationTemplate, data map[string]interface{}) []string {
	var missing []string

	for _, variable := range template.Variables {
		if _, exists := data[variable]; !exists {
			missing = append(missing, variable)
		}
	}

	return missing
}

// renderString renders a template string with data
func (s *TemplateService) renderString(templateStr string, data map[string]interface{}) (string, error) {
	// Create a new template
	tmpl, err := template.New("").Parse(templateStr)
	if err != nil {
		return "", fmt.Errorf("failed to parse template: %w", err)
	}

	// Execute template
	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, data); err != nil {
		return "", fmt.Errorf("failed to execute template: %w", err)
	}

	return buf.String(), nil
}

// Redis key generators
func (s *TemplateService) getTemplateKey(templateID string) string {
	return fmt.Sprintf("template:%s", templateID)
}

func (s *TemplateService) getTemplatesKey(tenantID string) string {
	if tenantID == "" {
		return "templates:global"
	}
	return fmt.Sprintf("templates:%s", tenantID)
}

func (s *TemplateService) getTypeTemplatesKey(templateType string, tenantID string) string {
	if tenantID == "" {
		return fmt.Sprintf("templates:type:%s:global", templateType)
	}
	return fmt.Sprintf("templates:type:%s:%s", templateType, tenantID)
}

func (s *TemplateService) getCategoryTemplatesKey(category string, tenantID string) string {
	if tenantID == "" {
		return fmt.Sprintf("templates:category:%s:global", category)
	}
	return fmt.Sprintf("templates:category:%s:%s", category, tenantID)
}

func (s *TemplateService) getLocaleTemplatesKey(locale string, tenantID string) string {
	if tenantID == "" {
		return fmt.Sprintf("templates:locale:%s:global", locale)
	}
	return fmt.Sprintf("templates:locale:%s:%s", locale, tenantID)
}

func (s *TemplateService) getCategoryKey(categoryID string) string {
	return fmt.Sprintf("template_category:%s", categoryID)
}

func (s *TemplateService) getCategoriesKey(tenantID string) string {
	if tenantID == "" {
		return "template_categories:global"
	}
	return fmt.Sprintf("template_categories:%s", tenantID)
}

// Helper functions
func generateCategoryID() string {
	return fmt.Sprintf("cat_%d", time.Now().UnixNano())
}
