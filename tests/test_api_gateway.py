"""
Tests for FastAPI Gateway endpoints, Webhook Ingestion, and Healthcheck.
"""

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_health_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/healthz")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "HEALTHY"
        assert "rss_mb" in data


@pytest.mark.asyncio
async def test_webhook_ingest_endpoint():
    payload = {
        "ticket_id": "JIRA-TEST-99",
        "source": "jira",
        "repo_name": "org/payments-service",
        "title": "Fix memory leak in webhook streaming connection",
        "description": "Stream disconnect does not free socket file descriptor.",
        "user_email": "engineer@company.com",
        "tenant_group": "payments-dev"
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post("/api/v1/tickets/webhook", json=payload, headers={"x-tenant": "payments-dev"})
        assert resp.status_code == 202
        data = resp.json()
        assert data["status"] == "QUEUED"
        assert data["ticket_id"] == "JIRA-TEST-99"


@pytest.mark.asyncio
async def test_get_agents_and_metrics():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/v1/agents")
        assert resp.status_code == 200
        agents = resp.json()
        assert len(agents) >= 4

        metrics_resp = await client.get("/api/v1/metrics")
        assert metrics_resp.status_code == 200
        metrics = metrics_resp.json()
        assert "aggregate_cost_usd" in metrics
        assert "total_dispatched" in metrics


@pytest.mark.asyncio
async def test_system_gc_trigger():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post("/api/v1/system/gc")
        assert resp.status_code == 200
        data = resp.json()
        assert "metrics" in data
        assert "headroom_mb" in data["metrics"]
