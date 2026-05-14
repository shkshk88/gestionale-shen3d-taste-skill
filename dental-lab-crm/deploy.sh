#!/bin/bash

# 🚀 Shen3D Dental Lab CRM - Deploy Script
# Usage: ./deploy.sh [environment]
# Environments: local-prod, staging, production

set -e

ENV=${1:-local-prod}
echo "🚀 Deploying for environment: $ENV"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js not found. Please install Node.js 20+"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    print_error "Node.js version 20+ required. Found: $(node -v)"
    exit 1
fi

print_status "Node.js version: $(node -v)"

# Deploy Backend
deploy_backend() {
    echo ""
    echo "📦 Deploying Backend..."
    cd backend

    # Install dependencies
    print_status "Installing backend dependencies..."
    npm install

    # Generate Prisma client
    print_status "Generating Prisma client..."
    npx prisma generate

    # Run migrations (skip in local-prod if using SQLite)
    if [ "$ENV" != "local-prod" ]; then
        print_status "Running database migrations..."
        npx prisma migrate deploy
    fi

    # Build
    print_status "Building backend..."
    npm run build

    # Start based on environment
    if [ "$ENV" == "local-prod" ]; then
        print_status "Starting backend in production mode (local)..."
        print_warning "Press Ctrl+C to stop"
        npm run start:prod
    else
        print_status "Backend built successfully!"
        print_warning "Use PM2 or your hosting provider to start the backend"
    fi

    cd ..
}

# Deploy Frontend
deploy_frontend() {
    echo ""
    echo "🎨 Deploying Frontend..."
    cd frontend

    # Install dependencies
    print_status "Installing frontend dependencies..."
    npm install

    # Build
    print_status "Building frontend for production..."
    npm run build

    print_status "Frontend built successfully!"
    print_status "Build output in: frontend/dist/"

    if [ "$ENV" == "local-prod" ]; then
        print_status "Starting preview server..."
        print_warning "Press Ctrl+C to stop"
        npm run preview
    fi

    cd ..
}

# Setup Environment
setup_env() {
    echo ""
    echo "🔧 Setting up environment..."

    if [ "$ENV" == "local-prod" ]; then
        # Backend
        if [ ! -f "backend/.env" ]; then
            print_warning "Creating backend .env from .env.production"
            cp backend/.env.production backend/.env
            print_error "Please edit backend/.env with your credentials before running again!"
            exit 1
        fi

        # Frontend
        if [ ! -f "frontend/.env" ]; then
            print_warning "Creating frontend .env from .env.production"
            cp frontend/.env.production frontend/.env
            print_error "Please edit frontend/.env with your API URL before running again!"
            exit 1
        fi
    fi
}

# Main deploy process
main() {
    echo "========================================"
    echo "  🦷 Shen3D Dental Lab CRM Deploy"
    echo "========================================"
    echo ""

    setup_env

    # Ask which parts to deploy
    echo "What do you want to deploy?"
    echo "1) Backend only"
    echo "2) Frontend only"
    echo "3) Both (Full deploy)"
    read -p "Choice (1-3): " choice

    case $choice in
        1)
            deploy_backend
            ;;
        2)
            deploy_frontend
            ;;
        3)
            deploy_backend
            deploy_frontend
            ;;
        *)
            print_error "Invalid choice"
            exit 1
            ;;
    esac

    echo ""
    echo "========================================"
    print_status "Deploy completed!"
    echo "========================================"

    if [ "$ENV" == "local-prod" ]; then
        echo ""
        echo "📱 Access your application:"
        echo "   Frontend: http://localhost:4173 (or check Vite output)"
        echo "   Backend:  http://localhost:3000"
        echo ""
        echo "🔐 Test login with Google OAuth"
    fi
}

# Run main function
main
