/**
 * Main entry point for the Node.js Hello World application.
 * 
 * This module initializes and starts the HTTP server, sets up signal handlers
 * for graceful shutdown, and exports the application for potential testing
 * or programmatic usage.
 */

// Import required modules
const { createServer, startServer, setupGracefulShutdown } = require('./server');
const logger = require('./utils/logger');

/**
 * Initializes the application by creating and starting the HTTP server
 * @returns {Promise<http.Server>} Promise that resolves with the server instance when started
 */
async function initializeApp() {
  try {
    // Create an HTTP server instance
    const server = createServer();
    
    // Start the server (this will listen on the configured port)
    await startServer(server);
    
    // Set up handlers for graceful shutdown
    setupGracefulShutdown(server);
    
    // Log successful initialization
    logger.info('Application initialized successfully');
    
    // Return the server instance for potential programmatic usage
    return server;
  } catch (err) {
    // Log any errors during initialization
    logger.error('Failed to initialize application:');
    logger.error(err);
    throw err; // Re-throw the error for the caller to handle
  }
}

/**
 * Main function that runs when the file is executed directly (not imported)
 * @returns {Promise<void>} Promise that resolves when the application is initialized
 */
async function main() {
  try {
    await initializeApp();
  } catch (err) {
    // Exit the process with a non-zero code if initialization fails
    process.exit(1);
  }
}

// Run the main function only when this file is executed directly
if (require.main === module) {
  main();
}

// Export the application initialization function for programmatic usage or testing
module.exports = initializeApp;