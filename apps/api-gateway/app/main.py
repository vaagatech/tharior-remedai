"""
Tharior Remedai: Enterprise Agentic Autonomous Remediation & Coding Platform.
Integrates Webhook Ingestion, 10-Tier Dynamic LLM Routing, Anvesh Vector & Knowledge Graph,
Agentic Self-Healing Reflection, Clarification Desk, A2A Multi-Agent Dispatcher,
AWS Cognito Auth, Strict User Session Sandboxing, Circuit Breakers, DLQ Replay, and Prometheus Metrics.
"""

import asyncio
import os
import time
from contextlib import asynccontextmanager
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, Header, HTTPException, status, WebSocket, WebSocketDisconnect, Query, Depends, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.config import config
from app.models.ticket import TicketPayload
from app.models.clarification import (
    TaskStatus,
    ClarificationSession,
    ClarificationAnswerRequest
)
from app.models.agent import AgentCard, TaskExecutionReport, TierLevel, ModelTierSpec
from app.models.agent_comparison import agent_comparison_engine, AgentBenchmarkProfile, FeatureRoadmapItem
from app.core.resilience_guard import resource_guard
from app.core.event_bus import event_bus
from app.core.session_sandbox import sandbox_manager
from app.core.auth import cognito_service, get_current_user, CognitoUser, LoginRequest, AuthTokenResponse
from app.core.circuit_breaker import circuit_breakers
from app.core.telemetry_replay import observability_engine, DeadLetterRecord
from app.services.clarification_hub import clarification_hub
from app.services.tiered_engine import agent_engine
from app.services.a2a_dispatcher import a2a_dispatcher
from app.services.anvesh_client import anvesh_client
from app.services.llm_pricing_service import llm_pricing_service
from app.services.llm_router import llm_router
from app.mcp.client import MCPClient
from app.mcp.servers.telemetry import TelemetryMCPServer


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Starts background memory leak watcher and resilience monitors on startup."""
    watcher_task = asyncio.create_task(resource_guard.start_background_leak_watcher(interval_seconds=30.0))
    yield
    watcher_task.cancel()
    try:
        await watcher_task
    except asyncio.CancelledError:
        pass


app = FastAPI(
    title="Tharior Remedai Gateway",
    description="Tharior Remedai — Enterprise-grade Agentic Autonomous Coding & Remediation Platform (A2A + MCP + Anvesh) with 10-Tier Routing, User Sandboxing & Clarification Desk.",
    version="2.1.0",
    lifespan=lifespan
)

# Enable CORS for Vite frontend & Documentation
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- HEALTH & PROBES ---

@app.get("/healthz", status_code=status.HTTP_200_OK)
async def health_check():
    """Kubernetes liveness and readiness probe."""
    metrics = resource_guard.get_metrics()
    return {
        "platform": "Tharior Remedai",
        "status": "HEALTHY",
        "timestamp": time.time(),
        "memory_headroom_healthy": metrics["headroom_healthy"],
        "rss_mb": metrics["rss_mb"],
        "storage_backend": "Anvesh Unified Engine",
        "agentic_engine": "A2A Multi-Agent Orchestration",
        "active_tiers": 10
    }


# --- PROMETHEUS METRICS ---

@app.get("/metrics/prometheus", status_code=status.HTTP_200_OK)
async def prometheus_metrics():
    """Exposes OpenMetrics / Prometheus scraping metrics."""
    metrics_text = observability_engine.generate_prometheus_metrics()
    return Response(content=metrics_text, media_type="text/plain; version=0.0.4")


# --- AWS COGNITO AUTHENTICATION ---

@app.post("/api/v1/auth/login", response_model=AuthTokenResponse)
async def login(req: LoginRequest):
    """Simulates AWS Cognito AdminInitiateAuth / token exchange flow."""
    return cognito_service.simulate_login(req)


@app.get("/api/v1/auth/me", response_model=CognitoUser)
async def get_me(user: CognitoUser = Depends(get_current_user)):
    """Returns profile and verified tenant context for current authenticated user."""
    return user


# --- 10-TIER LLM PRICING & ROUTING ---

@app.get("/api/v1/models/tiers", response_model=List[ModelTierSpec])
async def get_model_tiers():
    """Returns full 10-tier dynamic LLM specification and active models."""
    return llm_pricing_service.get_all_tiers()


@app.post("/api/v1/models/refresh-pricing")
async def refresh_model_pricing(force: bool = Query(default=True)):
    """Fetches live pricing from OpenRouter API and updates 10-tier matrix in Anvesh."""
    return await llm_pricing_service.fetch_and_update_pricing(force=force)


class RouteTestRequest(BaseModel):
    model: str = "openai/gpt-4o"
    prompt: str = "What is the meaning of life?"
    routing_mode: Optional[str] = "GATEWAY"  # "GATEWAY" or "STRAIGHT"


@app.post("/api/v1/models/route-test")
async def test_llm_route(req: RouteTestRequest, user: CognitoUser = Depends(get_current_user)):
    """Executes LLM chat completion via Straight Route or Gateway Route."""
    messages = [{"role": "user", "content": req.prompt}]
    return await llm_router.chat_completion(
        model=req.model,
        messages=messages,
        routing_mode=req.routing_mode
    )


# --- ANVESH STORAGE & VECTOR DB APIS ---

class VectorSearchRequest(BaseModel):
    collection: str = "remediation_patches"
    query: str
    top_k: int = 5
    metadata_filter: Optional[Dict[str, Any]] = None


@app.post("/api/v1/storage/vector/search")
async def search_anvesh_vectors(req: VectorSearchRequest, user: CognitoUser = Depends(get_current_user)):
    """Performs tenant-isolated semantic vector search in Anvesh."""
    results = anvesh_client.search_vectors(
        collection_name=req.collection,
        query=req.query,
        top_k=req.top_k,
        metadata_filter=req.metadata_filter,
        tenant_id=user.tenant_id,
        user_id=user.user_id
    )
    return {
        "collection": req.collection,
        "query": req.query,
        "results_count": len(results),
        "results": results,
        "tenant_id": user.tenant_id
    }


@app.get("/api/v1/storage/graph/query")
async def query_anvesh_knowledge_graph(
    root_symbol: str = Query(default="repo:org/payments-service"),
    depth: int = Query(default=2),
    user: CognitoUser = Depends(get_current_user)
):
    """Traverses codebase AST entities and dependencies in Anvesh Knowledge Graph."""
    subgraph = anvesh_client.query_graph_subgraph(
        root_id=root_symbol,
        max_depth=depth,
        tenant_id=user.tenant_id
    )
    return subgraph


# --- USER SESSION & SANDBOX ISOLATION ---

@app.get("/api/v1/sandboxes/active")
async def list_active_sandboxes(user: CognitoUser = Depends(get_current_user)):
    """Returns active isolated scratchpad directories within the tenant boundary."""
    sessions = sandbox_manager.list_active_sessions(tenant_id=user.tenant_id)
    return {
        "tenant_id": user.tenant_id,
        "active_sandboxes_count": len(sessions),
        "sandboxes": sessions
    }


# --- AUTONOMOUS AGENT COMPARISON & ROADMAP ---

@app.get("/api/v1/agent-comparison/profiles", response_model=List[AgentBenchmarkProfile])
async def get_agent_profiles():
    """Returns comparative architectural benchmark across Devin, Cursor, Antigravity, etc."""
    return agent_comparison_engine.get_benchmark_profiles()


@app.get("/api/v1/agent-comparison/matrix", response_model=List[FeatureRoadmapItem])
async def get_feature_matrix():
    """Returns directional feature matrix with Core Principles and Anti-Pattern guardrails."""
    return agent_comparison_engine.get_feature_matrix()


# --- OBSERVABILITY & DEAD-LETTER QUEUE (DLQ) REPLAY ---

@app.get("/api/v1/telemetry/events")
async def get_telemetry_events(
    limit: int = Query(default=50, le=200),
    user: CognitoUser = Depends(get_current_user)
):
    """Returns the most recent structured observability events (Zero-Missed Guarantee)."""
    return observability_engine.list_recent_events(limit=limit, tenant_id=user.tenant_id)


@app.get("/api/v1/telemetry/dlq", response_model=List[DeadLetterRecord])
async def list_dlq_records(user: CognitoUser = Depends(get_current_user)):
    """Returns all quarantined failure records in the Dead-Letter Queue."""
    return observability_engine.list_dlq_records(tenant_id=user.tenant_id)


@app.get("/api/v1/telemetry/dlq/{dlq_id}", response_model=DeadLetterRecord)
async def get_dlq_record(dlq_id: str, user: CognitoUser = Depends(get_current_user)):
    """Returns detailed diagnostics and stack trace for a quarantined DLQ record."""
    record = observability_engine.get_dlq_record(dlq_id)
    if not record:
        raise HTTPException(status_code=404, detail="Dead letter record not found")
    return record


@app.post("/api/v1/telemetry/dlq/{dlq_id}/replay")
async def replay_dlq_record(dlq_id: str, user: CognitoUser = Depends(get_current_user)):
    """
    Replays a quarantined task from the DLQ with clean state
    without interrupting active tasks.
    """
    record = observability_engine.get_dlq_record(dlq_id)
    if not record:
        raise HTTPException(status_code=404, detail="Dead letter record not found")

    # Reconstruct payload
    payload_dict = record.input_payload or {
        "ticket_id": record.ticket_id,
        "repo_name": "unknown/repo",
        "title": f"Replayed task {record.task_id}",
        "description": "Replay from DLQ"
    }
    ticket = TicketPayload(**payload_dict)
    ticket.tenant_group = user.tenant_id
    ticket.user_email = user.email

    # Mark as replayed
    observability_engine.mark_replayed(dlq_id)

    # Launch execution task
    asyncio.create_task(agent_engine.process_ticket(ticket))

    return {
        "status": "REPLAY_DISPATCHED",
        "dlq_id": dlq_id,
        "ticket_id": ticket.ticket_id,
        "message": "Task queued for replay without blocking other pipeline items."
    }


@app.get("/api/v1/telemetry/circuit-breakers")
async def get_circuit_breakers():
    """Returns live health and trip state of all circuit breakers."""
    return {name: cb.get_metrics() for name, cb in circuit_breakers.items()}


# --- WEBHOOK INGESTION ---

@app.post("/api/v1/tickets/webhook", status_code=status.HTTP_202_ACCEPTED)
async def webhook_ingest(
    payload: TicketPayload,
    user: CognitoUser = Depends(get_current_user)
):
    """
    Ingests inbound issues and dispatches 10-tier remediation pipeline
    with dedicated user/tenant session isolation.
    """
    payload.tenant_group = user.tenant_id
    payload.user_email = user.email

    # Check OS memory headroom prior to ingestion
    if not resource_guard.check_headroom():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Node memory headroom critically low. Garbage collection in progress."
        )

    # Initialize isolated session sandbox
    session = sandbox_manager.create_session(
        tenant_id=user.tenant_id,
        user_id=user.user_id,
        user_email=user.email
    )

    # Launch non-blocking reactive agent processing
    asyncio.create_task(agent_engine.process_ticket(payload))
    
    return {
        "platform": "Tharior Remedai",
        "status": "QUEUED",
        "ticket_id": payload.ticket_id,
        "repo": payload.repo_name,
        "tenant_group": payload.tenant_group,
        "session_id": session.session_id,
        "timestamp": time.time()
    }


# --- CLARIFICATION DESK ---

@app.get("/api/v1/clarification/pending", response_model=List[ClarificationSession])
async def get_pending_clarifications():
    """Returns active tasks halted by the Clarity Verification Gate waiting for user input."""
    return clarification_hub.list_pending_sessions()


@app.get("/api/v1/clarification/all", response_model=List[ClarificationSession])
async def get_all_clarifications():
    """Returns all clarification sessions."""
    return clarification_hub.list_all_sessions()


@app.get("/api/v1/clarification/{session_id}", response_model=ClarificationSession)
async def get_clarification_session(session_id: str):
    """Returns a specific clarification session."""
    session = clarification_hub.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Clarification session not found")
    return session


@app.post("/api/v1/clarification/{session_id}/answer")
async def answer_clarification(session_id: str, request: ClarificationAnswerRequest, user: CognitoUser = Depends(get_current_user)):
    """
    Submits user responses to the ambiguity questions and resumes
    autonomous agent remediation with resolved context.
    """
    session = await clarification_hub.resolve_session(
        session_id=session_id,
        answers=request.answers,
        user_email=request.user_email or user.email
    )
    if not session:
        raise HTTPException(status_code=404, detail="Clarification session not found")

    # Resume the agent with clarified context
    ticket = TicketPayload(
        ticket_id=session.ticket_id,
        source="clarification_desk",
        repo_name=session.repo_name,
        title=session.title,
        description=f"{session.title}\n\nResolved Instructions:\n{session.resolved_context}",
        user_email=request.user_email or user.email,
        tenant_group=session.tenant_group or user.tenant_id
    )

    asyncio.create_task(agent_engine.process_ticket(ticket, forced_context=session.resolved_context))

    return {
        "status": "RESUMED",
        "session_id": session.session_id,
        "ticket_id": session.ticket_id,
        "resolved_context": session.resolved_context
    }


# --- A2A AGENTS & EXECUTION REPORTS ---

@app.get("/api/v1/agents", response_model=List[AgentCard])
async def list_agent_cards():
    """Returns all registered A2A AgentCards and capabilities."""
    return a2a_dispatcher.list_agent_cards()


@app.get("/api/v1/tickets/reports")
async def list_execution_reports():
    """Returns all execution reports, traces, diffs, and PR statuses."""
    return list(agent_engine.reports.values())


@app.get("/api/v1/tickets/reports/{task_id}")
async def get_execution_report(task_id: str):
    """Returns a single execution report by task_id."""
    report = agent_engine.reports.get(task_id)
    if not report:
        # Fallback to Anvesh Document Store
        doc = anvesh_client.get_document("execution_reports", task_id)
        if doc:
            return doc
        raise HTTPException(status_code=404, detail="Execution report not found")
    return report


# --- MCP DIRECT EXECUTION (Interactive Test Bench) ---

class MCPExecuteRequest(BaseModel):
    server: str
    tool: str
    params: Dict[str, Any] = {}


@app.post("/api/v1/mcp/execute")
async def execute_mcp_tool(req: MCPExecuteRequest):
    """Directly invokes an MCP server tool for testing & inspection."""
    res = await MCPClient.execute(req.server, req.tool, req.params)
    return res


# --- TELEMETRY & SYSTEM HEALTH ---

@app.get("/api/v1/metrics")
async def get_telemetry_metrics():
    """Returns aggregated executive KPIs (Cost, Success rate, Token counts)."""
    return TelemetryMCPServer.get_summary_metrics()


@app.get("/api/v1/metrics/system")
async def get_system_metrics():
    """Returns real-time OS memory guard and CPU headroom metrics."""
    return resource_guard.get_metrics()


@app.post("/api/v1/system/gc")
async def trigger_garbage_collection():
    """Triggers forced garbage collection and returns updated headroom."""
    resource_guard.collect()
    return {
        "message": "Garbage collection completed.",
        "metrics": resource_guard.get_metrics()
    }


# --- REACTIVE WEBSOCKET EVENT STREAM ---

@app.websocket("/ws/events")
async def websocket_events_endpoint(websocket: WebSocket):
    """
    Real-time reactive event stream.
    Broadcasts trace steps, clarification state changes, and pod metrics to dashboard clients.
    """
    await event_bus.register(websocket)
    try:
        while True:
            msg = await websocket.receive_text()
            if msg == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        await event_bus.unregister(websocket)
    except Exception:
        await event_bus.unregister(websocket)
