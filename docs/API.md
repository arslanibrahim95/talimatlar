# 📚 Claude Talimat API Documentation

## 🎯 Overview
Claude Talimat İş Güvenliği Yönetim Sistemi API dokümantasyonu.

## 🔗 Base URLs

- **Development**: `http://localhost:3000`
- **Staging**: `https://staging.claude-talimat.com`
- **Production**: `https://api.claude-talimat.com`

## 🔐 Authentication

### JWT Token
Tüm API istekleri için JWT token gereklidir.

```http
Authorization: Bearer <your-jwt-token>
```

### Token Alımı
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 86400,
  "user": {
    "id": "123",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "user"
  }
}
```

## 📋 API Endpoints

### Authentication Service

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+90 555 123 4567"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

#### Refresh Token
```http
POST /api/auth/refresh
Authorization: Bearer <token>
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

### Document Service

#### Get Documents
```http
GET /api/documents?page=1&limit=20&category=safety
Authorization: Bearer <token>
```

**Response:**
```json
{
  "data": [
    {
      "id": "123",
      "title": "Safety Manual",
      "category": "safety",
      "file_path": "/documents/safety-manual.pdf",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

#### Create Document
```http
POST /api/documents
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "title": "New Document",
  "category": "safety",
  "file": <file>
}
```

#### Update Document
```http
PUT /api/documents/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Document",
  "category": "safety"
}
```

#### Delete Document
```http
DELETE /api/documents/{id}
Authorization: Bearer <token>
```

#### Download Document
```http
GET /api/documents/{id}/download
Authorization: Bearer <token>
```

### Analytics Service

#### Get Dashboard Data
```http
GET /api/analytics/dashboard
Authorization: Bearer <token>
```

**Response:**
```json
{
  "user_stats": {
    "total_users": 1000,
    "active_users": 800,
    "new_users": 50
  },
  "document_stats": {
    "total_documents": 500,
    "downloads": 2000,
    "categories": {
      "safety": 200,
      "training": 150,
      "procedures": 100
    }
  },
  "performance_metrics": {
    "response_time": 150,
    "uptime": 99.9,
    "error_rate": 0.1
  }
}
```

#### Get Reports
```http
GET /api/analytics/reports?type=user&period=monthly
Authorization: Bearer <token>
```

#### Get Performance Metrics
```http
GET /api/analytics/performance?start_date=2024-01-01&end_date=2024-01-31
Authorization: Bearer <token>
```

### Notification Service

#### Get Notifications
```http
GET /api/notifications?unread_only=true
Authorization: Bearer <token>
```

**Response:**
```json
{
  "data": [
    {
      "id": "123",
      "title": "New Document Available",
      "message": "A new safety document has been uploaded",
      "type": "info",
      "read": false,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### Mark as Read
```http
PUT /api/notifications/{id}/read
Authorization: Bearer <token>
```

#### Send Notification
```http
POST /api/notifications
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Notification Title",
  "message": "Notification message",
  "type": "info",
  "user_ids": ["123", "456"]
}
```

## 📊 Response Formats

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "detail": "Error message",
    "status_code": 400,
    "timestamp": "2024-01-01T00:00:00Z",
    "error_code": "VALIDATION_ERROR",
    "field_errors": {
      "email": ["Email is required"],
      "password": ["Password must be at least 8 characters"]
    }
  }
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [
    // Array of items
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5,
    "has_next": true,
    "has_prev": false
  }
}
```

## 🔒 Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Input validation failed |
| `AUTHENTICATION_ERROR` | Authentication failed |
| `AUTHORIZATION_ERROR` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `DUPLICATE_ENTRY` | Resource already exists |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `INTERNAL_ERROR` | Internal server error |

## 📈 Rate Limiting

- **Authentication**: 5 requests per minute
- **API Endpoints**: 100 requests per minute
- **File Upload**: 10 requests per minute
- **Analytics**: 50 requests per minute

## 🔄 WebSocket Events

### Connection
```javascript
const ws = new WebSocket('wss://api.claude-talimat.com/ws');

ws.onopen = function() {
  console.log('Connected to WebSocket');
};

ws.onmessage = function(event) {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};
```

### Events
- `user_online`: User comes online
- `user_offline`: User goes offline
- `document_uploaded`: New document uploaded
- `notification`: New notification
- `system_alert`: System alert

## 🧪 Testing

### Postman Collection
```json
{
  "info": {
    "name": "Claude Talimat API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"test@example.com\",\n  \"password\": \"password123\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/api/auth/login",
              "host": ["{{base_url}}"],
              "path": ["api", "auth", "login"]
            }
          }
        }
      ]
    }
  ]
}
```

### cURL Examples
```bash
# Login
curl -X POST "https://api.claude-talimat.com/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get documents
curl -X GET "https://api.claude-talimat.com/api/documents" \
  -H "Authorization: Bearer <token>"

# Upload document
curl -X POST "https://api.claude-talimat.com/api/documents" \
  -H "Authorization: Bearer <token>" \
  -F "title=New Document" \
  -F "category=safety" \
  -F "file=@document.pdf"
```

## 📚 SDKs

### JavaScript/TypeScript
```bash
npm install @claude-talimat/sdk
```

```typescript
import { ClaudeTalimatAPI } from '@claude-talimat/sdk';

const api = new ClaudeTalimatAPI({
  baseURL: 'https://api.claude-talimat.com',
  apiKey: 'your-api-key'
});

// Login
const user = await api.auth.login({
  email: 'user@example.com',
  password: 'password123'
});

// Get documents
const documents = await api.documents.list({
  page: 1,
  limit: 20
});
```

### Python
```bash
pip install claude-talimat-sdk
```

```python
from claude_talimat import ClaudeTalimatAPI

api = ClaudeTalimatAPI(
    base_url='https://api.claude-talimat.com',
    api_key='your-api-key'
)

# Login
user = api.auth.login(
    email='user@example.com',
    password='password123'
)

# Get documents
documents = api.documents.list(page=1, limit=20)
```

## 🔗 Resources

- [OpenAPI Specification](openapi.yaml)
- [Postman Collection](postman-collection.json)
- [SDK Documentation](sdk-docs.md)
- [Rate Limiting Guide](rate-limiting.md)
- [WebSocket Guide](websocket-guide.md)
