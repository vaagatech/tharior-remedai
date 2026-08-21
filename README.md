<div align="center">
  <img src="apps/docs-site/assets/images/logo.svg" alt="Tharior Remedai Logo" width="560" />
  <p><strong>Enterprise Agentic Autonomous Remediation & Coding Platform</strong></p>
  <p><em>Unified Multi-Agent Mesh • 10-Tier Dynamic LLM Engine • Backed by Anvesh Vector DB & AST Knowledge Graph</em></p>
</div>

---

## 🏛️ Monorepo Architecture

Tharior Remedai is organized as a high-performance multi-package monorepo with discrete, decoupled Docker containers for each application:

```
autonomous-coding-engineer/ (Monorepo Root)
├── apps/
│   ├── api-gateway/         # FastAPI Orchestrator, Dual LLM Router, Circuit Breakers & DLQ
│   │   ├── app/             # Core, Services, Models, MCP Tools
│   │   ├── Dockerfile       # Standalone Python 3.11-slim image (tharior/api-gateway)
│   │   └── requirements.txt
│   ├── web-desk/            # React + Vite Developer Dashboard & Observability UI
│   │   ├── src/             # Dashboard, A2A visualizer, DLQ Replay bench, Terminal
│   │   ├── nginx.conf       # Lightweight SPA Nginx configuration
│   │   ├── Dockerfile       # Standalone Node builder -> Nginx image (tharior/web-desk)
│   │   └── package.json
│   └── docs-site/           # Anvesh-themed GitHub Pages documentation suite
│       ├── index.html, 10-tier-llm.html, architecture.html, anvesh-storage.html...
│       ├── nginx.conf       # Static docs Nginx configuration
│       ├── Dockerfile       # Standalone static Nginx image (tharior/docs-site)
│       └── assets/          # SVG logos, Favicons, Stylesheets
├── packages/
│   ├── anvesh-sdk/          # Shared Anvesh Vector DB & Knowledge Graph Python SDK
│   └── agent-protocols/     # Shared A2A Agent schemas, 10-Tier types & MCP protocols
├── deploy/
│   ├── k8s/                 # Kubernetes Deployment, HPA, KEDA ScaledObject, ScaledJob & CRDs
│   └── docker/              # Docker Compose multi-service configuration
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

### Start Documentation Site
```bash
make dev-docs
# or: npm run dev:docs (Runs on http://localhost:8080)
```

---

## 🐳 Discrete Docker Container Deployment

Each application has its own dedicated, optimized, and single-purpose Docker image:

| Service | Dockerfile | Base Image | Port | Description |
| :--- | :--- | :--- | :--- | :--- |
| **API Gateway** | [`apps/api-gateway/Dockerfile`](file:///Users/karthiksp/projects/autonomous-coding-engineer/apps/api-gateway/Dockerfile) | `python:3.11-slim` | `8000` | FastAPI backend, A2A mesh & MCP tools |
| **Web Desk** | [`apps/web-desk/Dockerfile`](file:///Users/karthiksp/projects/autonomous-coding-engineer/apps/web-desk/Dockerfile) | `nginx:alpine-slim` | `5173:80` | Production compiled React/Vite SPA |
| **Docs Site** | [`apps/docs-site/Dockerfile`](file:///Users/karthiksp/projects/autonomous-coding-engineer/apps/docs-site/Dockerfile) | `nginx:alpine-slim` | `8080:80` | Technical documentation and benchmark site |

### Build Individual Images
```bash
make docker-build-api   # Builds tharior/api-gateway:latest
make docker-build-web   # Builds tharior/web-desk:latest
make docker-build-docs  # Builds tharior/docs-site:latest
```

### Launch Complete Stack with Docker Compose
```bash
docker compose up -d
```
