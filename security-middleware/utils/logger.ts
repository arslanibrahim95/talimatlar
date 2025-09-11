/**
 * Logger utility for Security Middleware
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

  constructor(service: string = 'security-middleware', level: LogLevel = LogLevel.INFO) {
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

  security(event: string, details: any): void {
    this.warn(`Security event: ${event}`, details);
  }

  threat(event: string, details: any): void {
    this.error(`Threat detected: ${event}`, details);
  }
}

export const logger = new Logger();
