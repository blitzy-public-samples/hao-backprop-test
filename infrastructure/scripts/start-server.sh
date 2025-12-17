#!/bin/bash
#
# start-server.sh - A shell script to start the NestJS Hello World server
#
# This script provides a consistent way to launch the NestJS application across
# different environments with proper configuration, logging, and error handling.
# The script supports both development mode (with hot-reload via nest start --watch)
# and production mode (running the compiled JavaScript from dist/ directory).
#
# NestJS Framework Migration Notes:
# - Development mode uses 'npm run start:dev' which enables hot-reload
# - Production mode uses 'npm run start:prod' which runs compiled dist/main.js
# - TypeScript source must be compiled before running in production
#

# =============================================================================
# Global Variables
# =============================================================================
# These variables define paths and default values used throughout the script.
# They establish the project structure and default configuration settings.

# Directory containing this script (infrastructure/scripts/)
SCRIPT_DIR=$(dirname "$0")

# Project root directory (two levels up from script location)
PROJECT_ROOT=$(realpath "$SCRIPT_DIR/../..")

# NestJS backend application directory containing src/, dist/, and package.json
BACKEND_DIR=$PROJECT_ROOT/src/backend

# Default port for the NestJS HTTP server to listen on
DEFAULT_PORT=3000

# Default Node.js environment mode (development enables hot-reload)
DEFAULT_NODE_ENV=development

# Directory for server logs and PID file storage
LOG_DIR=$PROJECT_ROOT/logs

# File to store the server process ID when running in detached mode
PID_FILE=$LOG_DIR/server.pid

# Log file path for server output when running in detached mode
LOG_FILE=$LOG_DIR/server.log

# =============================================================================
# Runtime Configuration Settings
# =============================================================================
# These variables hold the active configuration, initialized from defaults
# and may be overridden by command line arguments.

# Active port setting (can be overridden with -p flag)
PORT=$DEFAULT_PORT

# Active environment mode (can be overridden with -e flag)
# Values: 'development' (hot-reload) or 'production' (compiled)
NODE_ENV=$DEFAULT_NODE_ENV

# Whether to run server in background (detached mode)
# Set to true with -d flag
DETACHED=false

# Whether to output verbose logging information
# Set to true with -v flag
VERBOSE=false

# Function to print usage information
# 
# Displays comprehensive help text explaining all available command-line options,
# their default values, and usage examples for the NestJS server startup script.
#
# @description Prints formatted usage information to stdout
# @returns void - Outputs help text directly to console
print_usage() {
    echo "Usage: $(basename "$0") [OPTIONS]"
    echo
    echo "Start the NestJS Hello World server with specified options."
    echo
    echo "Options:"
    echo "  -p PORT       Port to listen on (default: $DEFAULT_PORT)"
    echo "  -e ENV        Node.js environment (default: $DEFAULT_NODE_ENV)"
    echo "  -d            Run in detached mode (background)"
    echo "  -v            Enable verbose output"
    echo "  -h, --help    Show this help message and exit"
    echo
    echo "NestJS Start Commands:"
    echo "  Development:  Uses 'npm run start:dev' (hot-reload enabled)"
    echo "  Production:   Uses 'npm run start:prod' (runs compiled dist/main.js)"
    echo
    echo "Examples:"
    echo "  $(basename "$0")                  # Start in development mode with defaults"
    echo "  $(basename "$0") -p 8080          # Start on port 8080"
    echo "  $(basename "$0") -e production    # Start in production mode (requires build)"
    echo "  $(basename "$0") -d               # Start in background (detached)"
    echo "  $(basename "$0") -v               # Start with verbose logging"
    echo
    echo "Note: For production mode, ensure 'npm run build' has been executed first."
}

# Function to parse command line arguments
#
# Processes command-line options using getopts for short options
# and handles --help separately for long option support.
#
# Supported options:
#   -p PORT  : Set the port number for the server
#   -e ENV   : Set the NODE_ENV environment (development/production)
#   -d       : Enable detached (background) mode
#   -v       : Enable verbose logging output
#   -h       : Display help message
#   --help   : Display help message (long form)
#
# @description Parses and sets global variables based on CLI arguments
# @param $@ All command line arguments passed to the script
parse_arguments() {
    while getopts ":p:e:dvh" opt; do
        case ${opt} in
            p)
                PORT=$OPTARG
                ;;
            e)
                NODE_ENV=$OPTARG
                ;;
            d)
                DETACHED=true
                ;;
            v)
                VERBOSE=true
                ;;
            h)
                print_usage
                exit 0
                ;;
            \?)
                log_message "ERROR" "Invalid option: -$OPTARG"
                print_usage
                exit 1
                ;;
            :)
                log_message "ERROR" "Option -$OPTARG requires an argument."
                print_usage
                exit 1
                ;;
        esac
    done

    # Handle --help
    for arg in "$@"; do
        if [ "$arg" == "--help" ]; then
            print_usage
            exit 0
        fi
    done
}

# Function to log messages with timestamp
#
# Provides consistent logging format across the script with timestamps
# and severity levels. Messages are output to console and optionally
# to a log file if the log directory exists.
#
# @description Logs a formatted message with timestamp and severity level
# @param $1 level   - The log level (INFO, WARNING, ERROR)
# @param $2 message - The message to log
# @returns void - Outputs to stdout/stderr and optionally to log file
log_message() {
    local level=$1
    local message=$2
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    local formatted_message="[$timestamp] [$level] $message"
    
    if [ "$level" == "ERROR" ]; then
        echo "$formatted_message" >&2
    else
        echo "$formatted_message"
    fi
    
    # If log directory exists, also log to file
    if [ -d "$(dirname "$LOG_FILE")" ]; then
        echo "$formatted_message" >> "$LOG_FILE"
    fi
}

# Function to check if all dependencies are available
#
# Verifies that all required system dependencies are installed and
# accessible for running the NestJS application. This includes:
# - Node.js runtime
# - npm package manager
# - NestJS application source or compiled files
# - NestJS start scripts in package.json
#
# @description Validates all prerequisites for starting the NestJS server
# @returns 0 if all dependencies are available, 1 if any are missing
check_dependencies() {
    log_message "INFO" "Checking dependencies..."
    
    # Check for Node.js
    if ! command -v node &> /dev/null; then
        log_message "ERROR" "Node.js is not installed. Please install Node.js and try again."
        return 1
    fi
    
    # Check Node.js version
    local node_version=$(node -v | cut -d 'v' -f 2)
    log_message "INFO" "Found Node.js version $node_version"
    
    # Check for npm
    if ! command -v npm &> /dev/null; then
        log_message "ERROR" "npm is not installed. Please install npm and try again."
        return 1
    fi
    
    # Check if backend directory exists
    if [ ! -d "$BACKEND_DIR" ]; then
        log_message "ERROR" "Backend directory not found: $BACKEND_DIR"
        return 1
    fi
    
    # Check if NestJS entry point exists
    # In development: TypeScript source at src/main.ts
    # In production: Compiled JavaScript at dist/main.js
    # Either one must exist for the server to start successfully
    if [ ! -f "$BACKEND_DIR/dist/main.js" ] && [ ! -f "$BACKEND_DIR/src/main.ts" ]; then
        log_message "ERROR" "NestJS entry point not found. Ensure 'src/main.ts' exists or run 'npm run build' first."
        return 1
    fi
    
    # Verify package.json has NestJS start scripts
    if [ -f "$BACKEND_DIR/package.json" ]; then
        if ! grep -q '"start:dev"' "$BACKEND_DIR/package.json" && ! grep -q '"start:prod"' "$BACKEND_DIR/package.json"; then
            log_message "WARNING" "NestJS start scripts not found in package.json. Server may fail to start."
        fi
    fi
    
    log_message "INFO" "All dependencies are available."
    return 0
}

# Function to set up the environment
#
# Prepares the runtime environment for the NestJS server by:
# - Creating the logs directory if it doesn't exist
# - Checking for .env file presence
# - Exporting PORT and NODE_ENV environment variables
#
# The NestJS application will use these environment variables:
# - PORT: The HTTP port to listen on (default: 3000)
# - NODE_ENV: The environment mode (development/production)
#
# @description Initializes the environment for NestJS application startup
# @returns 0 on success, 1 if environment setup fails
setup_environment() {
    log_message "INFO" "Setting up environment..."
    
    # Create logs directory if it doesn't exist
    if [ ! -d "$LOG_DIR" ]; then
        log_message "INFO" "Creating logs directory: $LOG_DIR"
        mkdir -p "$LOG_DIR"
        if [ $? -ne 0 ]; then
            log_message "ERROR" "Failed to create logs directory: $LOG_DIR"
            return 1
        fi
    fi
    
    # Check if .env file exists in backend directory
    if [ -f "$BACKEND_DIR/.env" ]; then
        log_message "INFO" "Found .env file in backend directory."
    else
        log_message "INFO" "No .env file found. Using default environment variables."
    fi
    
    # Export environment variables
    export PORT=$PORT
    export NODE_ENV=$NODE_ENV
    
    log_message "INFO" "Environment set up successfully."
    return 0
}

# Function to check if port is available
#
# Attempts to verify if the specified port is free for the NestJS server
# to bind to. Uses multiple methods for cross-platform compatibility:
# - lsof (macOS/Linux)
# - netstat (older systems)
# - ss (modern Linux)
# - nc (netcat)
# - bash /dev/tcp (fallback)
#
# This check is non-blocking - if the port is in use, a warning is logged
# but the script continues. The NestJS application will fail with a clear
# error if the port is actually unavailable.
#
# @description Checks if the specified port is available for binding
# @param $1 port - The port number to check
# @returns 0 if port is available, 1 if port is in use
check_port_availability() {
    local port=$1
    local port_in_use=false
    
    # Try various methods to check port availability
    if command -v lsof &> /dev/null; then
        lsof -i :$port >/dev/null 2>&1 && port_in_use=true
    elif command -v netstat &> /dev/null; then
        netstat -tuln | grep -q ":$port " && port_in_use=true
    elif command -v ss &> /dev/null; then
        ss -tuln | grep -q ":$port " && port_in_use=true
    elif command -v nc &> /dev/null; then
        nc -z localhost $port >/dev/null 2>&1 && port_in_use=true
    else
        # If none of the above tools are available, try the bash /dev/tcp approach
        # This might not work on all systems
        { bash -c "echo > /dev/tcp/localhost/$port" >/dev/null 2>&1; } && port_in_use=true
    fi
    
    if $port_in_use; then
        log_message "WARNING" "Port $port is already in use. The server may fail to start."
        return 1
    else
        log_message "INFO" "Port $port is available."
        return 0
    fi
}

# Function to start the NestJS server
#
# This function handles starting the NestJS application using the appropriate
# npm script based on the NODE_ENV environment variable.
#
# NestJS Start Command Selection:
# - development: Uses 'npm run start:dev' which enables hot-reload via nest start --watch
#   This compiles TypeScript on-the-fly and watches for file changes
# - production: Uses 'npm run start:prod' which runs the pre-compiled dist/main.js
#   Requires running 'npm run build' beforehand to compile TypeScript
#
# @description Starts the NestJS server in the appropriate mode
# @returns 0 on success, 1 on failure
start_server() {
    log_message "INFO" "Starting NestJS server on port $PORT in $NODE_ENV mode..."
    
    # Change to backend directory where NestJS application resides
    cd "$BACKEND_DIR" || {
        log_message "ERROR" "Failed to change to backend directory: $BACKEND_DIR"
        return 1
    }
    
    # Determine the appropriate NestJS start command based on environment
    # - start:dev: Development mode with hot-reload (nest start --watch)
    # - start:prod: Production mode running compiled JavaScript (node dist/main)
    local start_cmd
    if [ "$NODE_ENV" = "production" ]; then
        # Production mode: Run the compiled JavaScript from dist/ directory
        # This requires 'npm run build' to have been executed first
        start_cmd="npm run start:prod"
        
        # Verify dist/main.js exists for production mode
        if [ ! -f "$BACKEND_DIR/dist/main.js" ]; then
            log_message "WARNING" "dist/main.js not found. Running 'npm run build' first..."
            npm run build
            if [ $? -ne 0 ]; then
                log_message "ERROR" "Failed to build NestJS application. Cannot start in production mode."
                return 1
            fi
        fi
    else
        # Development mode: Use hot-reload for rapid development iteration
        # TypeScript is compiled on-the-fly by the NestJS CLI
        start_cmd="npm run start:dev"
    fi
    
    if [ "$VERBOSE" = true ]; then
        log_message "INFO" "Using start command: $start_cmd"
    fi
    
    # Start the NestJS server
    if [ "$DETACHED" = true ]; then
        # Detached (background) mode: Server runs independently of terminal
        log_message "INFO" "Starting NestJS server in detached mode with output to $LOG_FILE"
        
        # Use nohup to prevent hangup signal from terminating the process
        # Redirect stdout and stderr to log file for debugging
        nohup $start_cmd > "$LOG_FILE" 2>&1 &
        local pid=$!
        
        # Allow brief startup time before checking process status
        sleep 2
        
        # Verify the server process started successfully
        if ps -p $pid > /dev/null; then
            # Store PID for later management (stop/restart operations)
            echo $pid > "$PID_FILE"
            log_message "INFO" "NestJS server started in background with PID: $pid"
        else
            log_message "ERROR" "Failed to start NestJS server in background. Check $LOG_FILE for details."
            return 1
        fi
    else
        # Foreground mode: Server output goes directly to terminal
        # Useful for development and debugging
        log_message "INFO" "Starting NestJS server in foreground mode"
        
        # Execute the NestJS start command
        $start_cmd
        
        # Check exit status of the server process
        if [ $? -ne 0 ]; then
            log_message "ERROR" "NestJS server exited with an error."
            return 1
        fi
    fi
    
    return 0
}

# Main function - Entry point for the NestJS server startup script
#
# Orchestrates the complete server startup sequence:
# 1. Parse command line arguments
# 2. Display welcome message and configuration
# 3. Verify all dependencies (Node.js, npm, NestJS files)
# 4. Set up the runtime environment (logs, env vars)
# 5. Check port availability (non-blocking)
# 6. Start the NestJS server in specified mode
#
# The script supports two primary modes of operation:
# - Foreground: Server runs in current terminal (default)
# - Detached: Server runs as background process (-d flag)
#
# @description Main orchestration function for NestJS server startup
# @param $@ All command line arguments
# @returns Exit code from server start (0 success, non-zero failure)
main() {
    # Parse command line arguments
    parse_arguments "$@"
    
    # Print welcome message identifying this as a NestJS application startup
    log_message "INFO" "==== NestJS Hello World Server Startup Script ===="
    log_message "INFO" "Project root: $PROJECT_ROOT"
    log_message "INFO" "Backend directory: $BACKEND_DIR"
    
    if [ "$VERBOSE" = true ]; then
        log_message "INFO" "Starting with options:"
        log_message "INFO" "  Port: $PORT"
        log_message "INFO" "  Environment: $NODE_ENV"
        log_message "INFO" "  Detached mode: $DETACHED"
        log_message "INFO" "  Verbose mode: $VERBOSE"
    fi
    
    # Check dependencies
    check_dependencies
    if [ $? -ne 0 ]; then
        log_message "ERROR" "Dependency check failed. Cannot start server."
        return 1
    fi
    
    # Set up environment
    setup_environment
    if [ $? -ne 0 ]; then
        log_message "ERROR" "Environment setup failed. Cannot start server."
        return 1
    fi
    
    # Check port availability (non-blocking warning)
    check_port_availability "$PORT"
    
    # Start the server
    start_server
    local start_result=$?
    
    if [ $start_result -eq 0 ]; then
        if [ "$DETACHED" = true ]; then
            log_message "INFO" "Server started successfully in background."
            log_message "INFO" "To access the Hello endpoint, visit: http://localhost:$PORT/hello"
            log_message "INFO" "To stop the server: kill $(cat "$PID_FILE")"
        else
            # This will only be reached if the server exits normally in foreground mode
            log_message "INFO" "Server has stopped."
        fi
    else
        log_message "ERROR" "Failed to start the server."
    fi
    
    return $start_result
}

# =============================================================================
# Script Execution Entry Point
# =============================================================================
# Execute main function with all script arguments passed to this script.
# The main function handles all orchestration and returns appropriate exit code.
# =============================================================================
main "$@"