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

// Formatter to redact sensitive fields (passwords, tokens, secrets) in logs while preserving Winston symbols
const maskSensitiveData = winston.format(info => {
  const sensitiveKeys = [
    'password',
    'token',
    'secret',
    'authorization',
    'cookie',
  ];

  const maskObject = (obj: unknown): unknown => {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(maskObject);

    const target = obj as Record<string, unknown>;
    for (const key of Object.keys(target)) {
      if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
        target[key] = '[REDACTED]';
      } else if (typeof target[key] === 'object' && target[key] !== null) {
        maskObject(target[key]);
      }
    }
    return target;
  };

  maskObject(info);
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
      winston.format.printf(
        info => `${info.timestamp} ${info.level}: ${info.message}`
      )
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
