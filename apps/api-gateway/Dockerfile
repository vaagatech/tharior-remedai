# Multi-stage Dockerfile for Autonomous Coding Agent Platform

# Stage 1: Build Frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Production Python Runtime
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application
COPY app/ ./app/
COPY pytest.ini .

# Copy built frontend assets
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Expose port
EXPOSE 8000

ENV PYTHONUNBUFFERED=1
ENV LITELLM_TELEMETRY=False

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
