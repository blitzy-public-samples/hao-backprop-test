/**
 * Configuration module for the Node.js Hello World server application.
 * Manages server configuration settings, primarily the port number on which
 * the server listens. Reads configuration from environment variables with
 * validation and fallback to default values.
 */

// Import configuration constants and logger
const { CONFIG } = require('./utils/constants');
const logger = require('./utils/logger');

/**
 * Validates that a port value is a valid number within the acceptable range for TCP/IP ports.
 * @param {any} port - The port value to validate
 * @returns {number|null} The validated port number or null if invalid
 */
function validatePort(port) {
  // Convert port to a number if it's a string
  const portNumber = typeof port === 'string' ? parseInt(port, 10) : port;
  
  // Check if the result is NaN (not a number)
  if (isNaN(portNumber)) {
    logger.warn(`Invalid port value: ${port} is not a number`);
    return null;
  }
  
  // Check if the port is within the valid range (1024-65535)
  // Note: While ports 0-1023 are technically valid, they're reserved for privileged services
  if (portNumber < 1024 || portNumber > 65535) {
    logger.warn(`Invalid port range: ${portNumber} is outside the valid range (1024-65535)`);
    return null;
  }
  
  // Return the port as a number if valid
  return portNumber;
}

/**
 * Retrieves the server configuration, reading from environment variables with fallback to defaults.
 * @returns {object} Configuration object with port property
 */
function getConfig() {
  // Read PORT environment variable
  const envPort = process.env[CONFIG.ENV_VAR_PORT];
  
  // Validate the port using validatePort function
  const validatedPort = validatePort(envPort);
  
  // If port is valid, use it; otherwise use CONFIG.DEFAULT_PORT
  const port = validatedPort || CONFIG.DEFAULT_PORT;
  
  // Log the configuration being used
  logger.debug(`Using port: ${port}${validatedPort ? ' (from environment)' : ' (default)'}`);
  
  // Return an object with the port property
  return {
    port
  };
}

// Export the getConfig function as default export
module.exports = getConfig;

// Export the validatePort function as a named export
module.exports.validatePort = validatePort;