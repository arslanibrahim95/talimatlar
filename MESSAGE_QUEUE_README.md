# Message Queue System - Claude Talimat

Bu dokümantasyon, Claude Talimat İş Güvenliği Yönetim Sistemi için geliştirilen message queue (mesaj kuyruğu) sistemini açıklamaktadır.

## 🎯 Genel Bakış

Message Queue sistemi, mikroservisler arasında asenkron iletişim sağlamak için tasarlanmıştır. Redis Streams tabanlı, yüksek performanslı ve güvenilir bir mesajlaşma altyapısı sunar.

### Özellikler

- **Redis Streams Backend**: Yüksek performans ve güvenilirlik
- **Topic-based Messaging**: Konu tabanlı mesajlaşma
- **Priority Support**: Mesaj öncelik sistemi (1-10)
- **Retry Mechanism**: Otomatik yeniden deneme
- **Dead Letter Queue**: Başarısız mesajlar için DLQ
- **Consumer Groups**: Çoklu tüketici desteği
- **Scheduled Messages**: Zamanlanmış mesaj gönderimi
- **Message Expiration**: Mesaj süre sonu
- **Health Monitoring**: Sağlık kontrolü ve metrikler
- **Multi-language Clients**: Go, TypeScript, Python client'ları

## 🏗️ Sistem Mimarisi

```
┌─────────────────────────────────────────────────────────┐
│                Message Queue Service                    │
│                   (Go + Gin)                           │
├─────────────────────────────────────────────────────────┤
│                    Redis Streams                       │
│              (Message Storage & Processing)            │
├─────────────────────────────────────────────────────────┤
│  Auth Service  │ Document Service │ Analytics Service  │
│   (Publisher)  │   (Consumer)     │   (Consumer)       │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Hızlı Başlangıç

### Gereksinimler

- Docker & Docker Compose
- Go 1.21+ (development için)
- Redis 7.4+

### Kurulum

```bash
# Servisleri başlatın
docker-compose up -d

# Message Queue servisinin çalıştığını kontrol edin
curl http://localhost:8008/health
```

### Erişim

- **Message Queue API**: http://localhost:8008
- **Health Check**: http://localhost:8008/health
- **API Gateway**: http://localhost:8080/api/v1/messagequeue

## 📡 API Endpoints

### Temel Endpoints

```bash
# Health Check
GET /health

# Servis bilgileri
GET /
```

### Mesaj İşlemleri

```bash
# Mesaj yayınla
POST /api/v1/messages/publish
{
  "topic": "notifications",
  "payload": {"message": "Hello World"},
  "priority": 5,
  "max_retries": 3
}

# Toplu mesaj yayınla
POST /api/v1/messages/publish-bulk
{
  "messages": [...]
}

# Mesaj tüket
POST /api/v1/messages/consume
{
  "topic": "notifications",
  "consumer": "notification-worker",
  "count": 1,
  "block_time": 1000
}

# Mesaj onayla
POST /api/v1/messages/{id}/ack
{
  "topic": "notifications",
  "consumer": "notification-worker"
}

# Mesaj reddet
POST /api/v1/messages/{id}/nack
{
  "topic": "notifications",
  "consumer": "notification-worker",
  "retry": true
}
```

### Topic Yönetimi

```bash
# Topic listele
GET /api/v1/topics

# Topic oluştur
POST /api/v1/topics
{
  "topic": "new_topic"
}

# Topic sil
DELETE /api/v1/topics/{topic}

# Topic istatistikleri
GET /api/v1/topics/{topic}/stats
```

### İstatistikler

```bash
# Genel istatistikler
GET /api/v1/stats

# Consumer istatistikleri
GET /api/v1/stats/consumers
```

## 💻 Client Kütüphaneleri

### Go Client

```go
package main

import (
    "context"
    "log"
    "message-queue-client/client"
)

func main() {
    // Client oluştur
    mqClient := client.NewClient("http://localhost:8008")
    
    // Mesaj yayınla
    message := client.MessageRequest{
        Topic:   "notifications",
        Payload: map[string]interface{}{
            "recipient": "user@example.com",
            "message":   "Welcome!",
        },
        Priority: 5,
    }
    
    response, err := mqClient.Publish(context.Background(), message)
    if err != nil {
        log.Fatal(err)
    }
    
    log.Printf("Message published: %s", response.ID)
}
```

### TypeScript Client

```typescript
import { MessageQueueClient, MessageQueueUtils } from './client/typescript/client';

// Client oluştur
const mqClient = new MessageQueueClient('http://localhost:8008');

// Mesaj yayınla
const message = MessageQueueUtils.createNotificationMessage(
  'user@example.com',
  'Welcome!',
  'Welcome to our system',
  'email'
);

const response = await mqClient.publish(message);
console.log('Message published:', response.id);

// Mesaj tüket
const consumeResponse = await mqClient.consume({
  topic: 'notifications',
  consumer: 'notification-worker',
  count: 1
});

for (const message of consumeResponse.messages) {
  console.log('Received message:', message);
  // Mesajı işle
  await mqClient.acknowledge(message.id, 'notifications', 'notification-worker');
}
```

### Python Client

```python
from message_queue_client import MessageQueueClient, MessageQueueUtils

# Client oluştur
mq_client = MessageQueueClient("http://localhost:8008")

# Mesaj yayınla
message = MessageQueueUtils.create_notification_message(
    recipient="user@example.com",
    title="Welcome!",
    message="Welcome to our system",
    message_type="email"
)

response = mq_client.publish(message)
print(f"Message published: {response.id}")

# Mesaj tüket
consume_request = ConsumeRequest(
    topic="notifications",
    consumer="notification-worker",
    count=1
)

response = mq_client.consume(consume_request)
for message in response.messages:
    print(f"Received message: {message.id}")
    # Mesajı işle
    mq_client.acknowledge(message.id, "notifications", "notification-worker")
```

## 🔧 Konfigürasyon

### Environment Variables

```bash
# Message Queue Service
MESSAGE_QUEUE_PORT=8008
REDIS_URL=redis://redis:6379
REDIS_DB=1

# Client Configuration
MESSAGE_QUEUE_URL=http://localhost:8008
MESSAGE_QUEUE_TIMEOUT=30000
```

### Docker Compose

```yaml
message-queue-service:
  build:
    context: ./services/message-queue-service
    dockerfile: Dockerfile
  container_name: claude-message-queue
  ports:
    - "8008:8008"
  environment:
    - NODE_ENV=development
  networks:
    - claude-network
  depends_on:
    redis:
      condition: service_healthy
```

## 📊 Monitoring ve Metrikler

### Health Check

```bash
curl http://localhost:8008/health
```

Response:
```json
{
  "status": "healthy",
  "service": "message-queue-service",
  "timestamp": 1699123456,
  "version": "1.0.0",
  "uptime": "2h30m15s",
  "redis_status": "healthy"
}
```

### İstatistikler

```bash
curl http://localhost:8008/api/v1/stats
```

Response:
```json
{
  "success": true,
  "stats": {
    "total_topics": 4,
    "total_messages": 11230,
    "total_consumers": 8,
    "uptime": "2h30m15s",
    "redis_status": "connected"
  }
}
```

## 🎯 Kullanım Senaryoları

### 1. Bildirim Sistemi

```typescript
// Bildirim mesajı oluştur
const notification = MessageQueueUtils.createNotificationMessage(
  'user@example.com',
  'Yeni Talimat',
  'Size yeni bir talimat atandı',
  'email',
  7 // Yüksek öncelik
);

// Mesajı yayınla
await mqClient.publish(notification);
```

### 2. Audit Logging

```python
# Audit mesajı oluştur
audit_message = MessageQueueUtils.create_audit_message(
    action="document_upload",
    user_id="user123",
    resource="document_456",
    details={"file_size": 1024000, "file_type": "pdf"}
)

# Mesajı yayınla
mq_client.publish(audit_message)
```

### 3. Document Processing

```go
// Doküman işleme mesajı oluştur
message := client.MessageRequest{
    Topic: "document_processing",
    Payload: map[string]interface{}{
        "document_id": "doc123",
        "operation":   "extract_text",
        "metadata": map[string]interface{}{
            "file_type": "pdf",
            "size":      1024000,
        },
    },
    Priority:   7,
    MaxRetries: 5,
}

// Mesajı yayınla
response, err := mqClient.Publish(context.Background(), message)
```

### 4. User Activity Tracking

```typescript
// Kullanıcı aktivite mesajı oluştur
const activity = MessageQueueUtils.createUserActivityMessage(
  'user123',
  'login',
  { ip: '192.168.1.1', user_agent: 'Mozilla/5.0...' }
);

// Mesajı yayınla
await mqClient.publish(activity);
```

## 🔄 Consumer Patterns

### 1. Simple Consumer

```typescript
class NotificationConsumer {
  private mqClient: MessageQueueClient;
  
  constructor() {
    this.mqClient = new MessageQueueClient('http://localhost:8008');
  }
  
  async start() {
    while (true) {
      try {
        const response = await this.mqClient.consume({
          topic: 'notifications',
          consumer: 'notification-worker',
          count: 1,
          block_time: 1000
        });
        
        for (const message of response.messages) {
          await this.processNotification(message);
          await this.mqClient.acknowledge(
            message.id, 
            'notifications', 
            'notification-worker'
          );
        }
      } catch (error) {
        console.error('Consumer error:', error);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
  
  private async processNotification(message: Message) {
    // Bildirim işleme mantığı
    console.log('Processing notification:', message.payload);
  }
}
```

### 2. Batch Consumer

```python
class BatchDocumentProcessor:
    def __init__(self):
        self.mq_client = MessageQueueClient("http://localhost:8008")
        self.batch_size = 10
    
    def start(self):
        while True:
            try:
                # Toplu mesaj tüket
                response = self.mq_client.consume(ConsumeRequest(
                    topic="document_processing",
                    consumer="batch-processor",
                    count=self.batch_size
                ))
                
                if response.messages:
                    self.process_batch(response.messages)
                    
                    # Tüm mesajları onayla
                    for message in response.messages:
                        self.mq_client.acknowledge(
                            message.id, 
                            "document_processing", 
                            "batch-processor"
                        )
                else:
                    time.sleep(1)
                    
            except Exception as e:
                print(f"Batch processor error: {e}")
                time.sleep(5)
    
    def process_batch(self, messages):
        # Toplu işleme mantığı
        print(f"Processing batch of {len(messages)} documents")
```

## 🛡️ Güvenlik

### Authentication

Message Queue servisi API Gateway üzerinden erişilir ve aynı authentication mekanizmasını kullanır.

### Rate Limiting

```yaml
# API Gateway rate limiting
limit_req_zone $binary_remote_addr zone=mq:10m rate=20r/s;
```

### Message Validation

```typescript
// Mesaj doğrulama
const validateMessage = (message: MessageRequest) => {
  if (!message.topic || !message.payload) {
    throw new Error('Topic and payload are required');
  }
  
  if (message.priority < 1 || message.priority > 10) {
    throw new Error('Priority must be between 1 and 10');
  }
};
```

## 🚨 Error Handling

### Retry Mechanism

```typescript
// Mesaj yeniden deneme
const publishWithRetry = async (message: MessageRequest, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await mqClient.publish(message);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};
```

### Dead Letter Queue

Başarısız mesajlar otomatik olarak Dead Letter Queue'ya taşınır:

```bash
# DLQ mesajlarını görüntüle
GET /api/v1/topics/{topic}/dlq
```

## 📈 Performance Tuning

### Redis Configuration

```yaml
# docker-compose.yml
redis:
  command: redis-server --appendonly yes --maxmemory 512mb --maxmemory-policy allkeys-lru
```

### Consumer Optimization

```typescript
// Optimal consumer configuration
const consumeConfig = {
  topic: 'notifications',
  consumer: 'worker-1',
  count: 10,        // Batch size
  block_time: 1000  // Block time in ms
};
```

## 🔍 Troubleshooting

### Common Issues

1. **Connection Refused**
   ```bash
   # Redis bağlantısını kontrol et
   docker exec claude-redis redis-cli ping
   ```

2. **Message Not Consumed**
   ```bash
   # Topic istatistiklerini kontrol et
   curl http://localhost:8008/api/v1/topics/notifications/stats
   ```

3. **High Memory Usage**
   ```bash
   # Redis memory kullanımını kontrol et
   docker exec claude-redis redis-cli info memory
   ```

### Logs

```bash
# Message Queue servis logları
docker logs claude-message-queue

# Redis logları
docker logs claude-redis
```

## 📚 Daha Fazla Bilgi

- [Redis Streams Documentation](https://redis.io/docs/data-types/streams/)
- [Go Redis Client](https://github.com/go-redis/redis)
- [Gin Web Framework](https://gin-gonic.com/)

## 🤝 Katkıda Bulunma

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.
