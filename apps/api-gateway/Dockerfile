# ==============================================================================
# Discrete Dockerfile: Tharior Remedai API Gateway & Agent Engine
# Standalone Python 3.11-slim FastAPI microservice
# ==============================================================================
FROM python:3.11-slim

WORKDIR /app

# Install minimal system dependencies & security updates
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application and configuration
COPY app/ ./app/

# Expose API Gateway port
EXPOSE 8000

ENV PYTHONUNBUFFERED=1
ENV LITELLM_TELEMETRY=False

# Run FastAPI gateway
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
