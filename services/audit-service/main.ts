import { Application, Router } from 'https://deno.land/x/oak@v11.1.0/mod.ts';
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import { logger } from './utils/logger.ts';
import { 
  validateInputMiddleware, 
  sanitizeInputMiddleware, 
  securityHeadersMiddleware,
  requestLoggingMiddleware,
  rateLimit
} from './middleware/validation.ts';
import { Database } from './database/database.ts';
import { crypto } from 'https://deno.land/std@0.208.0/crypto/mod.ts';

/**
 * Audit Logging Service
 * Provides comprehensive audit logging and monitoring capabilities
 */

// Audit Event Types
export enum AuditEventType {
  // Authentication Events
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  USER_REGISTRATION = 'user_registration',
  PASSWORD_CHANGE = 'password_change',
  PASSWORD_RESET = 'password_reset',
  
  // Authorization Events
  PERMISSION_GRANTED = 'permission_granted',
  PERMISSION_DENIED = 'permission_denied',
  ROLE_ASSIGNED = 'role_assigned',
  ROLE_REVOKED = 'role_revoked',
  
  // API Key Events
  API_KEY_CREATED = 'api_key_created',
  API_KEY_UPDATED = 'api_key_updated',
  API_KEY_DELETED = 'api_key_deleted',
  API_KEY_ROTATED = 'api_key_rotated',
  API_KEY_USED = 'api_key_used',
  
  // Data Access Events
  DATA_READ = 'data_read',
  DATA_CREATED = 'data_created',
  DATA_UPDATED = 'data_updated',
  DATA_DELETED = 'data_deleted',
  DATA_EXPORTED = 'data_exported',
  DATA_IMPORTED = 'data_imported',
  
  // Security Events
  SECURITY_VIOLATION = 'security_violation',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  INVALID_CREDENTIALS = 'invalid_credentials',
  
  // System Events
  SYSTEM_STARTUP = 'system_startup',
  SYSTEM_SHUTDOWN = 'system_shutdown',
  CONFIGURATION_CHANGE = 'configuration_change',
  BACKUP_CREATED = 'backup_created',
  BACKUP_RESTORED = 'backup_restored'
}

// Audit Event Severity
export enum AuditSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Audit Event Interface
interface AuditEvent {
  id: string;
  timestamp: string;
  eventType: AuditEventType;
  severity: AuditSeverity;
  userId?: string;
  sessionId?: string;
  ipAddress: string;
  userAgent: string;
  service: string;
  action: string;
  resource?: string;
  resourceId?: string;
  details: any;
  outcome: 'success' | 'failure' | 'partial';
  errorMessage?: string;
  tags: string[];
  metadata: any;
}

// In-memory storage for audit events
const auditEvents = new Map<string, AuditEvent>();
const eventIndex = new Map<string, Set<string>>(); // For fast lookups

/**
 * Generate audit event ID
 */
const generateEventId = (): string => {
  return crypto.randomUUID();
};

/**
 * Index audit event for fast lookups
 */
const indexAuditEvent = (event: AuditEvent) => {
  // Index by user ID
  if (event.userId) {
    if (!eventIndex.has(`user:${event.userId}`)) {
      eventIndex.set(`user:${event.userId}`, new Set());
    }
    eventIndex.get(`user:${event.userId}`)!.add(event.id);
  }
  
  // Index by event type
  if (!eventIndex.has(`type:${event.eventType}`)) {
    eventIndex.set(`type:${event.eventType}`, new Set());
  }
  eventIndex.get(`type:${event.eventType}`)!.add(event.id);
  
  // Index by service
  if (!eventIndex.has(`service:${event.service}`)) {
    eventIndex.set(`service:${event.service}`, new Set());
  }
  eventIndex.get(`service:${event.service}`)!.add(event.id);
  
  // Index by severity
  if (!eventIndex.has(`severity:${event.severity}`)) {
    eventIndex.set(`severity:${event.severity}`, new Set());
  }
  eventIndex.get(`severity:${event.severity}`)!.add(event.id);
  
  // Index by date (YYYY-MM-DD)
  const date = event.timestamp.split('T')[0];
  if (!eventIndex.has(`date:${date}`)) {
    eventIndex.set(`date:${date}`, new Set());
  }
  eventIndex.get(`date:${date}`)!.add(event.id);
};

/**
 * Create audit event
 */
const createAuditEvent = (eventData: Partial<AuditEvent>): AuditEvent => {
  const event: AuditEvent = {
    id: generateEventId(),
    timestamp: new Date().toISOString(),
    eventType: eventData.eventType || AuditEventType.SYSTEM_STARTUP,
    severity: eventData.severity || AuditSeverity.LOW,
    userId: eventData.userId,
    sessionId: eventData.sessionId,
    ipAddress: eventData.ipAddress || 'unknown',
    userAgent: eventData.userAgent || 'unknown',
    service: eventData.service || 'audit-service',
    action: eventData.action || 'unknown',
    resource: eventData.resource,
    resourceId: eventData.resourceId,
    details: eventData.details || {},
    outcome: eventData.outcome || 'success',
    errorMessage: eventData.errorMessage,
    tags: eventData.tags || [],
    metadata: eventData.metadata || {}
  };
  
  return event;
};

/**
 * Store audit event
 */
const storeAuditEvent = (event: AuditEvent): void => {
  auditEvents.set(event.id, event);
  indexAuditEvent(event);
  
  // Log to console for monitoring
  logger.audit(event.eventType, event.userId || 'system', event.outcome === 'success', {
    severity: event.severity,
    service: event.service,
    action: event.action,
    resource: event.resource,
    ipAddress: event.ipAddress
  });
};

const app = new Application();
const router = new Router();

/**
 * CORS middleware configuration
 */
app.use(oakCors({
  origin: (origin) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://yourdomain.com'
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      return true;
    }
    
    return false;
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key']
}));

/**
 * Security middleware
 */
app.use(securityHeadersMiddleware);
app.use(requestLoggingMiddleware);
app.use(rateLimit(1000, 15 * 60 * 1000)); // Higher limit for audit service
app.use(validateInputMiddleware('audit'));
app.use(sanitizeInputMiddleware);

// Error handling middleware
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    logger.error('Audit service error:', error);
    ctx.response.status = 500;
    ctx.response.body = { 
      error: 'internal_server_error',
      message: 'Internal server error'
    };
  }
});

/**
 * Log Audit Event
 * POST /audit/events
 */
router.post('/audit/events', async (ctx) => {
  try {
    const body = ctx.state.sanitizedData;
    const {
      eventType,
      severity,
      userId,
      sessionId,
      service,
      action,
      resource,
      resourceId,
      details,
      outcome,
      errorMessage,
      tags,
      metadata
    } = body;
    
    // Validate required fields
    if (!eventType || !service || !action) {
      ctx.response.status = 400;
      ctx.response.body = {
        error: 'missing_required_fields',
        message: 'eventType, service, and action are required'
      };
      return;
    }
    
    // Validate event type
    if (!Object.values(AuditEventType).includes(eventType)) {
      ctx.response.status = 400;
      ctx.response.body = {
        error: 'invalid_event_type',
        message: 'Invalid event type'
      };
      return;
    }
    
    // Validate severity
    if (severity && !Object.values(AuditSeverity).includes(severity)) {
      ctx.response.status = 400;
      ctx.response.body = {
        error: 'invalid_severity',
        message: 'Invalid severity level'
      };
      return;
    }
    
    // Create audit event
    const event = createAuditEvent({
      eventType,
      severity,
      userId,
      sessionId,
      ipAddress: ctx.request.ip || 'unknown',
      userAgent: ctx.request.headers.get('User-Agent') || 'unknown',
      service,
      action,
      resource,
      resourceId,
      details,
      outcome,
      errorMessage,
      tags,
      metadata
    });
    
    // Store event
    storeAuditEvent(event);
    
    logger.info('Audit event logged', { 
      eventId: event.id, 
      eventType, 
      severity: event.severity,
      userId: event.userId,
      service: event.service
    });
    
    ctx.response.status = 201;
    ctx.response.body = {
      id: event.id,
      timestamp: event.timestamp,
      message: 'Audit event logged successfully'
    };
    
  } catch (error) {
    logger.error('Log audit event error:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      error: 'logging_failed',
      message: 'Failed to log audit event'
    };
  }
});

/**
 * Get Audit Events
 * GET /audit/events
 */
router.get('/audit/events', async (ctx) => {
  try {
    const {
      userId,
      eventType,
      service,
      severity,
      startDate,
      endDate,
      limit = '100',
      offset = '0'
    } = ctx.request.url.searchParams;
    
    let eventIds = new Set<string>();
    
    // Apply filters
    if (userId) {
      const userEvents = eventIndex.get(`user:${userId}`);
      if (userEvents) {
        eventIds = userEvents;
      } else {
        eventIds = new Set();
      }
    }
    
    if (eventType) {
      const typeEvents = eventIndex.get(`type:${eventType}`);
      if (typeEvents) {
        eventIds = eventIds.size > 0 ? 
          new Set([...eventIds].filter(id => typeEvents.has(id))) : 
          typeEvents;
      } else {
        eventIds = new Set();
      }
    }
    
    if (service) {
      const serviceEvents = eventIndex.get(`service:${service}`);
      if (serviceEvents) {
        eventIds = eventIds.size > 0 ? 
          new Set([...eventIds].filter(id => serviceEvents.has(id))) : 
          serviceEvents;
      } else {
        eventIds = new Set();
      }
    }
    
    if (severity) {
      const severityEvents = eventIndex.get(`severity:${severity}`);
      if (severityEvents) {
        eventIds = eventIds.size > 0 ? 
          new Set([...eventIds].filter(id => severityEvents.has(id))) : 
          severityEvents;
      } else {
        eventIds = new Set();
      }
    }
    
    // If no filters applied, get all events
    if (eventIds.size === 0 && !userId && !eventType && !service && !severity) {
      eventIds = new Set(auditEvents.keys());
    }
    
    // Convert to array and sort by timestamp (newest first)
    let events = Array.from(eventIds)
      .map(id => auditEvents.get(id))
      .filter(event => event !== undefined)
      .sort((a, b) => new Date(b!.timestamp).getTime() - new Date(a!.timestamp).getTime());
    
    // Apply date filters
    if (startDate) {
      events = events.filter(event => event!.timestamp >= startDate);
    }
    if (endDate) {
      events = events.filter(event => event!.timestamp <= endDate);
    }
    
    // Apply pagination
    const limitNum = parseInt(limit);
    const offsetNum = parseInt(offset);
    const paginatedEvents = events.slice(offsetNum, offsetNum + limitNum);
    
    ctx.response.body = {
      events: paginatedEvents,
      total: events.length,
      limit: limitNum,
      offset: offsetNum,
      hasMore: offsetNum + limitNum < events.length
    };
    
  } catch (error) {
    logger.error('Get audit events error:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      error: 'retrieval_failed',
      message: 'Failed to retrieve audit events'
    };
  }
});

/**
 * Get Audit Event by ID
 * GET /audit/events/:id
 */
router.get('/audit/events/:id', async (ctx) => {
  try {
    const eventId = ctx.params.id;
    const event = auditEvents.get(eventId);
    
    if (!event) {
      ctx.response.status = 404;
      ctx.response.body = {
        error: 'event_not_found',
        message: 'Audit event not found'
      };
      return;
    }
    
    ctx.response.body = event;
    
  } catch (error) {
    logger.error('Get audit event error:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      error: 'retrieval_failed',
      message: 'Failed to retrieve audit event'
    };
  }
});

/**
 * Get Audit Statistics
 * GET /audit/statistics
 */
router.get('/audit/statistics', async (ctx) => {
  try {
    const { startDate, endDate } = ctx.request.url.searchParams;
    
    let events = Array.from(auditEvents.values());
    
    // Apply date filters
    if (startDate) {
      events = events.filter(event => event.timestamp >= startDate);
    }
    if (endDate) {
      events = events.filter(event => event.timestamp <= endDate);
    }
    
    // Calculate statistics
    const stats = {
      totalEvents: events.length,
      eventsByType: {},
      eventsBySeverity: {},
      eventsByService: {},
      eventsByOutcome: {},
      eventsByUser: {},
      timeRange: {
        start: events.length > 0 ? events[events.length - 1].timestamp : null,
        end: events.length > 0 ? events[0].timestamp : null
      }
    };
    
    // Count by type
    events.forEach(event => {
      stats.eventsByType[event.eventType] = (stats.eventsByType[event.eventType] || 0) + 1;
      stats.eventsBySeverity[event.severity] = (stats.eventsBySeverity[event.severity] || 0) + 1;
      stats.eventsByService[event.service] = (stats.eventsByService[event.service] || 0) + 1;
      stats.eventsByOutcome[event.outcome] = (stats.eventsByOutcome[event.outcome] || 0) + 1;
      
      if (event.userId) {
        stats.eventsByUser[event.userId] = (stats.eventsByUser[event.userId] || 0) + 1;
      }
    });
    
    ctx.response.body = stats;
    
  } catch (error) {
    logger.error('Get audit statistics error:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      error: 'statistics_failed',
      message: 'Failed to retrieve audit statistics'
    };
  }
});

/**
 * Search Audit Events
 * POST /audit/search
 */
router.post('/audit/search', async (ctx) => {
  try {
    const body = ctx.state.sanitizedData;
    const {
      query,
      filters = {},
      sortBy = 'timestamp',
      sortOrder = 'desc',
      limit = 100,
      offset = 0
    } = body;
    
    let events = Array.from(auditEvents.values());
    
    // Apply text search
    if (query) {
      const searchTerm = query.toLowerCase();
      events = events.filter(event => 
        event.action.toLowerCase().includes(searchTerm) ||
        event.service.toLowerCase().includes(searchTerm) ||
        (event.resource && event.resource.toLowerCase().includes(searchTerm)) ||
        (event.details && JSON.stringify(event.details).toLowerCase().includes(searchTerm))
      );
    }
    
    // Apply filters
    if (filters.userId) {
      events = events.filter(event => event.userId === filters.userId);
    }
    if (filters.eventType) {
      events = events.filter(event => event.eventType === filters.eventType);
    }
    if (filters.service) {
      events = events.filter(event => event.service === filters.service);
    }
    if (filters.severity) {
      events = events.filter(event => event.severity === filters.severity);
    }
    if (filters.outcome) {
      events = events.filter(event => event.outcome === filters.outcome);
    }
    if (filters.startDate) {
      events = events.filter(event => event.timestamp >= filters.startDate);
    }
    if (filters.endDate) {
      events = events.filter(event => event.timestamp <= filters.endDate);
    }
    
    // Sort events
    events.sort((a, b) => {
      const aValue = a[sortBy as keyof AuditEvent];
      const bValue = b[sortBy as keyof AuditEvent];
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    // Apply pagination
    const paginatedEvents = events.slice(offset, offset + limit);
    
    ctx.response.body = {
      events: paginatedEvents,
      total: events.length,
      limit,
      offset,
      hasMore: offset + limit < events.length
    };
    
  } catch (error) {
    logger.error('Search audit events error:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      error: 'search_failed',
      message: 'Failed to search audit events'
    };
  }
});

/**
 * Health check
 */
router.get('/health', (ctx) => {
  ctx.response.body = {
    status: 'healthy',
    service: 'Audit Service',
    timestamp: new Date().toISOString(),
    totalEvents: auditEvents.size,
    totalIndexes: eventIndex.size
  };
});

app.use(router.routes());
app.use(router.allowedMethods());

// Start server
const PORT = Deno.env.get('PORT') || 8010;
console.log(`🚀 Audit Service starting on port ${PORT}`);
await app.listen({ port: parseInt(PORT) });
console.log(`✅ Audit Service running on port ${PORT}`);
