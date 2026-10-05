import winston from 'winston';
import path from 'path';
import DailyRotateFile from 'winston-daily-rotate-file';
import { appConfig } from '@/config';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

/**
 * Winston Formatter: Redacts sensitive fields (passwords, JWTs, API tokens, cookies)
 * before logs are written to disk or terminal.
 *
 * Key Design Considerations:
 * 1. Circular Reference Guard (`WeakSet`):
 *    Complex objects (like Express `req` or nested database errors) frequently contain
 *    circular references (`a.b = a`). Without tracking visited objects, recursive traversal
 *    causes a fatal `RangeError: Maximum call stack size exceeded` and crashes the process.
 * 2. Immutability:
 *    Instead of mutating the caller's objects in-place (which would alter runtime variables),
 *    this creates a shallow clone (`target`) with redacted fields.
 */
const maskSensitiveData = winston.format(info => {
  const sensitiveKeys = [
    'password',
    'token',
    'secret',
    'authorization',
    'cookie',
  ];

  // Tracks already-visited objects to break circular dependency loops
  const seen = new WeakSet();

  const mask = (obj: unknown): unknown => {
    if (!obj || typeof obj !== 'object') return obj;

    // Detect and break circular references
    if (seen.has(obj)) return '[CIRCULAR]';
    seen.add(obj);

    if (Array.isArray(obj)) {
      return obj.map(item => mask(item));
    }

    // Build a clean, redacted clone rather than modifying the original in-memory object
    const target: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
        target[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        target[key] = mask(value);
      } else {
        target[key] = value;
      }
    }
    return target;
  };

  // Redact properties directly attached to the Winston info log record
  for (const key of Object.keys(info)) {
    if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
      info[key] = '[REDACTED]';
    } else if (typeof info[key] === 'object' && info[key] !== null) {
      info[key] = mask(info[key]);
    }
  }

  return info;
});

const getLogLevel = () => {
  const configuredLevel = appConfig.APP.LOG_LEVEL?.toLowerCase();
  if (configuredLevel && configuredLevel in levels) {
    return configuredLevel;
  }
  return appConfig.APP.NODE_ENV === 'development' ? 'debug' : 'http';
};

const transports = [
  new winston.transports.Console({
    format: winston.format.combine(
      maskSensitiveData(),
      winston.format.timestamp({ format: 'HH:mm:ss' }),
      winston.format.colorize({ all: true }),
      winston.format.printf(info => {
        const { timestamp, level, message, stack, ...rest } = info;
        const metaKeys = Object.keys(rest).filter(
          k => typeof k === 'string' && typeof rest[k] !== 'symbol'
        );
        const metaStr = metaKeys.length ? ` ${JSON.stringify(rest)}` : '';
        const stackStr = stack ? `\n${stack}` : '';
        return `${timestamp} ${level}: ${message}${metaStr}${stackStr}`;
      })
    ),
  }),

  // Error log file
  new DailyRotateFile({
    filename: path.join('logs', 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    level: 'error',
    format: winston.format.combine(
      maskSensitiveData(),
      winston.format.timestamp(),
      winston.format.json()
    ),
  }),

  // Combined log file
  new DailyRotateFile({
    filename: path.join('logs', 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    format: winston.format.combine(
      maskSensitiveData(),
      winston.format.timestamp(),
      winston.format.json()
    ),
  }),
];

export const logger = winston.createLogger({
  level: getLogLevel(),
  levels,
  transports,
});
