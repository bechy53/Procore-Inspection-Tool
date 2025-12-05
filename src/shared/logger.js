/**
 * Logger utility for consistent logging across the extension
 * @module shared/logger
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

let currentLevel = LOG_LEVELS.INFO;

/**
 * Sets the logging level
 * @param {string} level - Log level (debug, info, warn, error)
 */
export function setLogLevel(level) {
  currentLevel = LOG_LEVELS[level.toUpperCase()] || LOG_LEVELS.INFO;
}

/**
 * Logs a debug message
 * @param {string} message - Message to log
 * @param {...any} args - Additional arguments
 */
export function debug(message, ...args) {
  if (currentLevel <= LOG_LEVELS.DEBUG) {
    console.log(`[DEBUG] ${message}`, ...args);
  }
}

/**
 * Logs an info message
 * @param {string} message - Message to log
 * @param {...any} args - Additional arguments
 */
export function info(message, ...args) {
  if (currentLevel <= LOG_LEVELS.INFO) {
    console.log(`[INFO] ${message}`, ...args);
  }
}

/**
 * Logs a warning message
 * @param {string} message - Message to log
 * @param {...any} args - Additional arguments
 */
export function warn(message, ...args) {
  if (currentLevel <= LOG_LEVELS.WARN) {
    console.warn(`[WARN] ${message}`, ...args);
  }
}

/**
 * Logs an error message
 * @param {string} message - Message to log
 * @param {...any} args - Additional arguments
 */
export function error(message, ...args) {
  if (currentLevel <= LOG_LEVELS.ERROR) {
    console.error(`[ERROR] ${message}`, ...args);
  }
}

/**
 * Sends an error to the background service worker for logging
 * @param {Error|string} errorObj - Error to log
 */
export function logErrorToBackground(errorObj) {
  const errorMessage = errorObj instanceof Error ? errorObj.message : String(errorObj);
  chrome.runtime.sendMessage({
    action: 'logError',
    error: errorMessage
  });
}
