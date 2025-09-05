#!/bin/bash

set -e

# SharePoint AI Dashboard Deployment Script
# This script handles deployment to different environments

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="staging"
SKIP_TESTS=false
SKIP_BUILD=false
FORCE_REBUILD=false
DRY_RUN=false

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "SharePoint AI Dashboard Deployment Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -e, --environment ENV    Deployment environment (development|staging|production) [default: staging]"
    echo "  -s, --skip-tests        Skip running tests before deployment"
    echo "  -b, --skip-build        Skip building the application"
    echo "  -f, --force-rebuild     Force rebuild of Docker images"
    echo "  -d, --dry-run           Show what would be deployed without actually deploying"
    echo "  -h, --help              Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -e production                    Deploy to production"
    echo "  $0 -e staging -s                    Deploy to staging without running tests"
    echo "  $0 -e development -f                Deploy to development with force rebuild"
    echo "  $0 -d                              Dry run for staging deployment"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -s|--skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        -b|--skip-build)
            SKIP_BUILD=true
            shift
            ;;
        -f|--force-rebuild)
            FORCE_REBUILD=true
            shift
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
    print_error "Invalid environment: $ENVIRONMENT"
    print_error "Valid environments: development, staging, production"
    exit 1
fi

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if Docker is installed and running
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker is not running"
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check if environment file exists
    ENV_FILE=".env.${ENVIRONMENT}"
    if [[ ! -f "$ENV_FILE" ]]; then
        print_error "Environment file $ENV_FILE not found"
        print_error "Please create $ENV_FILE based on .env.example"
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Run tests
run_tests() {
    if [[ "$SKIP_TESTS" == true ]]; then
        print_warning "Skipping tests as requested"
        return
    fi
    
    print_status "Running tests..."
    
    # Frontend tests
    print_status "Running frontend tests..."
    cd client
    npm ci
    npm run test:coverage
    cd ..
    
    # Backend tests
    print_status "Running backend tests..."
    cd server
    npm ci
    
    # Start test services
    docker-compose -f docker-compose.test.yml up -d postgres redis
    
    # Wait for services to be ready
    sleep 10
    
    # Run migrations and tests
    npm run migrate:test
    npm run test:coverage
    
    # Cleanup test services
    docker-compose -f docker-compose.test.yml down
    cd ..
    
    print_success "All tests passed"
}

# Build application
build_application() {
    if [[ "$SKIP_BUILD" == true ]]; then
        print_warning "Skipping build as requested"
        return
    fi
    
    print_status "Building application for $ENVIRONMENT..."
    
    # Set build args based on environment
    BUILD_ARGS=""
    case $ENVIRONMENT in
        "production")
            BUILD_ARGS="--build-arg NODE_ENV=production"
            ;;
        "staging")
            BUILD_ARGS="--build-arg NODE_ENV=staging"
            ;;
        "development")
            BUILD_ARGS="--build-arg NODE_ENV=development"
            ;;
    esac
    
    # Build with or without cache
    if [[ "$FORCE_REBUILD" == true ]]; then
        print_status "Force rebuilding Docker images..."
        docker-compose --env-file ".env.${ENVIRONMENT}" build --no-cache $BUILD_ARGS
    else
        docker-compose --env-file ".env.${ENVIRONMENT}" build $BUILD_ARGS
    fi
    
    print_success "Application built successfully"
}

# Deploy application
deploy_application() {
    print_status "Deploying to $ENVIRONMENT..."
    
    if [[ "$DRY_RUN" == true ]]; then
        print_warning "DRY RUN MODE - No actual deployment will occur"
        echo "Would deploy with:"
        echo "  Environment: $ENVIRONMENT"
        echo "  Env file: .env.${ENVIRONMENT}"
        echo "  Compose file: docker-compose.${ENVIRONMENT}.yml"
        return
    fi
    
    # Check if environment-specific compose file exists
    COMPOSE_FILE="docker-compose.${ENVIRONMENT}.yml"
    if [[ ! -f "$COMPOSE_FILE" ]]; then
        COMPOSE_FILE="docker-compose.yml"
        print_warning "Environment-specific compose file not found, using default"
    fi
    
    # Stop existing containers
    print_status "Stopping existing containers..."
    docker-compose --env-file ".env.${ENVIRONMENT}" -f "$COMPOSE_FILE" down
    
    # Start new containers
    print_status "Starting new containers..."
    docker-compose --env-file ".env.${ENVIRONMENT}" -f "$COMPOSE_FILE" up -d
    
    # Wait for services to be healthy
    print_status "Waiting for services to be healthy..."
    timeout=300  # 5 minutes
    elapsed=0
    interval=10
    
    while [[ $elapsed -lt $timeout ]]; do
        if docker-compose --env-file ".env.${ENVIRONMENT}" -f "$COMPOSE_FILE" ps | grep -q "unhealthy\|starting"; then
            print_status "Services still starting... ($elapsed/${timeout}s)"
            sleep $interval
            elapsed=$((elapsed + interval))
        else
            break
        fi
    done
    
    # Check final status
    unhealthy=$(docker-compose --env-file ".env.${ENVIRONMENT}" -f "$COMPOSE_FILE" ps | grep -c "unhealthy" || true)
    if [[ $unhealthy -gt 0 ]]; then
        print_error "Some services are unhealthy after deployment"
        docker-compose --env-file ".env.${ENVIRONMENT}" -f "$COMPOSE_FILE" ps
        exit 1
    fi
    
    print_success "Deployment completed successfully"
}

# Run smoke tests
run_smoke_tests() {
    print_status "Running smoke tests..."
    
    # Get service URLs from environment
    source ".env.${ENVIRONMENT}"
    
    BACKEND_URL="http://localhost:${BACKEND_PORT:-3001}"
    FRONTEND_URL="http://localhost:${FRONTEND_PORT:-80}"
    
    # Test backend health
    print_status "Testing backend health..."
    max_attempts=30
    attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f "$BACKEND_URL/health" &> /dev/null; then
            print_success "Backend health check passed"
            break
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            print_error "Backend health check failed after $max_attempts attempts"
            exit 1
        fi
        
        print_status "Backend not ready, attempt $attempt/$max_attempts..."
        sleep 10
        ((attempt++))
    done
    
    # Test frontend health
    print_status "Testing frontend health..."
    attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f "$FRONTEND_URL/health" &> /dev/null; then
            print_success "Frontend health check passed"
            break
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            print_error "Frontend health check failed after $max_attempts attempts"
            exit 1
        fi
        
        print_status "Frontend not ready, attempt $attempt/$max_attempts..."
        sleep 10
        ((attempt++))
    done
    
    # Test critical API endpoints
    if [[ "$ENVIRONMENT" != "development" ]]; then
        print_status "Testing critical API endpoints..."
        
        # Test auth status endpoint
        if ! curl -f "$BACKEND_URL/api/auth/status" &> /dev/null; then
            print_warning "Auth status endpoint not accessible (this may be expected)"
        fi
        
        # Test SharePoint health endpoint
        if ! curl -f "$BACKEND_URL/api/sharepoint/health" &> /dev/null; then
            print_warning "SharePoint health endpoint not accessible (this may be expected)"
        fi
    fi
    
    print_success "Smoke tests completed"
}

# Cleanup function
cleanup() {
    print_status "Performing cleanup..."
    
    # Remove dangling images
    docker image prune -f
    
    # Remove unused networks
    docker network prune -f
    
    print_success "Cleanup completed"
}

# Show deployment summary
show_summary() {
    print_success "Deployment Summary"
    echo "=================="
    echo "Environment: $ENVIRONMENT"
    echo "Timestamp: $(date)"
    
    # Show running containers
    echo ""
    echo "Running containers:"
    docker-compose --env-file ".env.${ENVIRONMENT}" ps
    
    # Show service URLs
    source ".env.${ENVIRONMENT}"
    echo ""
    echo "Service URLs:"
    echo "  Frontend: http://localhost:${FRONTEND_PORT:-80}"
    echo "  Backend: http://localhost:${BACKEND_PORT:-3001}"
    
    if [[ "${ENABLE_METRICS:-false}" == "true" ]]; then
        echo "  Prometheus: http://localhost:${PROMETHEUS_PORT:-9090}"
        echo "  Grafana: http://localhost:${GRAFANA_PORT:-3000}"
    fi
    
    echo "  Kibana: http://localhost:${KIBANA_PORT:-5601}"
    
    echo ""
    print_success "Deployment completed successfully! 🚀"
}

# Main execution
main() {
    print_status "Starting deployment to $ENVIRONMENT..."
    print_status "Timestamp: $(date)"
    
    check_prerequisites
    run_tests
    build_application
    deploy_application
    run_smoke_tests
    cleanup
    show_summary
}

# Handle interrupts
trap 'print_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main