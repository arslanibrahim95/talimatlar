import { Application, Router, Context } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { cors } from "./cors.ts";
import APIKeyManager from "./src/config/apiKeys.ts";
import AdvancedCommandProcessor from "./src/commands/advancedCommands.ts";
import { redisCache, redisCacheMiddleware } from "./src/cache/redisCache.ts";
import { cacheMiddleware, chatCache, commandCache } from "./src/cache/cacheManager.ts";
import { errorHandler, createServerError, createValidationError, withErrorHandling } from "./src/utils/errorHandling.ts";

// Import handlers
import { createChatSession, getChatSession, addChatMessage, getAllChatSessions } from "./src/handlers/chatHandlers.ts";
import { handleSystemCommand } from "./src/handlers/systemHandlers.ts";
import { handleFileAnalysis } from "./src/handlers/fileHandlers.ts";

// Initialize services
const apiKeyManager = APIKeyManager.getInstance();
const advancedCommandProcessor = new AdvancedCommandProcessor();

// Initialize cache
await redisCache.connect();

const app = new Application();
const router = new Router();

// CORS middleware
app.use(cors);

// Cache middleware for API routes
app.use(redisCacheMiddleware(300)); // 5 minutes default TTL

// Health check
router.get("/health", withErrorHandling(async (ctx: Context) => {
  const config = apiKeyManager.getConfig();
  ctx.response.body = {
    status: "healthy",
    service: "ai-integration-service",
    timestamp: new Date().toISOString(),
    providers: [
      { name: 'openai', model: config.openai.model, enabled: config.openai.enabled },
      { name: 'claude', model: config.claude.model, enabled: config.claude.enabled },
      { name: 'local', model: config.local.model, enabled: config.local.enabled }
    ],
    errorStats: errorHandler.getErrorStats()
  };
}));

// Chat endpoints
router.post("/chat/sessions", createChatSession);
router.get("/chat/sessions/:sessionId", getChatSession);
router.post("/chat/sessions/:sessionId/messages", addChatMessage);

// AI Provider functions moved to src/services/aiService.ts

// System command processing
router.post("/commands/execute", handleSystemCommand);

// Advanced command processing
router.post("/commands/advanced", withErrorHandling(async (ctx: Context) => {
  const { command, context } = await ctx.request.body().value;
  
  if (!command) {
    throw createValidationError('Command is required');
  }
  
  const commandContext = {
    userId: context?.userId || 'anonymous',
    sessionId: context?.sessionId || 'default',
    timestamp: new Date(),
    previousCommands: context?.previousCommands || [],
    systemState: context?.systemState || {}
  };
  
  const result = await advancedCommandProcessor.processSystemCommand(command, commandContext);
  
  ctx.response.body = {
    success: true,
    data: result
  };
}));

// API Key management endpoints
router.get("/config/api-keys", (ctx: Context) => {
  const config = apiKeyManager.getConfig();
  ctx.response.body = {
    success: true,
    data: {
      openai: {
        enabled: config.openai.enabled,
        model: config.openai.model,
        hasKey: !!config.openai.apiKey
      },
      claude: {
        enabled: config.claude.enabled,
        model: config.claude.model,
        hasKey: !!config.claude.apiKey
      },
      local: {
        enabled: config.local.enabled,
        endpoint: config.local.endpoint,
        model: config.local.model
      }
    }
  };
});

router.post("/config/api-keys", async (ctx: Context) => {
  try {
    const { provider, config: newConfig } = await ctx.request.body().value;
    
    const updateData: any = {};
    updateData[provider] = newConfig;
    
    const success = await apiKeyManager.updateConfig(updateData);
    
    ctx.response.body = {
      success,
      data: { message: success ? 'Configuration updated successfully' : 'Failed to update configuration' }
    };
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
});

router.post("/config/validate-key", async (ctx: Context) => {
  try {
    const { provider, apiKey } = await ctx.request.body().value;
    
    const isValid = await apiKeyManager.validateAPIKey(provider, apiKey);
    
    ctx.response.body = {
      success: true,
      data: { valid: isValid }
    };
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
});

// Usage statistics with caching
router.get("/analytics/usage", async (ctx: Context) => {
  const cacheKey = "analytics:usage";
  const cached = await redisCache.get(cacheKey);
  
  if (cached) {
    ctx.response.body = cached;
    ctx.response.headers.set('X-Cache', 'HIT');
    return;
  }

  const usageStats = apiKeyManager.getUsageStats();
  const chatSessions = getAllChatSessions();
  const totalSessions = chatSessions.size;
  const totalMessages = Array.from(chatSessions.values())
    .reduce((sum, session) => sum + session.messages.length, 0);
  const activeSessions = Array.from(chatSessions.values())
    .filter(session => 
      Date.now() - session.updatedAt.getTime() < 24 * 60 * 60 * 1000
    ).length;
  
  const response = {
    success: true,
    data: {
      totalSessions,
      totalMessages,
      activeSessions,
      usageStats,
      providers: apiKeyManager.getConfig(),
      cacheStats: {
        memory: chatCache.getStats(),
        redis: await redisCache.getStats()
      }
    }
  };

  // Cache for 5 minutes
  await redisCache.set(cacheKey, response, 300);
  ctx.response.body = response;
  ctx.response.headers.set('X-Cache', 'MISS');
});

// System command functions moved to src/handlers/systemHandlers.ts

// File processing endpoints
router.post("/files/analyze", handleFileAnalysis);

// Analytics endpoints
router.get("/analytics/usage", (ctx: Context) => {
  const chatSessions = getAllChatSessions();
  const usage = {
    totalSessions: chatSessions.size,
    totalMessages: Array.from(chatSessions.values())
      .reduce((sum, session) => sum + session.messages.length, 0),
    activeSessions: Array.from(chatSessions.values())
      .filter(session => 
        Date.now() - session.updatedAt.getTime() < 24 * 60 * 60 * 1000
      ).length,
    providers: [
      { name: 'openai', model: 'gpt-4', configured: !!Deno.env.get('OPENAI_API_KEY') },
      { name: 'claude', model: 'claude-3-sonnet-20240229', configured: !!Deno.env.get('CLAUDE_API_KEY') }
    ]
  };
  
  ctx.response.body = {
    success: true,
    data: usage
  };
});

// Global error handler middleware
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    const appError = errorHandler.handleError(error as Error, {
      url: ctx.request.url.toString(),
      method: ctx.request.method,
      userAgent: ctx.request.headers.get('user-agent') || undefined,
    });

    ctx.response.status = appError.statusCode || 500;
    ctx.response.body = {
      success: false,
      error: {
        message: appError.message,
        type: appError.type,
        severity: appError.severity,
        isRetryable: appError.isRetryable,
        retryAfter: appError.retryAfter,
        timestamp: appError.context.timestamp.toISOString(),
      }
    };
  }
});

// Routes
app.use(router.routes());
app.use(router.allowedMethods());

// Start server
const port = 8006;
console.log(`🤖 AI Integration Service starting on port ${port}`);

await app.listen({ port });
