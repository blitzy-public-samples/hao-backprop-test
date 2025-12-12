/**
 * HTTP Server module for Node.js Hello World application
 * 
 * This module creates and manages an HTTP server that listens for incoming 
 * connections, routes requests to appropriate handlers, and implements
 * proper error handling and graceful shutdown.
 */

// Import Node.js core modules
const http = require('http'); // built-in

// Import application modules
const route = require('./router');
const getConfig = require('./config');
const { handleRequestError, handleServerError } = require('./errorHandler');
const logger = require('./utils/logger');
const { MESSAGES } = require('./utils/constants');

/**
 * Creates and configures an HTTP server instance
 * @returns {http.Server} Configured HTTP server instance
 */
function createServer() {
  // Create an HTTP server with the request handler
  const server = http.createServer(requestHandler);
  
  // Set up error event handler for server errors
  server.on('error', (error) => {
    handleServerError(error);
  });
  
  // Return the configured server
  return server;
}

/**
 * Handles incoming HTTP requests by routing them to appropriate handlers
 * and managing response lifecycle
 * @param {http.IncomingMessage} req - The HTTP request object
 * @param {http.ServerResponse} res - The HTTP response object
 */
function requestHandler(req, res) {
  // Add response end listener to log response information
  res.on('finish', () => {
    logger.response(res);
  });
  
  try {
    // Route the request using the router
    route(req, res);
  } catch (error) {
    // Handle any errors during request processing
    handleRequestError(error, res);
  }
}

/**
 * Starts the HTTP server on the configured port
 * @param {http.Server} server - The HTTP server instance to start
 * @returns {Promise<http.Server>} Promise that resolves with the server instance when started
 */
function startServer(server) {
  // Get configuration including port number
  const config = getConfig();
  
  return new Promise((resolve, reject) => {
    // Start the server on the configured port
    server.listen(config.port, () => {
      // Log server started message with port number
      logger.info(MESSAGES.SERVER_STARTED.replace('%d', config.port));
      
      // Resolve the promise with the server instance
      resolve(server);
    });
    
    // Handle any errors during server startup
    server.once('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Gracefully stops the HTTP server, closing all connections
 * @param {http.Server} server - The HTTP server instance to stop
 * @returns {Promise<void>} Promise that resolves when server is stopped
 */
function stopServer(server) {
  return new Promise((resolve, reject) => {
    // If server is not listening, resolve immediately
    if (!server.listening) {
      resolve();
      return;
    }
    
    // Close the server, which stops accepting new connections
    server.close((error) => {
      if (error) {
        // If an error occurs during closing, reject the promise
        reject(error);
        return;
      }
      
      // Log server stopped message
      logger.info('Server stopped');
      
      // Resolve the promise
      resolve();
    });
  });
}

/**
 * Sets up signal handlers for graceful server shutdown on SIGINT and SIGTERM
 * @param {http.Server} server - The HTTP server instance to shut down
 */
function setupGracefulShutdown(server) {
  // Handle SIGINT signal (Ctrl+C)
  process.on('SIGINT', async () => {
    logger.info('Received SIGINT signal. Shutting down gracefully...');
    try {
      await stopServer(server);
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:');
      logger.error(error);
      process.exit(1);
    }
  });
  
  // Handle SIGTERM signal (termination request)
  process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM signal. Shutting down gracefully...');
    try {
      await stopServer(server);
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:');
      logger.error(error);
      process.exit(1);
    }
  });
}

// Export the server functions
module.exports = {
  createServer,
  startServer,
  stopServer,
  setupGracefulShutdown,
};