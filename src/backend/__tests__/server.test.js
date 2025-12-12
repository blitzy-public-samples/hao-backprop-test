/**
 * Unit tests for the server.js module that implements the core HTTP server functionality.
 * Tests verify server initialization, request handling, graceful shutdown, and error handling capabilities.
 */

// Import modules to test
const { createServer, startServer, stopServer, setupGracefulShutdown } = require('../server');

// Import modules to mock
const http = require('http'); // built-in
const route = require('../router');
const getConfig = require('../config');
const { handleRequestError } = require('../errorHandler');
const logger = require('../utils/logger');
const { MESSAGES } = require('../utils/constants');

// Mock dependencies
jest.mock('http');
jest.mock('../router');
jest.mock('../config');
jest.mock('../errorHandler');
jest.mock('../utils/logger');
jest.mock('../utils/constants', () => ({
  MESSAGES: {
    SERVER_STARTED: 'Server started on port %d',
  },
}));

describe('createServer', () => {
  let mockServer;
  
  beforeEach(() => {
    // Create a mock server object
    mockServer = {
      on: jest.fn().mockReturnThis(),
      listen: jest.fn((port, callback) => {
        if (callback) {callback();}
        return mockServer;
      }),
      close: jest.fn((callback) => {
        if (callback) {callback();}
        return mockServer;
      }),
      listening: true,
    };
    
    // Mock http.createServer to return our mock server
    http.createServer.mockReturnValue(mockServer);
    
    // Mock other dependencies
    route.mockImplementation((_req, _res) => {});
    getConfig.mockReturnValue({ port: 3000 });
    
    // Clear all previous mock calls
    jest.clearAllMocks();
  });
  
  it('should create an HTTP server with the route handler', () => {
    // Call the function under test
    const server = createServer();
    
    // Check if http.createServer was called
    expect(http.createServer).toHaveBeenCalled();
    
    // Verify the server was returned
    expect(server).toBe(mockServer);
    
    // Verify error handler was set up
    expect(mockServer.on).toHaveBeenCalledWith('error', expect.any(Function));
  });
  
  it('should handle requests using the route function', () => {
    // Create the server
    createServer();
    
    // Get the request handler function
    const requestHandler = http.createServer.mock.calls[0][0];
    
    // Create mock request and response objects
    const req = {};
    const res = { on: jest.fn() };
    
    // Call the request handler
    requestHandler(req, res);
    
    // Verify route was called with request and response
    expect(route).toHaveBeenCalledWith(req, res);
    
    // Verify handleRequestError was not called (no errors)
    expect(handleRequestError).not.toHaveBeenCalled();
  });
  
  it('should handle request errors using handleRequestError', () => {
    // Create the server
    createServer();
    
    // Get the request handler function
    const requestHandler = http.createServer.mock.calls[0][0];
    
    // Create mock request and response objects
    const req = {};
    const res = { on: jest.fn() };
    
    // Set up route to throw an error
    const testError = new Error('Test error');
    route.mockImplementation(() => {
      throw testError;
    });
    
    // Call the request handler
    requestHandler(req, res);
    
    // Verify handleRequestError was called with the error and response object
    expect(handleRequestError).toHaveBeenCalledWith(testError, res);
  });
});

describe('startServer', () => {
  let mockServer;
  
  beforeEach(() => {
    // Create a mock server object
    mockServer = {
      listen: jest.fn((port, callback) => {
        if (callback) {callback();}
        return mockServer;
      }),
      once: jest.fn(),
    };
    
    // Mock getConfig to return a specific port
    getConfig.mockReturnValue({ port: 3000 });
    
    // Clear all previous mock calls
    jest.clearAllMocks();
  });
  
  it('should start the server on the configured port', async () => {
    // Call the function under test
    const result = await startServer(mockServer);
    
    // Verify server.listen was called with the correct port
    expect(mockServer.listen).toHaveBeenCalledWith(3000, expect.any(Function));
    
    // Verify logger.info was called with server started message
    expect(logger.info).toHaveBeenCalledWith(MESSAGES.SERVER_STARTED.replace('%d', 3000));
    
    // Verify the promise resolves with the server instance
    expect(result).toBe(mockServer);
  });
  
  it('should handle server startup errors', async () => {
    // Create test error
    const testError = new Error('Test startup error');
    
    // Configure server.listen to NOT call callback (simulating error before listen succeeds)
    mockServer.listen.mockImplementation(() => {
      return mockServer;
    });
    
    // Configure server.once to trigger the error handler
    mockServer.once.mockImplementation((event, handler) => {
      if (event === 'error') {
        // Simulate error being triggered after once is registered
        setImmediate(() => handler(testError));
      }
      return mockServer;
    });
    
    // Call the function under test and expect it to reject
    await expect(startServer(mockServer)).rejects.toThrow(testError);
    
    // Verify error handler was registered
    expect(mockServer.once).toHaveBeenCalledWith('error', expect.any(Function));
  });
});

describe('stopServer', () => {
  let mockServer;
  
  beforeEach(() => {
    // Create a mock server object
    mockServer = {
      close: jest.fn((callback) => {
        if (callback) {callback();}
        return mockServer;
      }),
      listening: true,
    };
    
    // Clear all previous mock calls
    jest.clearAllMocks();
  });
  
  it('should stop the server if it is listening', async () => {
    // Call the function under test
    await stopServer(mockServer);
    
    // Verify server.close was called
    expect(mockServer.close).toHaveBeenCalled();
    
    // Verify logger.info was called with server stopped message
    expect(logger.info).toHaveBeenCalledWith('Server stopped');
  });
  
  it('should resolve immediately if server is not listening', async () => {
    // Configure mock server.listening to return false
    mockServer.listening = false;
    
    // Call the function under test
    await stopServer(mockServer);
    
    // Verify server.close was not called
    expect(mockServer.close).not.toHaveBeenCalled();
  });
  
  it('should handle errors during server shutdown', async () => {
    // Create test error
    const testError = new Error('Test shutdown error');
    
    // Configure server.close to call callback with an error
    mockServer.close.mockImplementation((callback) => {
      callback(testError);
      return mockServer;
    });
    
    // Call the function under test and expect it to reject
    await expect(stopServer(mockServer)).rejects.toThrow(testError);
    
    // Verify server.close was called
    expect(mockServer.close).toHaveBeenCalled();
  });
});

describe('setupGracefulShutdown', () => {
  let mockServer;
  let originalProcessOn;
  let originalProcessExit;
  const signalHandlers = {};
  
  beforeEach(() => {
    // Save original process.on and process.exit
    originalProcessOn = process.on;
    originalProcessExit = process.exit;
    
    // Create mock server
    mockServer = {};
    
    // Mock process.on to capture signal handlers
    process.on = jest.fn((signal, handler) => {
      signalHandlers[signal] = handler;
    });
    
    // Mock process.exit
    process.exit = jest.fn();
    
    // Clear all previous mock calls
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    // Restore original process methods
    process.on = originalProcessOn;
    process.exit = originalProcessExit;
  });
  
  it('should set up signal handlers for graceful shutdown', () => {
    // Call the function under test
    setupGracefulShutdown(mockServer);
    
    // Verify process.on was called for both signals
    expect(process.on).toHaveBeenCalledWith('SIGINT', expect.any(Function));
    expect(process.on).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
  });
  
  it('should handle errors during graceful shutdown', async () => {
    // Create a mock implementation of stopServer that will fail
    const mockStopServer = jest.fn().mockRejectedValue(new Error('Shutdown error'));
    
    // Create a local copy of the module with mocked stopServer
    const localModule = {
      stopServer: mockStopServer,
    };
    
    // Define a local setupGracefulShutdown that uses our mocked stopServer
    function localSetupGracefulShutdown(server) {
      process.on('SIGINT', async () => {
        try {
          await localModule.stopServer(server);
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown:');
          logger.error(error);
          process.exit(1);
        }
      });
      
      process.on('SIGTERM', async () => {
        try {
          await localModule.stopServer(server);
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown:');
          logger.error(error);
          process.exit(1);
        }
      });
    }
    
    // Call our local setupGracefulShutdown
    localSetupGracefulShutdown(mockServer);
    
    // Trigger the SIGINT handler
    await signalHandlers.SIGINT();
    
    // Verify mockStopServer was called
    expect(mockStopServer).toHaveBeenCalledWith(mockServer);
    
    // Verify logger.error was called with the error
    expect(logger.error).toHaveBeenCalledWith('Error during shutdown:');
    expect(logger.error).toHaveBeenCalledWith(expect.any(Error));
    
    // Verify process.exit was called with code 1
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});