#!/bin/bash
#
# health-check.sh
# A shell script that checks the health status of the Node.js Hello World application
# by verifying the server is running and responding correctly to the /health endpoint.
#

# Global variables
SCRIPT_DIR=$(dirname "$0")
PROJECT_ROOT=$(realpath "$SCRIPT_DIR/../..")
BACKEND_DIR=$PROJECT_ROOT/src/backend
DEFAULT_PORT=3000
DEFAULT_HOST="localhost"
DEFAULT_ENDPOINT="/health"
DEFAULT_EXPECTED_RESPONSE=""
DEFAULT_TIMEOUT=5
PID_FILE=$PROJECT_ROOT/logs/server.pid

# Configuration variables (can be overridden by command line arguments)
HOST=$DEFAULT_HOST
PORT=$DEFAULT_PORT
ENDPOINT=$DEFAULT_ENDPOINT
EXPECTED_RESPONSE=$DEFAULT_EXPECTED_RESPONSE
TIMEOUT=$DEFAULT_TIMEOUT
VERBOSE=false

# Function to print usage information
print_usage() {
    echo "Usage: $(basename $0) [OPTIONS]"
    echo
    echo "A health check script for the Node.js Hello World application."
    echo "This script verifies that the server is running and responding correctly."
    echo
    echo "Options:"
    echo "  -h, --host HOST        Host address (default: $DEFAULT_HOST)"
    echo "  -p, --port PORT        Port number (default: $DEFAULT_PORT)"
    echo "  -e, --endpoint PATH    Endpoint path to check (default: $DEFAULT_ENDPOINT)"
    echo "  -t, --timeout SEC      Request timeout in seconds (default: $DEFAULT_TIMEOUT)"
    echo "  -v, --verbose          Enable verbose output"
    echo "  --help                 Display this help message and exit"
    echo
    echo "Examples:"
    echo "  $(basename $0)"
    echo "  $(basename $0) -p 8080"
    echo "  $(basename $0) -h 127.0.0.1 -p 3000 -e /health"
    echo "  $(basename $0) -t 10 -v"
    echo
}

# Function to parse command line arguments
parse_arguments() {
    local args=("$@")
    
    while getopts ":h:p:e:t:v-:" opt "${args[@]}"; do
        case $opt in
            h)
                HOST="$OPTARG"
                ;;
            p)
                PORT="$OPTARG"
                if ! [[ "$PORT" =~ ^[0-9]+$ ]]; then
                    log_message "ERROR" "Port must be a number: $PORT"
                    exit 1
                fi
                ;;
            e)
                ENDPOINT="$OPTARG"
                ;;
            t)
                TIMEOUT="$OPTARG"
                if ! [[ "$TIMEOUT" =~ ^[0-9]+$ ]]; then
                    log_message "ERROR" "Timeout must be a number: $TIMEOUT"
                    exit 1
                fi
                ;;
            v)
                VERBOSE=true
                ;;
            -)
                case "${OPTARG}" in
                    help)
                        print_usage
                        exit 0
                        ;;
                    host=*)
                        HOST="${OPTARG#*=}"
                        ;;
                    port=*)
                        PORT="${OPTARG#*=}"
                        if ! [[ "$PORT" =~ ^[0-9]+$ ]]; then
                            log_message "ERROR" "Port must be a number: $PORT"
                            exit 1
                        fi
                        ;;
                    endpoint=*)
                        ENDPOINT="${OPTARG#*=}"
                        ;;
                    timeout=*)
                        TIMEOUT="${OPTARG#*=}"
                        if ! [[ "$TIMEOUT" =~ ^[0-9]+$ ]]; then
                            log_message "ERROR" "Timeout must be a number: $TIMEOUT"
                            exit 1
                        fi
                        ;;
                    verbose)
                        VERBOSE=true
                        ;;
                    *)
                        log_message "ERROR" "Unknown option: --${OPTARG}"
                        print_usage
                        exit 1
                        ;;
                esac
                ;;
            \?)
                log_message "ERROR" "Unknown option: -$OPTARG"
                print_usage
                exit 1
                ;;
            :)
                log_message "ERROR" "Option -$OPTARG requires an argument"
                print_usage
                exit 1
                ;;
        esac
    done
}

# Function to check if all required dependencies are installed
check_dependencies() {
    if ! command -v curl &> /dev/null; then
        log_message "ERROR" "curl is not installed. Please install curl and try again."
        return 1
    fi
    
    return 0
}

# Function to determine the port on which the server is running
get_server_port() {
    # If PORT is specified via command line, use that value
    if [[ "$PORT" != "$DEFAULT_PORT" ]]; then
        echo "$PORT"
        return
    fi
    
    # Check if .env file exists in the backend directory
    if [[ -f "$BACKEND_DIR/.env" ]]; then
        ENV_PORT=$(grep -E "^PORT=" "$BACKEND_DIR/.env" | cut -d= -f2)
        if [[ -n "$ENV_PORT" ]]; then
            [[ "$VERBOSE" == "true" ]] && log_message "INFO" "Found PORT=$ENV_PORT in .env file"
            echo "$ENV_PORT"
            return
        fi
    fi
    
    # Use default port if not found elsewhere
    [[ "$VERBOSE" == "true" ]] && log_message "INFO" "Using default port: $DEFAULT_PORT"
    echo "$DEFAULT_PORT"
}

# Function to check if the server process is running
check_process_running() {
    if [[ ! -f "$PID_FILE" ]]; then
        [[ "$VERBOSE" == "true" ]] && log_message "WARN" "PID file not found at $PID_FILE"
        return 1
    fi
    
    PID=$(cat "$PID_FILE")
    if [[ -z "$PID" ]]; then
        [[ "$VERBOSE" == "true" ]] && log_message "WARN" "PID file is empty"
        return 1
    fi
    
    if ! ps -p "$PID" > /dev/null; then
        [[ "$VERBOSE" == "true" ]] && log_message "WARN" "Process with PID $PID is not running"
        return 1
    fi
    
    [[ "$VERBOSE" == "true" ]] && log_message "INFO" "Server process is running with PID $PID"
    return 0
}

# Function to check if the server endpoint is responding correctly
check_endpoint_health() {
    local host="$1"
    local port="$2"
    local endpoint="$3"
    local expected_response="$4"
    local timeout="$5"
    
    # Construct the URL
    local url="http://${host}:${port}${endpoint}"
    
    [[ "$VERBOSE" == "true" ]] && log_message "INFO" "Checking endpoint health at $url (timeout: ${timeout}s)"
    
    # Use curl to make a request to the endpoint
    local http_code=$(curl -s -o /tmp/health_check_response -w "%{http_code}" --max-time "$timeout" "$url" 2>/dev/null)
    local curl_status=$?
    
    if [[ $curl_status -ne 0 ]]; then
        log_message "ERROR" "Failed to connect to $url (timeout or connection refused)"
        return 1
    fi
    
    [[ "$VERBOSE" == "true" ]] && log_message "INFO" "Received HTTP status code: $http_code"
    
    # Check if status code is 200
    if [[ "$http_code" != "200" ]]; then
        log_message "ERROR" "Unexpected HTTP status code: $http_code (expected: 200)"
        return 1
    fi
    
    # Get response body
    local body=$(cat /tmp/health_check_response)
    rm -f /tmp/health_check_response
    
    [[ "$VERBOSE" == "true" ]] && log_message "INFO" "Received response body: '$body'"
    
    # Check if response body matches expected response
    if [[ "$body" != "$expected_response" ]]; then
        log_message "ERROR" "Unexpected response: '$body' (expected: '$expected_response')"
        return 1
    fi
    
    return 0
}

# Function to log messages with timestamp and level
log_message() {
    local level="$1"
    local message="$2"
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    
    if [[ "$level" == "ERROR" ]]; then
        echo "[$timestamp] $level: $message" >&2
    else
        echo "[$timestamp] $level: $message"
    fi
}

# Main function
main() {
    local args=("$@")
    
    # Parse command line arguments
    parse_arguments "${args[@]}"
    
    # Check dependencies
    if ! check_dependencies; then
        exit 1
    fi
    
    # Get the port the server is running on
    PORT=$(get_server_port)
    [[ "$VERBOSE" == "true" ]] && log_message "INFO" "Using server port: $PORT"
    
    # Check if process is running
    if ! check_process_running; then
        log_message "WARN" "Server process may not be running"
        # Continue with endpoint check anyway
    fi
    
    # Check endpoint health
    if check_endpoint_health "$HOST" "$PORT" "$ENDPOINT" "$EXPECTED_RESPONSE" "$TIMEOUT"; then
        log_message "INFO" "Health check passed: Server is healthy"
        exit 0
    else
        log_message "ERROR" "Health check failed: Server is unhealthy"
        exit 1
    fi
}

# Run the main function
main "$@"