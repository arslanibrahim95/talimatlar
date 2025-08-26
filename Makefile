# =============================================================================
# CLAUDE TALİMAT İŞ GÜVENLİĞİ YÖNETİM SİSTEMİ - MAKEFILE
# =============================================================================

.PHONY: help install dev build start stop restart clean test lint backup deploy

# Default target
help: ## Show this help message
	@echo "Claude Talimat İş Güvenliği Yönetim Sistemi"
	@echo "============================================="
	@echo ""
	@echo "Available commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Installation
install: ## Install all dependencies
	@echo "Installing dependencies..."
	npm install
	cd frontend && npm install
	cd services/auth-service && deno cache --reload deno.json
	cd services/document-service && pip install -r requirements.txt
	cd services/analytics-service && pip install -r requirements.txt
	cd services/notification-service && go mod download

# Development
dev: ## Start development environment
	@echo "Starting development environment..."
	docker-compose up -d
	cd frontend && npm run dev

dev:all: ## Start all services in development mode
	@echo "Starting all services in development mode..."
	npm run dev

# Building
build: ## Build all services
	@echo "Building all services..."
	npm run build

build:frontend: ## Build frontend only
	@echo "Building frontend..."
	cd frontend && npm run build

build:services: ## Build backend services only
	@echo "Building backend services..."
	docker-compose build

# Docker operations
start: ## Start all services
	@echo "Starting all services..."
	docker-compose up -d

start:prod: ## Start production services
	@echo "Starting production services..."
	docker-compose -f docker-compose.prod.yml up -d

stop: ## Stop all services
	@echo "Stopping all services..."
	docker-compose down

stop:prod: ## Stop production services
	@echo "Stopping production services..."
	docker-compose -f docker-compose.prod.yml down

restart: ## Restart all services
	@echo "Restarting all services..."
	$(MAKE) stop
	$(MAKE) start

restart:prod: ## Restart production services
	@echo "Restarting production services..."
	$(MAKE) stop:prod
	$(MAKE) start:prod

# Logs
logs: ## Show all service logs
	docker-compose logs -f

logs:prod: ## Show production service logs
	docker-compose -f docker-compose.prod.yml logs -f

logs:nginx: ## Show Nginx logs
	docker-compose logs -f nginx

logs:postgres: ## Show PostgreSQL logs
	docker-compose logs -f postgres

logs:redis: ## Show Redis logs
	docker-compose logs -f redis

logs:auth: ## Show Auth service logs
	docker-compose logs -f auth-service

logs:document: ## Show Document service logs
	docker-compose logs -f document-service

logs:analytics: ## Show Analytics service logs
	docker-compose logs -f analytics-service

logs:notification: ## Show Notification service logs
	docker-compose logs -f notification-service

# Testing
test: ## Run all tests
	@echo "Running all tests..."
	npm run test:all

test:frontend: ## Run frontend tests
	@echo "Running frontend tests..."
	cd frontend && npm run test

test:backend: ## Run backend tests
	@echo "Running backend tests..."
	npm run test:backend

test:auth: ## Run Auth service tests
	@echo "Running Auth service tests..."
	cd services/auth-service && deno test

test:document: ## Run Document service tests
	@echo "Running Document service tests..."
	cd services/document-service && python -m pytest

test:analytics: ## Run Analytics service tests
	@echo "Running Analytics service tests..."
	cd services/analytics-service && python -m pytest

test:notification: ## Run Notification service tests
	@echo "Running Notification service tests..."
	cd services/notification-service && go test ./...

# Linting
lint: ## Run all linters
	@echo "Running all linters..."
	npm run lint

lint:fix: ## Fix all linting issues
	@echo "Fixing linting issues..."
	npm run lint:fix

# Setup and deployment
setup: ## Run initial setup
	@echo "Running initial setup..."
	./infrastructure/scripts/setup.sh

deploy:rpi: ## Deploy to Raspberry Pi
	@echo "Deploying to Raspberry Pi..."
	./scripts/deploy-rpi.sh

# Backup and maintenance
backup: ## Create system backup
	@echo "Creating system backup..."
	docker-compose -f docker-compose.prod.yml --profile backup run --rm backup

# Cleaning
clean: ## Clean all build artifacts and containers
	@echo "Cleaning build artifacts and containers..."
	npm run clean
	docker system prune -f

clean:frontend: ## Clean frontend build artifacts
	@echo "Cleaning frontend build artifacts..."
	cd frontend && rm -rf node_modules dist .vite

clean:backend: ## Clean backend build artifacts
	@echo "Cleaning backend build artifacts..."
	cd services && find . -type d -name __pycache__ -exec rm -rf {} + && find . -type f -name '*.pyc' -delete

clean:docker: ## Clean Docker containers and images
	@echo "Cleaning Docker containers and images..."
	docker-compose down -v --remove-orphans
	docker system prune -f

# Health checks
health: ## Check system health
	@echo "Checking system health..."
	curl -f http://localhost/health || echo "Health check failed"

status: ## Show service status
	@echo "Service status:"
	docker-compose ps

status:prod: ## Show production service status
	@echo "Production service status:"
	docker-compose -f docker-compose.prod.yml ps

# Database operations
shell:postgres: ## Open PostgreSQL shell
	docker-compose exec postgres psql -U safety_admin -d safety_production

shell:redis: ## Open Redis shell
	docker-compose exec redis redis-cli

shell:minio: ## Open MinIO shell
	docker-compose exec minio mc

# Update dependencies
update: ## Update all dependencies
	@echo "Updating all dependencies..."
	npm run update

update:frontend: ## Update frontend dependencies
	@echo "Updating frontend dependencies..."
	cd frontend && npm update

update:backend: ## Update backend dependencies
	@echo "Updating backend dependencies..."
	npm run update:backend

# Development shortcuts
dev:auth: ## Start Auth service in development mode
	@echo "Starting Auth service in development mode..."
	cd services/auth-service && deno task dev

dev:document: ## Start Document service in development mode
	@echo "Starting Document service in development mode..."
	cd services/document-service && uvicorn main:app --reload --port 8002

dev:analytics: ## Start Analytics service in development mode
	@echo "Starting Analytics service in development mode..."
	cd services/analytics-service && uvicorn main:app --reload --port 8003

dev:notification: ## Start Notification service in development mode
	@echo "Starting Notification service in development mode..."
	cd services/notification-service && go run main.go

# Production shortcuts
prod:build: ## Build production images
	@echo "Building production images..."
	docker-compose -f docker-compose.prod.yml build

prod:logs: ## Show production logs
	docker-compose -f docker-compose.prod.yml logs -f

# Utility commands
version: ## Show system version
	@echo "Claude Talimat System v1.0.0"
	@echo "Node.js: $(shell node --version)"
	@echo "npm: $(shell npm --version)"
	@echo "Docker: $(shell docker --version)"
	@echo "Docker Compose: $(shell docker-compose --version)"

info: ## Show system information
	@echo "System Information:"
	@echo "==================="
	@echo "OS: $(shell uname -s)"
	@echo "Architecture: $(shell uname -m)"
	@echo "Kernel: $(shell uname -r)"
	@echo "Memory: $(shell free -h | grep Mem | awk '{print $2}')"
	@echo "Disk: $(shell df -h / | tail -1 | awk '{print $4}') available"
	@echo "Docker containers: $(shell docker ps -q | wc -l) running"
	@echo "Docker images: $(shell docker images -q | wc -l) total"
