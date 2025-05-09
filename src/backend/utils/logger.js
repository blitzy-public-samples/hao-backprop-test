/**
 * Logger utility for the Node.js Hello World server application.
 * Provides standardized logging functionality with different log levels 
 * and specialized logging for HTTP requests and responses.
 */

/**
 * Generates a formatted timestamp string for log messages
 * @returns {string} Formatted timestamp in ISO format
 */
function formatTimestamp() {
  return new Date(Date.now()).toISOString();
}

/**
 * Formats a log message with timestamp, level, and message content
 * @param {string} level - The log level (INFO, ERROR, etc.)
 * @param {string} message - The message to be logged
 * @returns {string} Formatted log message
 */
function formatLogMessage(level, message) {
  return `[${formatTimestamp()}] [${level}] ${message}`;
}

/**
 * Logs an informational message to the console
 * @param {string} message - The message to log
 */
function info(message) {
  console.log(formatLogMessage('INFO', message));
}

/**
 * Logs an error message or Error object to the console
 * @param {string|Error} error - The error message or Error object to log
 */
function error(error) {
  const errorMessage = error instanceof Error ? error.message : error;
  console.error(formatLogMessage('ERROR', errorMessage));
  
  // If an Error object with stack trace was provided, log the stack separately
  if (error instanceof Error && error.stack) {
    console.error(error.stack);
  }
}

/**
 * Logs a warning message to the console
 * @param {string} message - The warning message to log
 */
function warn(message) {
  console.warn(formatLogMessage('WARN', message));
}

/**
 * Logs a debug message to the console only in development environment
 * @param {string} message - The debug message to log
 */
function debug(message) {
  // Only log debug messages in development environment
  if (process.env.NODE_ENV === 'development') {
    console.debug(formatLogMessage('DEBUG', message));
  }
}

/**
 * Logs information about an incoming HTTP request
 * @param {object} req - The HTTP request object
 */
function request(req) {
  const { method, url } = req;
  info(`${method} ${url}`);
}

/**
 * Logs information about an outgoing HTTP response
 * @param {object} res - The HTTP response object
 */
function response(res) {
  const statusCode = res.statusCode;
  const contentLength = res.getHeader('Content-Length') || 0;
  info(`${statusCode} - ${contentLength} bytes`);
}

/**
 * Logger object that provides standardized logging functionality
 * throughout the application.
 */
const logger = {
  info,
  error,
  warn,
  debug,
  request,
  response
};

module.exports = logger;