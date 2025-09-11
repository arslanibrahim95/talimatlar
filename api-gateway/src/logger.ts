interface LogLevel {
  ERROR: 0;
  WARN: 1;
  INFO: 2;
  DEBUG: 3;
}

const LOG_LEVELS: LogLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const currentLogLevel = LOG_LEVELS[Deno.env.get('LOG_LEVEL') as keyof LogLevel] ?? LOG_LEVELS.INFO;

class Logger {
  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const logData = data ? ` ${JSON.stringify(data)}` : '';
    return `[${timestamp}] [${level}] ${message}${logData}`;
  }

  private log(level: string, levelNum: number, message: string, data?: any): void {
    if (levelNum <= currentLogLevel) {
      const formattedMessage = this.formatMessage(level, message, data);
      console.log(formattedMessage);
    }
  }

  error(message: string, data?: any): void {
    this.log('ERROR', LOG_LEVELS.ERROR, message, data);
  }

  warn(message: string, data?: any): void {
    this.log('WARN', LOG_LEVELS.WARN, message, data);
  }

  info(message: string, data?: any): void {
    this.log('INFO', LOG_LEVELS.INFO, message, data);
  }

  debug(message: string, data?: any): void {
    this.log('DEBUG', LOG_LEVELS.DEBUG, message, data);
  }
}

export const logger = new Logger();
