#!/bin/bash
# ==============================================================================
# NestJS Hello World Application - Setup Script
# 
# This script automates the initial setup process for the NestJS Hello World application.
# It checks prerequisites, installs NestJS CLI, installs dependencies, compiles TypeScript,
# configures the environment, and ensures the system is ready to run the application.
#
# Key Features:
# - Node.js and npm prerequisite validation
# - Global NestJS CLI installation for build tooling
# - TypeScript compilation via 'nest build' command
# - Environment configuration from .env.example template
# - Setup verification including dist/ directory check
#
# NestJS Dependencies (from src/backend/package.json):
# - @nestjs/cli ^11.0.14 - NestJS command-line interface
# - typescript ^5.8.3 - TypeScript compiler
# ==============================================================================

set -e  # Exit immediately if a command exits with a non-zero status

# ==============================================================================
# Global Variables
# These variables define paths and defaults used throughout the setup process
# ==============================================================================
SCRIPT_DIR=$(dirname "$0")
PROJECT_ROOT=$(realpath "$SCRIPT_DIR/../..")

# Backend directory now points to src/backend where the NestJS application resides
# This is where package.json, tsconfig.json, and src/main.ts are located
BACKEND_DIR=$PROJECT_ROOT/src/backend

# Minimum Node.js version required for NestJS 11.x (per package.json engines)
MIN_NODE_VERSION="18.0.0"
DEFAULT_PORT="3000"
LOG_DIR=$PROJECT_ROOT/logs
ENV_FILE=$BACKEND_DIR/.env
ENV_EXAMPLE_FILE=$BACKEND_DIR/.env.example

# Command line parameters
PORT=$DEFAULT_PORT
NODE_ENV="development"
SKIP_DEPS=false

# ANSI color codes for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ==============================================================================
# Function: print_usage
# Description: Prints usage information for the script
# 
# This function displays comprehensive help documentation including:
# - Script name and purpose
# - Command line syntax
# - Available options with descriptions
# - Usage examples for common scenarios
# ==============================================================================
print_usage() {
    echo -e "${BLUE}NAME${NC}"
    echo "    setup.sh - NestJS Hello World Application Setup Script"
    echo
    echo -e "${BLUE}SYNOPSIS${NC}"
    echo "    ./setup.sh [OPTIONS]"
    echo
    echo -e "${BLUE}DESCRIPTION${NC}"
    echo "    This script automates the initial setup process for the NestJS Hello World application."
    echo "    It checks prerequisites, installs NestJS CLI globally, installs dependencies, compiles"
    echo "    TypeScript, and ensures the system is ready to run."
    echo
    echo "    The setup process includes:"
    echo "    - Validating Node.js and npm versions"
    echo "    - Installing @nestjs/cli globally for build tooling"
    echo "    - Running 'npm install' to install dependencies"
    echo "    - Running 'npm run build' to compile TypeScript"
    echo "    - Creating environment configuration from .env.example"
    echo
    echo -e "${BLUE}OPTIONS${NC}"
    echo "    -p PORT       Specify the port number for the server (default: 3000)"
    echo "    -e ENV        Specify the environment (development, production, test)"
    echo "                  (default: development)"
    echo "    -s            Skip dependency installation and TypeScript build"
    echo "    -h, --help    Display this help message and exit"
    echo
    echo -e "${BLUE}EXAMPLES${NC}"
    echo "    ./setup.sh                  # Full setup with defaults"
    echo "    ./setup.sh -p 8080          # Setup with custom port"
    echo "    ./setup.sh -e production    # Setup for production environment"
    echo "    ./setup.sh -s               # Skip npm install and build (env setup only)"
    echo
}

# ==============================================================================
# Function: parse_arguments
# Description: Parses command line arguments to configure the setup process
# Parameters:
#   $@ - Command line arguments
# ==============================================================================
parse_arguments() {
    while getopts ":p:e:sh-:" opt; do
        case ${opt} in
            p)
                PORT=$OPTARG
                if ! [[ $PORT =~ ^[0-9]+$ ]] || [ $PORT -lt 1024 ] || [ $PORT -gt 65535 ]; then
                    echo -e "${RED}Error: Port must be a number between 1024 and 65535${NC}"
                    exit 1
                fi
                ;;
            e)
                NODE_ENV=$OPTARG
                if [[ ! "$NODE_ENV" =~ ^(development|production|test)$ ]]; then
                    echo -e "${YELLOW}Warning: Unusual environment specified: $NODE_ENV${NC}"
                fi
                ;;
            s)
                SKIP_DEPS=true
                ;;
            h)
                print_usage
                exit 0
                ;;
            -)
                case "${OPTARG}" in
                    help)
                        print_usage
                        exit 0
                        ;;
                    *)
                        echo -e "${RED}Error: Invalid option: --${OPTARG}${NC}" >&2
                        print_usage
                        exit 1
                        ;;
                esac
                ;;
            \?)
                echo -e "${RED}Error: Invalid option: -$OPTARG${NC}" >&2
                print_usage
                exit 1
                ;;
            :)
                echo -e "${RED}Error: Option -$OPTARG requires an argument${NC}" >&2
                print_usage
                exit 1
                ;;
        esac
    done
}

# ==============================================================================
# Function: check_node_version
# Description: Checks if the installed Node.js version meets the minimum requirement
# Returns:
#   0 if Node.js version is adequate, 1 otherwise
# ==============================================================================
check_node_version() {
    echo -e "${BLUE}Checking Node.js version...${NC}"
    
    # Check if node is installed
    if ! command -v node &> /dev/null; then
        echo -e "${RED}Error: Node.js is not installed or not in the PATH${NC}"
        echo "Please install Node.js version $MIN_NODE_VERSION or higher"
        echo "Visit https://nodejs.org/ for installation instructions"
        return 1
    fi
    
    # Get current Node.js version
    CURRENT_VERSION=$(node --version | cut -d "v" -f 2)
    echo "Current Node.js version: $CURRENT_VERSION"
    
    # Compare versions
    if [ "$(printf '%s\n' "$MIN_NODE_VERSION" "$CURRENT_VERSION" | sort -V | head -n1)" != "$MIN_NODE_VERSION" ]; then
        echo -e "${GREEN}✓ Node.js version is adequate${NC}"
        return 0
    else
        echo -e "${RED}Error: Node.js version $CURRENT_VERSION is less than the required minimum version $MIN_NODE_VERSION${NC}"
        echo "Please upgrade Node.js to version $MIN_NODE_VERSION or higher"
        echo "Visit https://nodejs.org/ for upgrade instructions"
        return 1
    fi
}

# ==============================================================================
# Function: check_npm
# Description: Checks if npm is installed and accessible
# Returns:
#   0 if npm is available, 1 otherwise
# ==============================================================================
check_npm() {
    echo -e "${BLUE}Checking npm availability...${NC}"
    
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}Error: npm is not installed or not in the PATH${NC}"
        echo "npm should be installed with Node.js"
        echo "Check your Node.js installation or visit https://nodejs.org/"
        return 1
    fi
    
    NPM_VERSION=$(npm --version)
    echo "npm version: $NPM_VERSION"
    echo -e "${GREEN}✓ npm is available${NC}"
    return 0
}

# ==============================================================================
# Function: install_nestjs_cli
# Description: Installs NestJS CLI globally if not already installed
#
# The NestJS CLI (@nestjs/cli) is required for:
# - Running 'nest build' to compile TypeScript source code
# - Running 'nest start' for development server
# - Generating new NestJS resources (controllers, services, modules)
#
# The CLI version should match the project's devDependency (^11.0.14)
# as specified in src/backend/package.json
#
# Returns:
#   0 if installation was successful or already installed
#   (Note: Failure is non-blocking as npx can be used as fallback)
# ==============================================================================
install_nestjs_cli() {
    echo -e "${BLUE}Installing NestJS CLI globally...${NC}"
    
    # Check if NestJS CLI is already installed globally
    # The 'nest' command is provided by @nestjs/cli package
    if ! command -v nest &> /dev/null; then
        echo "NestJS CLI not found, installing @nestjs/cli globally..."
        
        # Install @nestjs/cli package globally
        # This provides the 'nest' command used by npm scripts in package.json
        if npm install -g @nestjs/cli; then
            echo -e "${GREEN}✓ NestJS CLI installed successfully${NC}"
        else
            # Non-fatal: The project can still use npx nest or local node_modules/.bin/nest
            echo -e "${YELLOW}Warning: Failed to install NestJS CLI globally${NC}"
            echo "You may need to run with sudo or use npx nest instead"
            echo "Alternatively, the local @nestjs/cli from node_modules will be used"
        fi
    else
        # Display the installed NestJS CLI version for verification
        # The --version flag outputs the CLI version (e.g., "11.0.14")
        NEST_VERSION=$(nest --version 2>/dev/null || echo "unknown")
        echo "NestJS CLI version: $NEST_VERSION"
        echo -e "${GREEN}✓ NestJS CLI already installed${NC}"
    fi
    
    # Always return success - global CLI installation is optional
    # The build process will fall back to local node_modules if needed
    return 0
}

# ==============================================================================
# Function: install_dependencies
# Description: Installs Node.js dependencies using npm
#
# This function runs 'npm install' in the backend directory to install all
# dependencies defined in package.json, including:
# - Production dependencies (@nestjs/common, @nestjs/core, etc.)
# - Development dependencies (typescript, jest, @nestjs/cli, etc.)
#
# Returns:
#   0 if installation was successful, 1 otherwise
# ==============================================================================
install_dependencies() {
    echo -e "${BLUE}Installing dependencies...${NC}"
    
    # Change to the backend directory where package.json is located
    cd "$BACKEND_DIR" || {
        echo -e "${RED}Error: Could not change to backend directory: $BACKEND_DIR${NC}"
        return 1
    }
    
    # Run npm install to download and install all dependencies
    # This installs both production and dev dependencies from package.json
    echo "Running npm install in $(pwd)"
    if npm install; then
        echo -e "${GREEN}✓ Dependencies installed successfully${NC}"
        return 0
    else
        echo -e "${RED}Error: Failed to install dependencies${NC}"
        echo "Try running 'npm install' manually in the $BACKEND_DIR directory"
        return 1
    fi
}

# ==============================================================================
# Function: build_typescript
# Description: Compiles TypeScript source code using npm run build
#
# This function executes the 'npm run build' command which internally runs
# 'nest build' (as defined in package.json scripts.build). The NestJS CLI
# compiles TypeScript files from src/ to JavaScript in the dist/ directory.
#
# Compilation process:
# 1. Reads tsconfig.build.json for compiler options
# 2. Transpiles all .ts files in src/ directory
# 3. Outputs compiled JavaScript to dist/ directory
# 4. Generates source maps for debugging
#
# The compiled output (dist/main.js) is the entry point for production.
#
# Returns:
#   0 if compilation was successful, 1 otherwise
# ==============================================================================
build_typescript() {
    echo -e "${BLUE}Building TypeScript...${NC}"
    
    # Change to the backend directory where tsconfig.json is located
    cd "$BACKEND_DIR" || {
        echo -e "${RED}Error: Could not change to backend directory: $BACKEND_DIR${NC}"
        return 1
    }
    
    # Verify tsconfig.json exists before attempting build
    # This file contains TypeScript compiler configuration for the NestJS project
    if [ ! -f "tsconfig.json" ]; then
        echo -e "${YELLOW}Warning: tsconfig.json not found in $BACKEND_DIR${NC}"
        echo "TypeScript configuration may be missing"
        echo "Expected file: $BACKEND_DIR/tsconfig.json"
    fi
    
    # Run the TypeScript build command
    # 'npm run build' executes 'nest build' which compiles src/ to dist/
    echo "Running npm run build in $(pwd)"
    if npm run build; then
        echo -e "${GREEN}✓ TypeScript compilation successful${NC}"
        
        # Verify the compiled output exists
        if [ -f "$BACKEND_DIR/dist/main.js" ]; then
            echo -e "${GREEN}✓ Compiled entry point exists: dist/main.js${NC}"
        fi
        
        return 0
    else
        echo -e "${RED}Error: TypeScript compilation failed${NC}"
        echo "Check for type errors in your TypeScript source files"
        echo "Run 'npm run build' manually in $BACKEND_DIR to see detailed errors"
        return 1
    fi
}

# ==============================================================================
# Function: setup_environment
# Description: Sets up environment configuration by creating .env file from template
#
# This function configures the application environment by:
# 1. Creating .env file from .env.example template (if available)
# 2. Setting PORT and NODE_ENV variables
# 3. Creating the logs directory for application logs
#
# Returns:
#   0 if setup was successful, 1 otherwise
# ==============================================================================
setup_environment() {
    echo -e "${BLUE}Setting up environment...${NC}"
    
    # Create .env file if it doesn't exist
    # Priority: existing .env > .env.example template > create new
    if [ -f "$ENV_FILE" ]; then
        echo "Environment file (.env) already exists"
    elif [ -f "$ENV_EXAMPLE_FILE" ]; then
        echo "Creating environment file from example template"
        cp "$ENV_EXAMPLE_FILE" "$ENV_FILE"
    else
        # Create a minimal environment file for NestJS
        echo "Creating new environment file"
        echo "# NestJS Hello World Application Environment Configuration" > "$ENV_FILE"
        echo "# Created by setup script on $(date)" >> "$ENV_FILE"
        echo "" >> "$ENV_FILE"
        echo "# Server configuration" >> "$ENV_FILE"
        echo "PORT=$PORT" >> "$ENV_FILE"
        echo "NODE_ENV=$NODE_ENV" >> "$ENV_FILE"
    fi
    
    # Update PORT in .env if specified
    if grep -q "PORT=" "$ENV_FILE"; then
        sed -i.bak "s/PORT=.*/PORT=$PORT/" "$ENV_FILE" && rm -f "$ENV_FILE.bak"
    else
        echo "PORT=$PORT" >> "$ENV_FILE"
    fi
    
    # Update NODE_ENV in .env if specified
    if grep -q "NODE_ENV=" "$ENV_FILE"; then
        sed -i.bak "s/NODE_ENV=.*/NODE_ENV=$NODE_ENV/" "$ENV_FILE" && rm -f "$ENV_FILE.bak"
    else
        echo "NODE_ENV=$NODE_ENV" >> "$ENV_FILE"
    fi
    
    # Create logs directory if it doesn't exist
    if [ ! -d "$LOG_DIR" ]; then
        echo "Creating logs directory: $LOG_DIR"
        mkdir -p "$LOG_DIR" || {
            echo -e "${RED}Error: Failed to create logs directory: $LOG_DIR${NC}"
            return 1
        }
    fi
    
    echo -e "${GREEN}✓ Environment setup completed${NC}"
    return 0
}

# ==============================================================================
# Function: check_port_availability
# Description: Checks if the specified port is available for use
# Parameters:
#   $1 - Port number to check
# Returns:
#   0 if port is available, 1 otherwise
# ==============================================================================
check_port_availability() {
    local port=$1
    
    echo -e "${BLUE}Checking if port $port is available...${NC}"
    
    # Use netstat if available
    if command -v netstat &> /dev/null; then
        if netstat -tuln | grep -q ":$port "; then
            echo -e "${YELLOW}Warning: Port $port appears to be in use${NC}"
            echo "You may need to choose a different port with the -p option"
            return 1
        fi
    # Otherwise try a simple connect test
    elif command -v nc &> /dev/null; then
        if nc -z localhost "$port" 2>/dev/null; then
            echo -e "${YELLOW}Warning: Port $port appears to be in use${NC}"
            echo "You may need to choose a different port with the -p option"
            return 1
        fi
    # Last resort - try to bind to the port directly
    else
        (
            exec 3<> /dev/tcp/localhost/$port
        ) 2>/dev/null
        
        if [ $? -eq 0 ]; then
            exec 3>&-
            echo -e "${YELLOW}Warning: Port $port appears to be in use${NC}"
            echo "You may need to choose a different port with the -p option"
            return 1
        fi
    fi
    
    echo -e "${GREEN}✓ Port $port is available${NC}"
    return 0
}

# ==============================================================================
# Function: verify_setup
# Description: Verifies that the setup was successful by checking key components
#
# This function validates the NestJS application setup by checking:
# 1. node_modules directory exists (npm install succeeded)
# 2. dist directory exists (TypeScript compilation succeeded)
# 3. NestJS entry point exists (src/main.ts source file present)
# 4. Environment configuration exists (.env file present)
# 5. Logs directory exists (for application logging)
#
# Returns:
#   0 if all critical checks pass, 1 otherwise
# ==============================================================================
verify_setup() {
    echo -e "${BLUE}Verifying setup...${NC}"
    local status=0
    
    # Check if node_modules directory exists
    # This indicates that npm install has been run successfully
    if [ -d "$BACKEND_DIR/node_modules" ]; then
        echo -e "${GREEN}✓ Dependencies are installed${NC}"
    else
        echo -e "${RED}× Dependencies are not installed${NC}"
        status=1
    fi
    
    # Check if TypeScript compiled output exists (dist directory)
    # The dist/ directory is created by 'npm run build' (nest build)
    if [ -d "$BACKEND_DIR/dist" ]; then
        echo -e "${GREEN}✓ TypeScript compilation output exists (dist/)${NC}"
        
        # Additionally verify the compiled entry point exists
        if [ -f "$BACKEND_DIR/dist/main.js" ]; then
            echo -e "${GREEN}✓ Compiled entry point exists (dist/main.js)${NC}"
        else
            echo -e "${YELLOW}⚠ Compiled entry point missing (dist/main.js)${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ TypeScript not yet compiled (run npm run build)${NC}"
        # Not a critical failure - development mode can compile on-the-fly
    fi
    
    # Check if NestJS source entry point exists (src/main.ts)
    # This file bootstraps the NestJS application
    if [ -f "$BACKEND_DIR/src/main.ts" ]; then
        echo -e "${GREEN}✓ NestJS entry point exists (src/main.ts)${NC}"
    else
        echo -e "${YELLOW}⚠ NestJS entry point missing (src/main.ts)${NC}"
        echo "The NestJS source structure may not be properly set up"
    fi
    
    # Check if .env file exists for environment configuration
    if [ -f "$ENV_FILE" ]; then
        echo -e "${GREEN}✓ Environment configuration exists${NC}"
    else
        echo -e "${RED}× Environment configuration is missing${NC}"
        status=1
    fi
    
    # Check if logs directory exists for application logging
    if [ -d "$LOG_DIR" ]; then
        echo -e "${GREEN}✓ Logs directory exists${NC}"
    else
        echo -e "${RED}× Logs directory is missing${NC}"
        status=1
    fi
    
    # Display final verification status
    if [ $status -eq 0 ]; then
        echo -e "${GREEN}Verification completed successfully!${NC}"
    else
        echo -e "${RED}Verification failed. Please check the errors above.${NC}"
    fi
    
    return $status
}

# ==============================================================================
# Function: main
# Description: Main function that orchestrates the setup process for NestJS
#
# This function executes the complete setup workflow:
# 1. Parse command line arguments
# 2. Display setup configuration
# 3. Validate Node.js and npm prerequisites
# 4. Install NestJS CLI globally (for nest build command)
# 5. Install npm dependencies from package.json
# 6. Compile TypeScript source code to JavaScript
# 7. Configure environment (.env file)
# 8. Verify setup completion
#
# Parameters:
#   $@ - Command line arguments
# Returns:
#   Exit code indicating success (0) or failure (1)
# ==============================================================================
main() {
    # Parse command line arguments for configuration options
    parse_arguments "$@"
    
    # Display setup banner with NestJS branding
    echo -e "${BLUE}==================================================${NC}"
    echo -e "${BLUE}NestJS Hello World Application - Setup${NC}"
    echo -e "${BLUE}==================================================${NC}"
    echo "Project root: $PROJECT_ROOT"
    echo "Backend directory: $BACKEND_DIR"
    echo "Port: $PORT"
    echo "Environment: $NODE_ENV"
    echo "Skip dependencies: $SKIP_DEPS"
    echo -e "${BLUE}==================================================${NC}"
    
    # Step 1: Check Node.js version (minimum 18.0.0 for NestJS 11)
    check_node_version || exit 1
    
    # Step 2: Check npm availability
    check_npm || exit 1
    
    # Step 3: Install NestJS CLI globally
    # This provides the 'nest' command needed for 'npm run build' (nest build)
    install_nestjs_cli
    
    # Step 4 & 5: Install dependencies and compile TypeScript if not skipped
    if [ "$SKIP_DEPS" = false ]; then
        # Install all npm dependencies from package.json
        install_dependencies || exit 1
        
        # Compile TypeScript to JavaScript (npm run build -> nest build)
        # This creates the dist/ directory with compiled JavaScript files
        build_typescript || exit 1
    else
        echo -e "${YELLOW}Skipping dependency installation and TypeScript build as requested${NC}"
    fi
    
    # Step 6: Setup environment configuration (.env file)
    setup_environment || exit 1
    
    # Step 7: Check port availability (informational, non-blocking)
    check_port_availability "$PORT"
    
    # Step 8: Verify all setup steps completed successfully
    verify_setup
    local setup_status=$?
    
    # Display final status and next steps
    if [ $setup_status -eq 0 ]; then
        echo
        echo -e "${GREEN}==================================================${NC}"
        echo -e "${GREEN}Setup completed successfully!${NC}"
        echo -e "${GREEN}==================================================${NC}"
        echo
        echo "Next steps:"
        echo "1. Navigate to the backend directory: cd $BACKEND_DIR"
        echo "2. Start the server:"
        echo "   - Development mode: npm run start:dev (auto-reloads on changes)"
        echo "   - Production mode:  npm run start:prod (uses compiled dist/)"
        echo "3. Access the service at: http://localhost:$PORT/hello"
        echo
        echo "Available npm scripts (in $BACKEND_DIR):"
        echo "  npm run start:dev   - Start with hot-reload for development"
        echo "  npm run start:prod  - Start production server"
        echo "  npm run build       - Compile TypeScript to JavaScript"
        echo "  npm run test        - Run unit tests"
        echo "  npm run test:e2e    - Run end-to-end tests"
        echo "  npm run lint        - Run ESLint code linting"
        echo
    else
        echo
        echo -e "${RED}==================================================${NC}"
        echo -e "${RED}Setup completed with errors!${NC}"
        echo -e "${RED}==================================================${NC}"
        echo
        echo "Please address the issues above and try again."
        echo "Common troubleshooting steps:"
        echo "  - Ensure Node.js version >= 18.0.0 is installed"
        echo "  - Run 'npm install' manually in $BACKEND_DIR"
        echo "  - Run 'npm run build' to compile TypeScript"
        echo "  - Check for TypeScript errors in the source files"
        echo
    fi
    
    return $setup_status
}

# ==============================================================================
# Script Entry Point
# Execute main function with all script arguments passed from command line
# ==============================================================================
main "$@"