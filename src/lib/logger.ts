type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

interface LogData {
  [key: string]: string | number | boolean | null | undefined | LogData | LogData[];
}

class Logger {
  private isDebugEnabled: boolean;

  constructor() {
    this.isDebugEnabled = process.env.DEBUG === 'true';
  }

  private formatMessage(level: LogLevel, message: string, data?: LogData): string {
    const timestamp = new Date().toISOString();
    const dataString = data ? ` | ${JSON.stringify(data)}` : '';
    return `[${timestamp}] [${level}] ${message}${dataString}`;
  }

  private log(level: LogLevel, message: string, data?: LogData): void {
    if (level === 'DEBUG' && !this.isDebugEnabled) {
      return;
    }

    const formattedMessage = this.formatMessage(level, message, data);
    
    switch (level) {
      case 'DEBUG':
        console.debug(formattedMessage);
        break;
      case 'INFO':
        console.info(formattedMessage);
        break;
      case 'WARN':
        console.warn(formattedMessage);
        break;
      case 'ERROR':
        console.error(formattedMessage);
        break;
    }
  }

  debug(message: string, data?: LogData): void {
    this.log('DEBUG', message, data);
  }

  info(message: string, data?: LogData): void {
    this.log('INFO', message, data);
  }

  warn(message: string, data?: LogData): void {
    this.log('WARN', message, data);
  }

  error(message: string, data?: LogData): void {
    this.log('ERROR', message, data);
  }

  // Specialized logging methods for different areas
  api(message: string, data?: LogData): void {
    this.info(`API - ${message}`, data);
  }

  component(message: string, data?: LogData): void {
    this.debug(`Component - ${message}`, data);
  }

  context(message: string, data?: LogData): void {
    this.debug(`Context - ${message}`, data);
  }

  db(message: string, data?: LogData): void {
    this.info(`DB - ${message}`, data);
  }

  auth(message: string, data?: LogData): void {
    this.info(`Auth - ${message}`, data);
  }

  game(message: string, data?: LogData): void {
    this.info(`Game - ${message}`, data);
  }
}

const logger = new Logger();
export default logger; 