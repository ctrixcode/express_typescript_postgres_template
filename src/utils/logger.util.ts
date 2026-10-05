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

// Formatter to redact sensitive fields (passwords, tokens, secrets) in logs safely
const maskSensitiveData = winston.format(info => {
  const sensitiveKeys = [
    'password',
    'token',
    'secret',
    'authorization',
    'cookie',
  ];

  const seen = new WeakSet();

  const mask = (obj: unknown): unknown => {
    if (!obj || typeof obj !== 'object') return obj;
    if (seen.has(obj)) return '[CIRCULAR]';
    seen.add(obj);

    if (Array.isArray(obj)) {
      return obj.map(item => mask(item));
    }

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
