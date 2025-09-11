# API Gateway - Enhanced Security & Performance

## Overview

The API Gateway is a centralized entry point for all API requests, providing advanced security, monitoring, and routing capabilities. It acts as a reverse proxy with intelligent load balancing, circuit breakers, and comprehensive security features.

## Features

### 🔐 Security
- **JWT Authentication**: Centralized token validation with caching
- **Rate Limiting**: Per-service and per-client rate limiting with burst protection
- **DDoS Protection**: Automatic detection and blocking of suspicious traffic
- **Request Validation**: Schema-based request/response validation
- **Security Headers**: Comprehensive security headers for all responses
- **CORS Management**: Configurable CORS policies
- **IP Blocking**: Dynamic IP blocking and whitelisting

### ⚡ Performance
- **Load Balancing**: Multiple strategies (round-robin, least-connections, weighted)
- **Circuit Breaker**: Automatic service failure detection and recovery
- **Health Checks**: Continuous monitoring of service health
- **Connection Pooling**: Efficient connection management
- **Response Caching**: Intelligent caching of responses

### 📊 Monitoring
- **Request Logging**: Comprehensive request/response logging
- **Metrics Collection**: Real-time performance metrics
- **Health Monitoring**: Service health status and alerts
- **Error Tracking**: Detailed error logging and analysis

### 🔄 API Management
- **Versioning**: Support for multiple API versions
- **Service Discovery**: Dynamic service registration and discovery
- **Request Transformation**: Request/response modification
- **Backward Compatibility**: Seamless API evolution

## Architecture

```
Client Request → Nginx → API Gateway → Backend Services
                     ↓
                [Security Layer]
                [Rate Limiting]
                [Authentication]
                [Load Balancing]
                [Circuit Breaker]
                [Health Checks]
```

## Configuration

### Environment Variables

```bash
# Core Configuration
PORT=8080
NODE_ENV=development
LOG_LEVEL=INFO

# Security
JWT_SECRET=your-secret-key
AUTH_SERVICE_URL=http://auth-service:8003

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Circuit Breaker
CIRCUIT_BREAKER_ENABLED=true
CIRCUIT_BREAKER_FAILURE_THRESHOLD=5
CIRCUIT_BREAKER_RECOVERY_TIMEOUT=30000
```

### Service Configuration

Each service is configured with:
- **Hosts**: List of service instances
- **Health Check**: Health check endpoint
- **Timeout**: Request timeout
- **Retries**: Number of retry attempts
- **Circuit Breaker**: Failure threshold and recovery settings

## API Endpoints

### Gateway Management

- `GET /gateway/health` - Overall gateway health
- `GET /gateway/health/:service` - Service-specific health
- `GET /gateway/metrics` - Gateway metrics
- `GET /gateway/services` - Service registry

### API Routes

All API requests follow the pattern:
```
/api/:version/:service/*
```

Examples:
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/documents` - Create document
- `GET /api/v1/analytics/dashboard` - Get analytics

## Security Features

### Authentication
- JWT token validation
- Token caching for performance
- Automatic token refresh
- User context propagation

### Rate Limiting
- Per-service rate limits
- Burst protection
- Client-based limiting
- Configurable thresholds

### DDoS Protection
- Request frequency monitoring
- Automatic IP blocking
- Suspicious pattern detection
- Alert generation

### Request Validation
- Schema-based validation
- Input sanitization
- Type checking
- Custom validation rules

## Monitoring & Observability

### Metrics
- Request count and duration
- Error rates
- Service health status
- Circuit breaker status
- Rate limiting statistics

### Logging
- Structured logging
- Request/response logging
- Error tracking
- Security event logging

### Health Checks
- Service availability
- Response time monitoring
- Failure detection
- Automatic recovery

## Load Balancing

### Strategies
1. **Round Robin**: Distribute requests evenly
2. **Least Connections**: Route to least busy instance
3. **Weighted Round Robin**: Weighted distribution
4. **IP Hash**: Consistent routing by IP

### Health Monitoring
- Continuous health checks
- Automatic failover
- Instance recovery detection
- Load distribution optimization

## Circuit Breaker

### States
- **CLOSED**: Normal operation
- **OPEN**: Service unavailable
- **HALF_OPEN**: Testing recovery

### Configuration
- Failure threshold
- Recovery timeout
- Monitoring period
- Automatic state transitions

## Deployment

### Docker
```bash
# Build and run
docker-compose up api-gateway

# Health check
curl http://localhost:8080/gateway/health
```

### Environment Setup
```bash
# Copy environment file
cp env.example .env

# Update configuration
vim .env

# Start services
docker-compose up -d
```

## Monitoring Dashboard

Access the monitoring dashboard at:
- **Gateway Health**: `http://localhost:8080/gateway/health`
- **Metrics**: `http://localhost:8080/gateway/metrics`
- **Services**: `http://localhost:8080/gateway/services`

## Security Best Practices

1. **Use HTTPS**: Always use HTTPS in production
2. **Strong JWT Secrets**: Use cryptographically strong secrets
3. **Rate Limiting**: Configure appropriate rate limits
4. **IP Whitelisting**: Restrict access to known IPs
5. **Regular Updates**: Keep dependencies updated
6. **Monitoring**: Monitor security events
7. **Logging**: Enable comprehensive logging

## Troubleshooting

### Common Issues

1. **Service Unavailable**
   - Check service health: `GET /gateway/health/:service`
   - Verify service configuration
   - Check circuit breaker status

2. **Rate Limit Exceeded**
   - Check rate limit configuration
   - Verify client IP
   - Review rate limit logs

3. **Authentication Failures**
   - Verify JWT secret
   - Check token validity
   - Review auth service health

4. **Performance Issues**
   - Check metrics: `GET /gateway/metrics`
   - Review service response times
   - Verify load balancing configuration

### Debug Mode

Enable debug logging:
```bash
LOG_LEVEL=DEBUG
```

### Health Check Commands

```bash
# Overall health
curl http://localhost:8080/gateway/health

# Service health
curl http://localhost:8080/gateway/health/auth

# Metrics
curl http://localhost:8080/gateway/metrics
```

## API Versioning

### Supported Versions
- **v1**: Current stable version
- **v2**: Future version (planned)

### Version Negotiation
- Path-based: `/api/v1/service`
- Header-based: `Accept: application/vnd.api+json;version=1`
- Query parameter: `?version=v1`

### Migration
- Backward compatibility maintained
- Deprecation notices
- Migration guides provided
- Sunset dates communicated

## Performance Tuning

### Optimization Tips
1. **Connection Pooling**: Configure appropriate pool sizes
2. **Caching**: Enable response caching where appropriate
3. **Compression**: Use gzip compression
4. **Keep-Alive**: Enable HTTP keep-alive
5. **Timeouts**: Set appropriate timeout values

### Scaling
- Horizontal scaling supported
- Load balancer configuration
- Service discovery
- Health check optimization

## Security Considerations

### Threat Protection
- SQL injection prevention
- XSS protection
- CSRF protection
- Directory traversal prevention
- Command injection prevention

### Compliance
- GDPR compliance
- Data protection
- Audit logging
- Access control
- Encryption in transit

## Support

For issues and questions:
1. Check the logs: `docker logs claude-api-gateway`
2. Review metrics: `GET /gateway/metrics`
3. Check health status: `GET /gateway/health`
4. Review configuration
5. Contact support team
