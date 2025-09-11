import { Context, Next } from 'https://deno.land/x/oak@v12.6.1/mod.ts';
import { logger } from '../logger.ts';

interface ValidationRule {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  enum?: any[];
  custom?: (value: any) => boolean;
}

interface ValidationSchema {
  [key: string]: ValidationRule | ValidationSchema;
}

interface ServiceValidationConfig {
  request?: ValidationSchema;
  response?: ValidationSchema;
  headers?: ValidationSchema;
}

export class ValidationMiddleware {
  private schemas = new Map<string, ServiceValidationConfig>();

  constructor() {
    this.initializeDefaultSchemas();
  }

  private initializeDefaultSchemas(): void {
    // Auth service validation
    this.schemas.set('auth', {
      request: {
        '/login': {
          phone: { required: true, type: 'string', pattern: /^\+?[1-9]\d{1,14}$/ },
          password: { required: true, type: 'string', minLength: 6 }
        },
        '/register': {
          phone: { required: true, type: 'string', pattern: /^\+?[1-9]\d{1,14}$/ },
          password: { required: true, type: 'string', minLength: 6 },
          email: { type: 'string', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }
        }
      },
      response: {
        '/login': {
          token: { required: true, type: 'string' },
          user: { required: true, type: 'object' }
        }
      }
    });

    // Document service validation
    this.schemas.set('documents', {
      request: {
        'POST /documents': {
          title: { required: true, type: 'string', minLength: 1, maxLength: 255 },
          content: { required: true, type: 'string' },
          category: { type: 'string' },
          tags: { type: 'array' }
        }
      }
    });

    // AI service validation
    this.schemas.set('ai', {
      request: {
        '/commands/execute': {
          command: { required: true, type: 'string', minLength: 1 },
          parameters: { type: 'object' }
        }
      }
    });
  }

  async validateRequest(ctx: Context, service: string, path: string): Promise<void> {
    const schema = this.schemas.get(service);
    if (!schema || !schema.request) {
      return; // No validation schema defined
    }

    const method = ctx.request.method;
    const validationKey = `${method} ${path}`;
    const rules = this.findValidationRules(schema.request, validationKey, path);

    if (!rules) {
      return; // No specific validation rules
    }

    // Validate request body
    if (ctx.request.hasBody) {
      const body = await ctx.request.body({ type: 'json' }).value;
      this.validateObject(body, rules, 'request body');
    }

    // Validate query parameters
    const url = new URL(ctx.request.url);
    const queryParams: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });

    if (Object.keys(queryParams).length > 0) {
      this.validateObject(queryParams, rules, 'query parameters');
    }

    // Validate headers
    if (schema.headers) {
      const headers: Record<string, string> = {};
      ctx.request.headers.forEach((value, key) => {
        headers[key] = value;
      });
      this.validateObject(headers, schema.headers, 'headers');
    }
  }

  async validateResponse(ctx: Context, service: string, path: string): Promise<void> {
    const schema = this.schemas.get(service);
    if (!schema || !schema.response) {
      return; // No validation schema defined
    }

    const rules = this.findValidationRules(schema.response, path, path);
    if (!rules || !ctx.response.body) {
      return; // No specific validation rules or no response body
    }

    // Note: Response validation is limited since we can't easily parse the response body
    // In a real implementation, you might want to use response interceptors
    logger.debug('Response validation skipped', { service, path });
  }

  private findValidationRules(schema: ValidationSchema, key: string, path: string): ValidationSchema | null {
    // Try exact match first
    if (schema[key]) {
      return schema[key] as ValidationSchema;
    }

    // Try path-based matching
    for (const [pattern, rules] of Object.entries(schema)) {
      if (this.matchesPath(pattern, path)) {
        return rules as ValidationSchema;
      }
    }

    return null;
  }

  private matchesPath(pattern: string, path: string): boolean {
    // Simple pattern matching - can be enhanced with more sophisticated patterns
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(path);
    }

    return pattern === path;
  }

  private validateObject(obj: any, rules: ValidationSchema, context: string): void {
    for (const [field, rule] of Object.entries(rules)) {
      const value = obj[field];
      const validationRule = rule as ValidationRule;

      // Check required fields
      if (validationRule.required && (value === undefined || value === null)) {
        throw new ValidationError(`Required field '${field}' is missing in ${context}`);
      }

      // Skip validation if field is not present and not required
      if (value === undefined || value === null) {
        continue;
      }

      // Type validation
      if (validationRule.type && !this.validateType(value, validationRule.type)) {
        throw new ValidationError(`Field '${field}' must be of type ${validationRule.type} in ${context}`);
      }

      // String validations
      if (typeof value === 'string') {
        if (validationRule.minLength && value.length < validationRule.minLength) {
          throw new ValidationError(`Field '${field}' must be at least ${validationRule.minLength} characters long in ${context}`);
        }

        if (validationRule.maxLength && value.length > validationRule.maxLength) {
          throw new ValidationError(`Field '${field}' must be at most ${validationRule.maxLength} characters long in ${context}`);
        }

        if (validationRule.pattern && !validationRule.pattern.test(value)) {
          throw new ValidationError(`Field '${field}' does not match required pattern in ${context}`);
        }
      }

      // Enum validation
      if (validationRule.enum && !validationRule.enum.includes(value)) {
        throw new ValidationError(`Field '${field}' must be one of: ${validationRule.enum.join(', ')} in ${context}`);
      }

      // Custom validation
      if (validationRule.custom && !validationRule.custom(value)) {
        throw new ValidationError(`Field '${field}' failed custom validation in ${context}`);
      }
    }
  }

  private validateType(value: any, type: string): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      default:
        return true;
    }
  }

  // Admin methods
  addSchema(service: string, schema: ServiceValidationConfig): void {
    this.schemas.set(service, schema);
    logger.info('Validation schema added', { service });
  }

  removeSchema(service: string): void {
    this.schemas.delete(service);
    logger.info('Validation schema removed', { service });
  }

  getSchema(service: string): ServiceValidationConfig | null {
    return this.schemas.get(service) || null;
  }

  getAllSchemas(): Record<string, ServiceValidationConfig> {
    return Object.fromEntries(this.schemas);
  }
}

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
