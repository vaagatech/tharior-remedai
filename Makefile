# ==============================================================================
# Tharior Remedai — Monorepo Automation Tasks
# ==============================================================================

.PHONY: help test test-python build dev-api dev-web dev-docs docker-build docker-build-api docker-build-web docker-build-docs lint clean

help:
	@echo "Tharior Remedai Monorepo Commands:"
	@echo "  make test              - Run full test suite (pytest + frontend build)"
	@echo "  make test-python       - Run PyTest backend unit & integration tests"
	@echo "  make build             - Build all monorepo apps and packages"
	@echo "  make dev-api           - Run FastAPI API Gateway with live reload"
	@echo "  make dev-web           - Run React + Vite Web Desk dashboard"
	@echo "  make dev-docs          - Serve documentation locally on port 8080"
	@echo "  make docker-build      - Build discrete Docker images for all apps"
	@echo "  make docker-build-api  - Build API Gateway image (tharior/api-gateway:latest)"
	@echo "  make docker-build-web  - Build Web Desk image (tharior/web-desk:latest)"
	@echo "  make docker-build-docs - Build Docs Site image (tharior/docs-site:latest)"
	@echo "  make lint              - Lint frontend and backend code"
	@echo "  make clean             - Remove pycache, build artifacts, and caches"

test:
	.venv/bin/pytest -v
	cd apps/web-desk && npm run build

test-python:
	.venv/bin/pytest -v

build:
	cd apps/web-desk && npm run build

dev-api:
	.venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 --app-dir apps/api-gateway

dev-web:
	cd apps/web-desk && npm run dev

dev-docs:
	python3 -m http.server 8080 --directory apps/docs-site

docker-build: docker-build-api docker-build-web docker-build-docs

docker-build-api:
	docker build -t tharior/api-gateway:latest apps/api-gateway

docker-build-web:
	docker build -t tharior/web-desk:latest apps/web-desk

docker-build-docs:
	docker build -t tharior/docs-site:latest apps/docs-site

lint:
	cd apps/web-desk && npm run lint

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	rm -rf apps/web-desk/dist dist/
