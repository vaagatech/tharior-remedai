"""
A2A (Agent-to-Agent) Dispatcher & Dynamic AgentCards Registry.
Standardizes multi-agent delegation, role specialization, capability matching,
and MCP tool permissions across domain teams.
"""

from typing import List, Dict, Optional
from app.models.agent import AgentCard, TierLevel


class A2ADispatcherService:
    """Manages the registry of specialized AgentCards and delegation routes."""

    def __init__(self):
        self._agents: Dict[str, AgentCard] = {}
        self._register_default_agent_cards()

    def _register_default_agent_cards(self):
        cards = [
            AgentCard(
                agent_id="agent_nano_triage",
                name="Clarity & Fast Triage Agent",
                role="Classifier & Verification Gate",
                domain="Triage & Routing",
                description="Performs sub-100ms AST lookup, complexity assessment, and ambiguity verification.",
                capabilities=["AST Subgraph Query", "Complexity Classification", "Ambiguity Guard", "Typo Fixes"],
                mcp_tools=["graph-okf", "telemetry-engine"],
                default_tier=TierLevel.NANO,
                avatar_color="emerald",
                cost_per_1k_est=0.15
            ),
            AgentCard(
                agent_id="agent_backend_py",
                name="Backend Python Agent",
                role="Defect Remediation Engineer",
                domain="Python / FastAPI / AsyncIO",
                description="Resolves unit test failures, API edge cases, serialization bugs, and retry policies.",
                capabilities=["PyTest Test-Driven Fix", "HTTP Handler Patching", "Async Concurrency", "Linter Cleanliness"],
                mcp_tools=["graph-okf", "sandbox-runner", "git-engine", "telemetry-engine"],
                default_tier=TierLevel.MID,
                avatar_color="indigo",
                cost_per_1k_est=1.50
            ),
            AgentCard(
                agent_id="agent_frontend_react",
                name="Frontend React & UI Agent",
                role="UI / UX & Component Specialist",
                domain="TypeScript / React / CSS",
                description="Fixes frontend component bugs, visual state issues, accessibility violations, and build scripts.",
                capabilities=["React Hook Debugging", "CSS / Tailwind Layout Fixes", "A11y ARIA Compliance", "Vite Bundle Verification"],
                mcp_tools=["graph-okf", "sandbox-runner", "git-engine"],
                default_tier=TierLevel.MID,
                avatar_color="purple",
                cost_per_1k_est=1.80
            ),
            AgentCard(
                agent_id="agent_frontier_arch",
                name="Frontier Architecture Agent",
                role="Core Systems & Distributed Architect",
                domain="Distributed Systems / Core Architecture",
                description="Tackles multi-file refactoring, distributed state synchronization, deadlocks, and schema migrations.",
                capabilities=["Multi-File Refactoring", "Distributed Consensus Fixes", "Locking & Race Conditions", "Zero-Downtime DB Migrations"],
                mcp_tools=["graph-okf", "sandbox-runner", "git-engine", "telemetry-engine"],
                default_tier=TierLevel.FRONTIER,
                avatar_color="amber",
                cost_per_1k_est=22.50
            ),
            AgentCard(
                agent_id="agent_security_auditor",
                name="Security & RBAC Auditor",
                role="Security & Compliance Guard",
                domain="AppSec / Cryptography / IAM",
                description="Scans patches for OWASP Top 10 vulnerabilities, HMAC signature verification, and secret leaks.",
                capabilities=["HMAC Signature Audit", "SAST Pattern Matching", "Tenant Isolation Checks", "Memory Safety Verifier"],
                mcp_tools=["graph-okf", "sandbox-runner"],
                default_tier=TierLevel.FRONTIER,
                avatar_color="rose",
                cost_per_1k_est=18.00
            ),
            AgentCard(
                agent_id="agent_k8s_devops",
                name="DevOps & K8s Platform Agent",
                role="Site Reliability & Cloud Engineer",
                domain="Kubernetes / Helm / Envoy / CI-CD",
                description="Validates light-pod resource limits, HPA configurations, ingress rate limits, and Docker builds.",
                capabilities=["K8s Manifest Validation", "HPA Policy Tuning", "Dockerfile Optimization", "CI/CD Pipeline Fixes"],
                mcp_tools=["sandbox-runner", "git-engine"],
                default_tier=TierLevel.MID,
                avatar_color="cyan",
                cost_per_1k_est=2.00
            )
        ]

        for card in cards:
            self._agents[card.agent_id] = card

    def list_agent_cards(self) -> List[AgentCard]:
        """Returns all registered AgentCards."""
        return list(self._agents.values())

    def get_agent_card(self, agent_id: str) -> Optional[AgentCard]:
        return self._agents.get(agent_id)


# Global A2A dispatcher singleton
a2a_dispatcher = A2ADispatcherService()
