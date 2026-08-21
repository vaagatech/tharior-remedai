<div align="center">
  <img src="apps/docs-site/assets/images/logo.svg" alt="Tharior Remedai Logo" width="560" />
  <p><strong>Enterprise Agentic Autonomous Remediation & Coding Platform</strong></p>
  <p><em>Unified Multi-Agent Mesh • 10-Tier Dynamic LLM Engine • Backed by Anvesh Vector DB & AST Knowledge Graph</em></p>
</div>

---

## 🏛️ Monorepo Architecture

Tharior Remedai is organized as a high-performance multi-package monorepo:

```
autonomous-coding-engineer/ (Monorepo Root)
├── apps/
│   ├── api-gateway/         # FastAPI Orchestrator, Dual LLM Router, Circuit Breakers & DLQ
│   │   ├── app/
│   │   │   ├── core/        # ResilienceGuard, CircuitBreaker, EventBus, TelemetryReplay
│   │   │   ├── services/    # TieredEngine, LLMRouter, PricingService, ClarificationHub
│   │   │   ├── models/      # Pydantic data schemas and contracts
│   │   │   └── mcp/         # Model Context Protocol servers (Anvesh, Sandbox, VCS)
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   ├── web-desk/            # React + Vite Developer Dashboard & Observability UI
│   │   ├── src/             # Dashboard, A2A visualizer, DLQ Replay bench, Terminal
│   │   └── package.json
│   └── docs-site/           # Anvesh-themed GitHub Pages documentation suite
│       ├── index.html, 10-tier-llm.html, architecture.html, anvesh-storage.html...
│       └── assets/          # SVG logos, Favicons, Stylesheets
├── packages/
│   ├── anvesh-sdk/          # Shared Anvesh Vector DB & Knowledge Graph Python SDK
│   └── agent-protocols/     # Shared A2A Agent schemas, 10-Tier types & MCP protocols
├── deploy/
│   ├── k8s/                 # Kubernetes Deployment, HPA, KEDA ScaledObject & ScaledJob
│   └── docker/              # Docker compose container runtime
├── tests/                   # Monorepo integration, security, & end-to-end PyTest suite
├── package.json             # Root npm workspaces configuration
├── pytest.ini               # Root Python test runner configuration
└── Makefile                 # Unified monorepo task runner
```

---

## 🚀 Quick Start Commands

You can manage all apps and packages in the monorepo from the root directory:

### Run Full Test Suite
```bash
make test
# or: npm test
```

### Start API Gateway (FastAPI)
```bash
make dev-api
# or: npm run dev:api (Runs on http://localhost:8000)
```

### Start Web Desk (React + Vite)
```bash
make dev-web
# or: npm run dev:web (Runs on http://localhost:5173)
```

### Serve Documentation Site
```bash
make dev-docs
# or: npm run dev:docs (Runs on http://localhost:8080)
```

---

## 🌟 Key Capabilities

1. **Multi-Dimensional 10-Tier LLM Engine**: Greedy Low-Cost First routing balancing cost, throughput, and benchmarks (HumanEval, SWE-bench).
2. **Anvesh Unified Storage**: Tenant-isolated vector embeddings and AST graph traversal.
3. **Zero-Missed Observability & DLQ Replay**: Structured correlation tracing with non-blocking failure quarantine and on-demand replay.
4. **Resilient Circuit Breakers**: Automatic fallbacks for OpenRouter Gateway, Anvesh storage, and MCP tools.
5. **Session Isolation & Autoscaling**: Strict per-tenant sandboxing with K8s HPA and KEDA event-driven workers.
