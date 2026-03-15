type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function getMinLevel(): LogLevel {
  const envLevel = process.env.LOG_LEVEL as LogLevel | undefined;
  if (envLevel && envLevel in LOG_LEVELS) return envLevel;
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[getMinLevel()];
}

function createLogger(tag: string) {
  return {
    debug: (...args: unknown[]) => {
      if (shouldLog('debug')) console.debug(`[${tag}]`, ...args);
    },
    info: (...args: unknown[]) => {
      if (shouldLog('info')) console.log(`[${tag}]`, ...args);
    },
    warn: (...args: unknown[]) => {
      if (shouldLog('warn')) console.warn(`[${tag}]`, ...args);
    },
    error: (...args: unknown[]) => {
      if (shouldLog('error')) console.error(`[${tag}]`, ...args);
    },
  };
}

export { createLogger };
export type { LogLevel };
