import { config } from '../config.ts';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

const logLevelMap: Record<string, LogLevel> = {
  DEBUG: LogLevel.DEBUG,
  INFO: LogLevel.INFO,
  WARN: LogLevel.WARN,
  ERROR: LogLevel.ERROR,
};

const currentLogLevel = logLevelMap[config.logLevel] || LogLevel.INFO;

function formatMessage(level: string, message: string, data?: unknown): string {
  const timestamp = new Date().toISOString();
  const baseMessage = `[${timestamp}] [${level}] ${message}`;
  
  if (data) {
    return `${baseMessage} ${JSON.stringify(data)}`;
  }
  
  return baseMessage;
}

function shouldLog(level: LogLevel): boolean {
  return level >= currentLogLevel;
}

export const logger = {
  debug: (message: string, data?: unknown) => {
    if (shouldLog(LogLevel.DEBUG)) {
      console.log(formatMessage('DEBUG', message, data));
    }
  },

  info: (message: string, data?: unknown) => {
    if (shouldLog(LogLevel.INFO)) {
      console.log(formatMessage('INFO', message, data));
    }
  },

  warn: (message: string, data?: unknown) => {
    if (shouldLog(LogLevel.WARN)) {
      console.warn(formatMessage('WARN', message, data));
    }
  },

  error: (message: string, error?: unknown) => {
    if (shouldLog(LogLevel.ERROR)) {
      console.error(formatMessage('ERROR', message, error));
    }
  },

  // Specialized logging methods
  request: (method: string, url: string, status: number, duration: number) => {
    logger.info('HTTP Request', { method, url, status, duration });
  },

  auth: (action: string, userId?: string, success: boolean = true) => {
    logger.info('Authentication', { action, userId, success });
  },

  database: (operation: string, table: string, duration: number) => {
    logger.debug('Database Operation', { operation, table, duration });
  },
};
