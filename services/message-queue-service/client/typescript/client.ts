export interface Message {
  id: string;
  topic: string;
  payload: Record<string, any>;
  priority: number;
  retry_count: number;
  max_retries: number;
  created_at: string;
  scheduled_at?: string;
  expires_at?: string;
  metadata?: Record<string, any>;
}

export interface MessageRequest {
  topic: string;
  payload: Record<string, any>;
  priority?: number;
  max_retries?: number;
  scheduled_at?: string;
  expires_at?: string;
  metadata?: Record<string, any>;
}

export interface MessageResponse {
  id: string;
  status: string;
  message: string;
  timestamp: string;
}

export interface ConsumeRequest {
  topic: string;
  consumer: string;
  count?: number;
  block_time?: number;
}

export interface ConsumeResponse {
  success: boolean;
  messages: Message[];
  count: number;
  message: string;
}

export interface QueueStats {
  topic: string;
  total_messages: number;
  pending_messages: number;
  processed_messages: number;
  failed_messages: number;
  consumers: number;
}

export interface HealthResponse {
  status: string;
  service: string;
  timestamp: number;
  version: string;
  uptime: string;
  redis_status: string;
}

export class MessageQueueClient {
  private baseURL: string;
  private timeout: number;

  constructor(baseURL: string, timeout: number = 30000) {
    this.baseURL = baseURL.replace(/\/$/, ''); // Remove trailing slash
    this.timeout = timeout;
  }

  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(this.timeout),
    };

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Request failed: ${error.message}`);
      }
      throw new Error('Unknown request error');
    }
  }

  /**
   * Publish a message to a topic
   */
  async publish(request: MessageRequest): Promise<MessageResponse> {
    return this.makeRequest<MessageResponse>('/api/v1/messages/publish', 'POST', request);
  }

  /**
   * Publish multiple messages
   */
  async publishBulk(messages: MessageRequest[]): Promise<{
    success: boolean;
    total: number;
    published: number;
    failed: number;
    messages: MessageResponse[];
    failed_ids: string[];
    message: string;
  }> {
    return this.makeRequest('/api/v1/messages/publish-bulk', 'POST', { messages });
  }

  /**
   * Consume messages from a topic
   */
  async consume(request: ConsumeRequest): Promise<ConsumeResponse> {
    return this.makeRequest<ConsumeResponse>('/api/v1/messages/consume', 'POST', request);
  }

  /**
   * Acknowledge a message
   */
  async acknowledge(messageId: string, topic: string, consumer: string): Promise<MessageResponse> {
    return this.makeRequest<MessageResponse>(
      `/api/v1/messages/${messageId}/ack`,
      'POST',
      { topic, consumer }
    );
  }

  /**
   * Negative acknowledge a message
   */
  async negativeAcknowledge(
    messageId: string,
    topic: string,
    consumer: string,
    retry: boolean = false
  ): Promise<MessageResponse> {
    return this.makeRequest<MessageResponse>(
      `/api/v1/messages/${messageId}/nack`,
      'POST',
      { topic, consumer, retry }
    );
  }

  /**
   * Get message status
   */
  async getMessageStatus(messageId: string): Promise<MessageResponse> {
    return this.makeRequest<MessageResponse>(`/api/v1/messages/${messageId}/status`);
  }

  /**
   * List all topics
   */
  async listTopics(): Promise<{
    success: boolean;
    topics: string[];
    count: number;
  }> {
    return this.makeRequest('/api/v1/topics');
  }

  /**
   * Get topic statistics
   */
  async getTopicStats(topic: string): Promise<{
    success: boolean;
    stats: QueueStats;
  }> {
    return this.makeRequest(`/api/v1/topics/${topic}/stats`);
  }

  /**
   * Create a new topic
   */
  async createTopic(topic: string): Promise<{
    success: boolean;
    topic: string;
    message: string;
  }> {
    return this.makeRequest('/api/v1/topics', 'POST', { topic });
  }

  /**
   * Delete a topic
   */
  async deleteTopic(topic: string): Promise<{
    success: boolean;
    topic: string;
    message: string;
  }> {
    return this.makeRequest(`/api/v1/topics/${topic}`, 'DELETE');
  }

  /**
   * Get overall statistics
   */
  async getOverallStats(): Promise<{
    success: boolean;
    stats: {
      total_topics: number;
      total_messages: number;
      total_consumers: number;
      uptime: string;
      redis_status: string;
    };
  }> {
    return this.makeRequest('/api/v1/stats');
  }

  /**
   * Get consumer statistics
   */
  async getConsumerStats(): Promise<{
    success: boolean;
    consumers: any[];
    message: string;
  }> {
    return this.makeRequest('/api/v1/stats/consumers');
  }

  /**
   * Check service health
   */
  async healthCheck(): Promise<HealthResponse> {
    return this.makeRequest<HealthResponse>('/health');
  }
}

// Utility functions for common message patterns
export class MessageQueueUtils {
  /**
   * Create a notification message
   */
  static createNotificationMessage(
    recipient: string,
    title: string,
    message: string,
    type: 'email' | 'sms' | 'push' | 'inapp' = 'inapp',
    priority: number = 5
  ): MessageRequest {
    return {
      topic: 'notifications',
      payload: {
        recipient,
        title,
        message,
        type,
      },
      priority,
      metadata: {
        created_by: 'system',
        category: 'notification',
      },
    };
  }

  /**
   * Create an audit log message
   */
  static createAuditMessage(
    action: string,
    userId: string,
    resource: string,
    details: Record<string, any> = {}
  ): MessageRequest {
    return {
      topic: 'audit',
      payload: {
        action,
        user_id: userId,
        resource,
        details,
        timestamp: new Date().toISOString(),
      },
      priority: 3,
      metadata: {
        created_by: 'system',
        category: 'audit',
      },
    };
  }

  /**
   * Create a document processing message
   */
  static createDocumentProcessingMessage(
    documentId: string,
    operation: 'upload' | 'process' | 'extract' | 'analyze',
    metadata: Record<string, any> = {}
  ): MessageRequest {
    return {
      topic: 'document_processing',
      payload: {
        document_id: documentId,
        operation,
        metadata,
        timestamp: new Date().toISOString(),
      },
      priority: 7,
      max_retries: 5,
      metadata: {
        created_by: 'system',
        category: 'document',
      },
    };
  }

  /**
   * Create a user activity message
   */
  static createUserActivityMessage(
    userId: string,
    activity: string,
    details: Record<string, any> = {}
  ): MessageRequest {
    return {
      topic: 'user_activity',
      payload: {
        user_id: userId,
        activity,
        details,
        timestamp: new Date().toISOString(),
      },
      priority: 2,
      metadata: {
        created_by: 'system',
        category: 'analytics',
      },
    };
  }

  /**
   * Create a scheduled message
   */
  static createScheduledMessage(
    topic: string,
    payload: Record<string, any>,
    scheduledAt: Date,
    priority: number = 5
  ): MessageRequest {
    return {
      topic,
      payload,
      priority,
      scheduled_at: scheduledAt.toISOString(),
      metadata: {
        created_by: 'system',
        category: 'scheduled',
      },
    };
  }
}

// Default export
export default MessageQueueClient;
