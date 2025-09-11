import { Application, Router } from 'https://deno.land/x/oak@v11.1.0/mod.ts';
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import { create, verify } from 'https://deno.land/x/djwt@v2.8/mod.ts';
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
 * OAuth2/OpenID Connect Service
 * Provides OAuth2 authorization server functionality with OpenID Connect support
 */

// OAuth2 Configuration
const OAUTH2_CONFIG = {
  authorizationCodeExpiry: 10 * 60 * 1000, // 10 minutes
  accessTokenExpiry: 60 * 60 * 1000, // 1 hour
  refreshTokenExpiry: 30 * 24 * 60 * 60 * 1000, // 30 days
  supportedScopes: ['openid', 'profile', 'email', 'phone', 'read', 'write', 'admin'],
  supportedGrantTypes: ['authorization_code', 'refresh_token', 'client_credentials'],
  supportedResponseTypes: ['code', 'token', 'id_token'],
  supportedResponseModes: ['query', 'fragment', 'form_post']
};

// In-memory storage for OAuth2 entities
const clients = new Map();
const authorizationCodes = new Map();
const accessTokens = new Map();
const refreshTokens = new Map();

// Initialize OAuth2 clients
const initializeClients = () => {
  // Web application client
  clients.set('web-app', {
    clientId: 'web-app',
    clientSecret: await crypto.subtle.digest('SHA-256', new TextEncoder().encode('web-secret-key')),
    redirectUris: ['http://localhost:3000/callback', 'https://yourdomain.com/callback'],
    grantTypes: ['authorization_code', 'refresh_token'],
    responseTypes: ['code'],
    scopes: ['openid', 'profile', 'email', 'read', 'write'],
    isConfidential: true
  });

  // Mobile application client
  clients.set('mobile-app', {
    clientId: 'mobile-app',
    clientSecret: null, // Public client
    redirectUris: ['com.yourapp://callback'],
    grantTypes: ['authorization_code', 'refresh_token'],
    responseTypes: ['code'],
    scopes: ['openid', 'profile', 'phone', 'read'],
    isConfidential: false
  });

  // API client
  clients.set('api-client', {
    clientId: 'api-client',
    clientSecret: await crypto.subtle.digest('SHA-256', new TextEncoder().encode('api-secret-key')),
    redirectUris: [],
    grantTypes: ['client_credentials'],
    responseTypes: [],
    scopes: ['read', 'write', 'admin'],
    isConfidential: true
  });
};

/**
 * Generate secure random string
 */
const generateRandomString = (length: number): string => {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Generate authorization code
 */
const generateAuthorizationCode = (clientId: string, userId: string, scopes: string[], redirectUri: string): string => {
  const code = generateRandomString(32);
  const expiresAt = new Date(Date.now() + OAUTH2_CONFIG.authorizationCodeExpiry);
  
  authorizationCodes.set(code, {
    clientId,
    userId,
    scopes,
    redirectUri,
    expiresAt,
    used: false
  });
  
  return code;
};

/**
 * Generate access token
 */
const generateAccessToken = async (clientId: string, userId: string, scopes: string[]): Promise<string> => {
  const token = generateRandomString(64);
  const expiresAt = new Date(Date.now() + OAUTH2_CONFIG.accessTokenExpiry);
  
  accessTokens.set(token, {
    clientId,
    userId,
    scopes,
    expiresAt,
    type: 'access'
  });
  
  return token;
};

/**
 * Generate refresh token
 */
const generateRefreshToken = async (clientId: string, userId: string, scopes: string[]): Promise<string> => {
  const token = generateRandomString(64);
  const expiresAt = new Date(Date.now() + OAUTH2_CONFIG.refreshTokenExpiry);
  
  refreshTokens.set(token, {
    clientId,
    userId,
    scopes,
    expiresAt,
    type: 'refresh'
  });
  
  return token;
};

/**
 * Generate ID token (JWT)
 */
const generateIdToken = async (userId: string, clientId: string, scopes: string[]): Promise<string> => {
  const now = Math.floor(Date.now() / 1000);
  
  const payload = {
    iss: 'https://auth.yourdomain.com', // Issuer
    sub: userId, // Subject
    aud: clientId, // Audience
    exp: now + 3600, // Expiration time
    iat: now, // Issued at
    auth_time: now, // Authentication time
    nonce: generateRandomString(16), // Nonce for replay protection
    ...(scopes.includes('profile') && {
      name: 'User Name', // Get from user data
      given_name: 'User',
      family_name: 'Name'
    }),
    ...(scopes.includes('email') && {
      email: 'user@example.com', // Get from user data
      email_verified: true
    }),
    ...(scopes.includes('phone') && {
      phone_number: '+1234567890', // Get from user data
      phone_number_verified: true
    })
  };
  
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(Deno.env.get('JWT_SECRET') || 'your-jwt-secret'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  return await create({ alg: 'HS256', typ: 'JWT' }, payload, key);
};

/**
 * Validate client credentials
 */
const validateClient = (clientId: string, clientSecret?: string): any => {
  const client = clients.get(clientId);
  if (!client) {
    return null;
  }
  
  if (client.isConfidential && clientSecret) {
    const providedSecret = new TextEncoder().encode(clientSecret);
    const storedSecret = client.clientSecret;
    if (!crypto.subtle.timingSafeEqual(providedSecret, storedSecret)) {
      return null;
    }
  }
  
  return client;
};

/**
 * Validate redirect URI
 */
const validateRedirectUri = (client: any, redirectUri: string): boolean => {
  return client.redirectUris.includes(redirectUri);
};

/**
 * Validate scopes
 */
const validateScopes = (requestedScopes: string[], clientScopes: string[]): string[] => {
  return requestedScopes.filter(scope => 
    OAUTH2_CONFIG.supportedScopes.includes(scope) && 
    clientScopes.includes(scope)
  );
};

const app = new Application();
const router = new Router();

// Initialize OAuth2 clients
await initializeClients();

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
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

/**
 * Security middleware
 */
app.use(securityHeadersMiddleware);
app.use(requestLoggingMiddleware);
app.use(rateLimit(100, 15 * 60 * 1000));
app.use(validateInputMiddleware('default'));
app.use(sanitizeInputMiddleware);

// Error handling middleware
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    logger.error('OAuth2 error:', error);
    ctx.response.status = 500;
    ctx.response.body = { 
      error: 'server_error',
      error_description: 'Internal server error'
    };
  }
});

/**
 * OAuth2 Authorization Endpoint
 * GET /oauth2/authorize
 */
router.get('/oauth2/authorize', async (ctx) => {
  try {
    const {
      response_type,
      client_id,
      redirect_uri,
      scope,
      state,
      nonce
    } = ctx.request.url.searchParams;

    // Validate required parameters
    if (!response_type || !client_id || !redirect_uri) {
      ctx.response.status = 400;
      ctx.response.body = {
        error: 'invalid_request',
        error_description: 'Missing required parameters'
      };
      return;
    }

    // Validate client
    const client = validateClient(client_id);
    if (!client) {
      ctx.response.status = 400;
      ctx.response.body = {
        error: 'invalid_client',
        error_description: 'Invalid client'
      };
      return;
    }

    // Validate redirect URI
    if (!validateRedirectUri(client, redirect_uri)) {
      ctx.response.status = 400;
      ctx.response.body = {
        error: 'invalid_request',
        error_description: 'Invalid redirect URI'
      };
      return;
    }

    // Validate response type
    if (!client.responseTypes.includes(response_type)) {
      ctx.response.status = 400;
      ctx.response.body = {
        error: 'unsupported_response_type',
        error_description: 'Unsupported response type'
      };
      return;
    }

    // Parse and validate scopes
    const requestedScopes = scope ? scope.split(' ') : ['openid'];
    const validScopes = validateScopes(requestedScopes, client.scopes);
    
    if (validScopes.length === 0) {
      ctx.response.status = 400;
      ctx.response.body = {
        error: 'invalid_scope',
        error_description: 'Invalid scope'
      };
      return;
    }

    // Check if user is authenticated
    const authHeader = ctx.request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Redirect to login page
      const loginUrl = new URL('/login', 'http://localhost:3000');
      loginUrl.searchParams.set('redirect_uri', ctx.request.url.toString());
      ctx.response.redirect(loginUrl.toString());
      return;
    }

    // For now, assume user is authenticated and get user ID from token
    // In production, verify the token and get user info
    const userId = 'user-123'; // This should come from token verification

    if (response_type === 'code') {
      // Generate authorization code
      const code = generateAuthorizationCode(client_id, userId, validScopes, redirect_uri);
      
      // Redirect with authorization code
      const redirectUrl = new URL(redirect_uri);
      redirectUrl.searchParams.set('code', code);
      if (state) redirectUrl.searchParams.set('state', state);
      
      ctx.response.redirect(redirectUrl.toString());
    } else if (response_type === 'token') {
      // Generate access token directly (implicit flow)
      const accessToken = await generateAccessToken(client_id, userId, validScopes);
      const idToken = validScopes.includes('openid') ? 
        await generateIdToken(userId, client_id, validScopes) : null;
      
      // Redirect with access token
      const redirectUrl = new URL(redirect_uri);
      redirectUrl.hash = `access_token=${accessToken}&token_type=Bearer&expires_in=3600`;
      if (idToken) redirectUrl.hash += `&id_token=${idToken}`;
      if (state) redirectUrl.hash += `&state=${state}`;
      
      ctx.response.redirect(redirectUrl.toString());
    }

  } catch (error) {
    logger.error('Authorization endpoint error:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      error: 'server_error',
      error_description: 'Internal server error'
    };
  }
});

/**
 * OAuth2 Token Endpoint
 * POST /oauth2/token
 */
router.post('/oauth2/token', async (ctx) => {
  try {
    const body = await ctx.request.body().value;
    const {
      grant_type,
      code,
      redirect_uri,
      client_id,
      client_secret,
      refresh_token,
      scope
    } = body;

    // Validate client
    const client = validateClient(client_id, client_secret);
    if (!client) {
      ctx.response.status = 401;
      ctx.response.body = {
        error: 'invalid_client',
        error_description: 'Invalid client credentials'
      };
      return;
    }

    if (grant_type === 'authorization_code') {
      // Authorization Code Grant
      if (!code || !redirect_uri) {
        ctx.response.status = 400;
        ctx.response.body = {
          error: 'invalid_request',
          error_description: 'Missing required parameters'
        };
        return;
      }

      const authCode = authorizationCodes.get(code);
      if (!authCode || authCode.used || authCode.expiresAt < new Date()) {
        ctx.response.status = 400;
        ctx.response.body = {
          error: 'invalid_grant',
          error_description: 'Invalid or expired authorization code'
        };
        return;
      }

      if (authCode.clientId !== client_id || authCode.redirectUri !== redirect_uri) {
        ctx.response.status = 400;
        ctx.response.body = {
          error: 'invalid_grant',
          error_description: 'Invalid authorization code'
        };
        return;
      }

      // Mark code as used
      authCode.used = true;

      // Generate tokens
      const accessToken = await generateAccessToken(client_id, authCode.userId, authCode.scopes);
      const refreshToken = await generateRefreshToken(client_id, authCode.userId, authCode.scopes);
      const idToken = authCode.scopes.includes('openid') ? 
        await generateIdToken(authCode.userId, client_id, authCode.scopes) : null;

      ctx.response.body = {
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: refreshToken,
        scope: authCode.scopes.join(' '),
        ...(idToken && { id_token: idToken })
      };

    } else if (grant_type === 'refresh_token') {
      // Refresh Token Grant
      if (!refresh_token) {
        ctx.response.status = 400;
        ctx.response.body = {
          error: 'invalid_request',
          error_description: 'Missing refresh token'
        };
        return;
      }

      const refreshTokenData = refreshTokens.get(refresh_token);
      if (!refreshTokenData || refreshTokenData.expiresAt < new Date()) {
        ctx.response.status = 400;
        ctx.response.body = {
          error: 'invalid_grant',
          error_description: 'Invalid or expired refresh token'
        };
        return;
      }

      if (refreshTokenData.clientId !== client_id) {
        ctx.response.status = 400;
        ctx.response.body = {
          error: 'invalid_grant',
          error_description: 'Invalid refresh token'
        };
        return;
      }

      // Generate new access token
      const accessToken = await generateAccessToken(client_id, refreshTokenData.userId, refreshTokenData.scopes);
      const newRefreshToken = await generateRefreshToken(client_id, refreshTokenData.userId, refreshTokenData.scopes);

      // Remove old refresh token
      refreshTokens.delete(refresh_token);

      ctx.response.body = {
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: newRefreshToken,
        scope: refreshTokenData.scopes.join(' ')
      };

    } else if (grant_type === 'client_credentials') {
      // Client Credentials Grant
      if (!client.grantTypes.includes('client_credentials')) {
        ctx.response.status = 400;
        ctx.response.body = {
          error: 'unsupported_grant_type',
          error_description: 'Client credentials grant not supported'
        };
        return;
      }

      const requestedScopes = scope ? scope.split(' ') : ['read'];
      const validScopes = validateScopes(requestedScopes, client.scopes);

      const accessToken = await generateAccessToken(client_id, client_id, validScopes);

      ctx.response.body = {
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: 3600,
        scope: validScopes.join(' ')
      };

    } else {
      ctx.response.status = 400;
      ctx.response.body = {
        error: 'unsupported_grant_type',
        error_description: 'Unsupported grant type'
      };
      return;
    }

  } catch (error) {
    logger.error('Token endpoint error:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      error: 'server_error',
      error_description: 'Internal server error'
    };
  }
});

/**
 * OpenID Connect UserInfo Endpoint
 * GET /oauth2/userinfo
 */
router.get('/oauth2/userinfo', async (ctx) => {
  try {
    const authHeader = ctx.request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      ctx.response.status = 401;
      ctx.response.body = {
        error: 'invalid_token',
        error_description: 'Access token required'
      };
      return;
    }

    const accessToken = authHeader.substring(7);
    const tokenData = accessTokens.get(accessToken);
    
    if (!tokenData || tokenData.expiresAt < new Date()) {
      ctx.response.status = 401;
      ctx.response.body = {
        error: 'invalid_token',
        error_description: 'Invalid or expired access token'
      };
      return;
    }

    // Get user information based on token scopes
    const userInfo: any = {
      sub: tokenData.userId
    };

    if (tokenData.scopes.includes('profile')) {
      userInfo.name = 'User Name';
      userInfo.given_name = 'User';
      userInfo.family_name = 'Name';
    }

    if (tokenData.scopes.includes('email')) {
      userInfo.email = 'user@example.com';
      userInfo.email_verified = true;
    }

    if (tokenData.scopes.includes('phone')) {
      userInfo.phone_number = '+1234567890';
      userInfo.phone_number_verified = true;
    }

    ctx.response.body = userInfo;

  } catch (error) {
    logger.error('UserInfo endpoint error:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      error: 'server_error',
      error_description: 'Internal server error'
    };
  }
});

/**
 * OpenID Connect Discovery Endpoint
 * GET /.well-known/openid_configuration
 */
router.get('/.well-known/openid_configuration', (ctx) => {
  ctx.response.body = {
    issuer: 'https://auth.yourdomain.com',
    authorization_endpoint: 'https://auth.yourdomain.com/oauth2/authorize',
    token_endpoint: 'https://auth.yourdomain.com/oauth2/token',
    userinfo_endpoint: 'https://auth.yourdomain.com/oauth2/userinfo',
    jwks_uri: 'https://auth.yourdomain.com/.well-known/jwks.json',
    response_types_supported: OAUTH2_CONFIG.supportedResponseTypes,
    response_modes_supported: OAUTH2_CONFIG.supportedResponseModes,
    grant_types_supported: OAUTH2_CONFIG.supportedGrantTypes,
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['HS256', 'RS256'],
    scopes_supported: OAUTH2_CONFIG.supportedScopes,
    claims_supported: [
      'sub', 'iss', 'aud', 'exp', 'iat', 'auth_time',
      'name', 'given_name', 'family_name',
      'email', 'email_verified',
      'phone_number', 'phone_number_verified'
    ]
  };
});

/**
 * JWKS Endpoint
 * GET /.well-known/jwks.json
 */
router.get('/.well-known/jwks.json', (ctx) => {
  ctx.response.body = {
    keys: [
      {
        kty: 'oct',
        kid: 'default',
        use: 'sig',
        alg: 'HS256',
        k: 'your-jwt-secret-base64-encoded'
      }
    ]
  };
});

/**
 * Health check
 */
router.get('/health', (ctx) => {
  ctx.response.body = {
    status: 'healthy',
    service: 'OAuth2 Service',
    timestamp: new Date().toISOString(),
    clients: clients.size,
    activeCodes: authorizationCodes.size,
    activeTokens: accessTokens.size
  };
});

app.use(router.routes());
app.use(router.allowedMethods());

// Start server
const PORT = Deno.env.get('PORT') || 8008;
console.log(`🚀 OAuth2 Service starting on port ${PORT}`);
await app.listen({ port: parseInt(PORT) });
console.log(`✅ OAuth2 Service running on port ${PORT}`);
