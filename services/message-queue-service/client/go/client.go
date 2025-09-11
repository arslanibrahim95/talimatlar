package client

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// Message represents a message in the queue
type Message struct {
	ID          string                 `json:"id"`
	Topic       string                 `json:"topic"`
	Payload     map[string]interface{} `json:"payload"`
	Priority    int                    `json:"priority"`
	RetryCount  int                    `json:"retry_count"`
	MaxRetries  int                    `json:"max_retries"`
	CreatedAt   time.Time              `json:"created_at"`
	ScheduledAt *time.Time             `json:"scheduled_at,omitempty"`
	ExpiresAt   *time.Time             `json:"expires_at,omitempty"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
}

// MessageRequest represents a request to publish a message
type MessageRequest struct {
	Topic       string                 `json:"topic"`
	Payload     map[string]interface{} `json:"payload"`
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

// ConsumeRequest represents a request to consume messages
type ConsumeRequest struct {
	Topic     string `json:"topic"`
	Consumer  string `json:"consumer"`
	Count     int64  `json:"count"`
	BlockTime int    `json:"block_time"`
}

// ConsumeResponse represents a response from consuming messages
type ConsumeResponse struct {
	Success  bool      `json:"success"`
	Messages []Message `json:"messages"`
	Count    int       `json:"count"`
	Message  string    `json:"message"`
}

// Client represents a message queue client
type Client struct {
	baseURL    string
	httpClient *http.Client
}

// NewClient creates a new message queue client
func NewClient(baseURL string) *Client {
	return &Client{
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// Publish publishes a message to a topic
func (c *Client) Publish(ctx context.Context, req MessageRequest) (*MessageResponse, error) {
	url := fmt.Sprintf("%s/api/v1/messages/publish", c.baseURL)
	
	jsonData, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("request failed with status %d: %s", resp.StatusCode, string(body))
	}

	var messageResp MessageResponse
	if err := json.Unmarshal(body, &messageResp); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	return &messageResp, nil
}

// PublishBulk publishes multiple messages
func (c *Client) PublishBulk(ctx context.Context, messages []MessageRequest) (map[string]interface{}, error) {
	url := fmt.Sprintf("%s/api/v1/messages/publish-bulk", c.baseURL)
	
	req := map[string]interface{}{
		"messages": messages,
	}
	
	jsonData, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("request failed with status %d: %s", resp.StatusCode, string(body))
	}

	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	return result, nil
}

// Consume consumes messages from a topic
func (c *Client) Consume(ctx context.Context, req ConsumeRequest) (*ConsumeResponse, error) {
	url := fmt.Sprintf("%s/api/v1/messages/consume", c.baseURL)
	
	jsonData, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("request failed with status %d: %s", resp.StatusCode, string(body))
	}

	var consumeResp ConsumeResponse
	if err := json.Unmarshal(body, &consumeResp); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	return &consumeResp, nil
}

// Acknowledge acknowledges a message
func (c *Client) Acknowledge(ctx context.Context, messageID, topic, consumer string) (*MessageResponse, error) {
	url := fmt.Sprintf("%s/api/v1/messages/%s/ack", c.baseURL, messageID)
	
	req := map[string]interface{}{
		"topic":    topic,
		"consumer": consumer,
	}
	
	jsonData, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("request failed with status %d: %s", resp.StatusCode, string(body))
	}

	var messageResp MessageResponse
	if err := json.Unmarshal(body, &messageResp); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	return &messageResp, nil
}

// NegativeAcknowledge negatively acknowledges a message
func (c *Client) NegativeAcknowledge(ctx context.Context, messageID, topic, consumer string, retry bool) (*MessageResponse, error) {
	url := fmt.Sprintf("%s/api/v1/messages/%s/nack", c.baseURL, messageID)
	
	req := map[string]interface{}{
		"topic":    topic,
		"consumer": consumer,
		"retry":    retry,
	}
	
	jsonData, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("request failed with status %d: %s", resp.StatusCode, string(body))
	}

	var messageResp MessageResponse
	if err := json.Unmarshal(body, &messageResp); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	return &messageResp, nil
}

// GetTopicStats returns statistics for a topic
func (c *Client) GetTopicStats(ctx context.Context, topic string) (map[string]interface{}, error) {
	url := fmt.Sprintf("%s/api/v1/topics/%s/stats", c.baseURL, topic)

	httpReq, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("request failed with status %d: %s", resp.StatusCode, string(body))
	}

	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	return result, nil
}

// ListTopics returns all available topics
func (c *Client) ListTopics(ctx context.Context) ([]string, error) {
	url := fmt.Sprintf("%s/api/v1/topics", c.baseURL)

	httpReq, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("request failed with status %d: %s", resp.StatusCode, string(body))
	}

	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	topics, ok := result["topics"].([]interface{})
	if !ok {
		return nil, fmt.Errorf("invalid response format")
	}

	var topicStrings []string
	for _, topic := range topics {
		if topicStr, ok := topic.(string); ok {
			topicStrings = append(topicStrings, topicStr)
		}
	}

	return topicStrings, nil
}

// HealthCheck checks the health of the message queue service
func (c *Client) HealthCheck(ctx context.Context) (map[string]interface{}, error) {
	url := fmt.Sprintf("%s/health", c.baseURL)

	httpReq, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("request failed with status %d: %s", resp.StatusCode, string(body))
	}

	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	return result, nil
}
