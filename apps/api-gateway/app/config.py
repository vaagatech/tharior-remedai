"""
Configuration and Environment Settings for Tharior Remedai.
"""

import os
from pydantic import BaseModel


class AppConfig(BaseModel):
    app_name: str = "Tharior Remedai — Enterprise Agentic Autonomous Remediation Platform"
    environment: str = os.getenv("ENV", "development")
    port: int = int(os.getenv("PORT", "8000"))
    max_memory_mb: int = int(os.getenv("MAX_MEMORY_MB", "300"))
    gc_reserve_ratio: float = float(os.getenv("GC_RESERVE_RATIO", "0.20"))
    
    # Model defaults
    nano_model: str = os.getenv("NANO_MODEL", "gemini/gemini-1.5-flash-8b")
    mid_model: str = os.getenv("MID_MODEL", "claude-3-5-haiku-20241022")
    frontier_model: str = os.getenv("FRONTIER_MODEL", "claude-3-7-sonnet-20250219")
    
    # Routing & Gateway
    llm_routing_mode: str = os.getenv("LLM_ROUTING_MODE", "GATEWAY")
    openrouter_api_key: str = os.getenv("OPENROUTER_API_KEY", "")
    anvesh_endpoint: str = os.getenv("ANVESH_ENDPOINT", "http://localhost:9090")
    
    # Webhooks & Adapters
    slack_webhook_url: str = os.getenv("SLACK_WEBHOOK_URL", "")
    teams_webhook_url: str = os.getenv("TEAMS_WEBHOOK_URL", "")


config = AppConfig()
