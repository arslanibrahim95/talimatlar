/**
 * Logger utility for OAuth2 Service
 * Provides structured logging with different levels
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  data?: any;
  service: string;
}

class Logger {
  private level: LogLevel;
  private service: string;

  constructor(service: string = 'oauth2-service', level: LogLevel = LogLevel.INFO) {
    this.service = service;
    this.level = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.level;
  }

  private formatLog(level: string, message: string, data?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      service: this.service
    };
  }

  private log(level: string, message: string, data?: any): void {
    const logEntry = this.formatLog(level, message, data);
    console.log(JSON.stringify(logEntry));
  }

  debug(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.log('DEBUG', message, data);
    }
  }

  info(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.log('INFO', message, data);
    }
  }

  warn(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.log('WARN', message, data);
    }
  }

  error(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.log('ERROR', message, data);
    }
  }

  auth(action: string, userId: string, success: boolean, data?: any): void {
    this.info(`Auth action: ${action}`, {
      userId,
      success,
      action,
      ...data
    });
  }

  oauth2(action: string, clientId: string, success: boolean, data?: any): void {
    this.info(`OAuth2 action: ${action}`, {
      clientId,
      success,
      action,
      ...data
    });
  }
}

export const logger = new Logger();
