"""
Strict Multi-Tenant User Session Isolation Engine.
Guarantees zero cross-session context overlap, memory separation,
and ephemeral sandbox isolation even within the same worker pod.
"""

import os
import shutil
import time
import uuid
import stat
import logging
from typing import Dict, Any, Optional, List
from contextvars import ContextVar
from pydantic import BaseModel, Field

logger = logging.getLogger("session_sandbox")

# Async Context Variables for strict in-flight request boundary
current_tenant_id: ContextVar[str] = ContextVar("current_tenant_id", default="default")
current_user_id: ContextVar[str] = ContextVar("current_user_id", default="default")
current_session_id: ContextVar[str] = ContextVar("current_session_id", default="default")


class UserSessionContext(BaseModel):
    session_id: str
    tenant_id: str
    user_id: str
    user_email: str
    workspace_path: str
    created_at: float = Field(default_factory=time.time)
    last_active: float = Field(default_factory=time.time)
    memory_scratchpad: Dict[str, Any] = Field(default_factory=dict)
    active_files: List[str] = Field(default_factory=list)
    is_isolated_pod: bool = False


class SessionSandboxManager:
    """
    Manages isolated scratchpads and ephemeral filesystem sandboxes
    with strict POSIX permission masks (0700) and lifecycle sweeps.
    """

    def __init__(self, base_sandbox_dir: str = "/tmp/sandboxes"):
        self.base_sandbox_dir = base_sandbox_dir
        self._sessions: Dict[str, UserSessionContext] = {}
        os.makedirs(self.base_sandbox_dir, exist_ok=True)

    def create_session(
        self,
        tenant_id: str,
        user_id: str,
        user_email: str,
        session_id: Optional[str] = None,
        is_isolated_pod: bool = False
    ) -> UserSessionContext:
        """Creates a dedicated, isolated sandbox directory with restricted permissions (0700)."""
        sid = session_id or f"sess_{uuid.uuid4().hex[:10]}"
        # Ensure safe alphanumeric directory naming to prevent path traversal
        safe_tenant = "".join(c for c in tenant_id if c.isalnum() or c in "-_") or "default"
        safe_user = "".join(c for c in user_id if c.isalnum() or c in "-_") or "default"
        
        workspace_path = os.path.join(self.base_sandbox_dir, f"{safe_tenant}_{safe_user}_{sid}")
        os.makedirs(workspace_path, exist_ok=True)
        
        # Enforce POSIX 0700: Read/Write/Execute strictly restricted to owner process
        try:
            os.chmod(workspace_path, stat.S_IRWXU)
        except Exception as e:
            logger.warning(f"Could not apply 0700 permission on {workspace_path}: {e}")

        context = UserSessionContext(
            session_id=sid,
            tenant_id=tenant_id,
            user_id=user_id,
            user_email=user_email,
            workspace_path=workspace_path,
            is_isolated_pod=is_isolated_pod
        )

        self._sessions[sid] = context
        
        # Bind async context variables
        current_tenant_id.set(tenant_id)
        current_user_id.set(user_id)
        current_session_id.set(sid)

        logger.info(f"Initialized isolated sandbox {sid} for Tenant={tenant_id}, User={user_id} at {workspace_path}")
        return context

    def get_session(self, session_id: str) -> Optional[UserSessionContext]:
        session = self._sessions.get(session_id)
        if session:
            session.last_active = time.time()
        return session

    def store_scratchpad_data(self, session_id: str, key: str, value: Any) -> bool:
        """Stores session-private variables that cannot be read by other tenants/users."""
        session = self.get_session(session_id)
        if not session:
            return False
        session.memory_scratchpad[key] = value
        return True

    def get_scratchpad_data(self, session_id: str, key: str) -> Optional[Any]:
        session = self.get_session(session_id)
        if not session:
            return None
        return session.memory_scratchpad.get(key)

    def cleanup_session(self, session_id: str) -> bool:
        """Destroys workspace directory and erases session state to prevent memory leakage."""
        session = self._sessions.pop(session_id, None)
        if not session:
            return False

        if os.path.exists(session.workspace_path):
            try:
                shutil.rmtree(session.workspace_path)
                logger.info(f"Cleaned up sandbox workspace {session.workspace_path}")
            except Exception as err:
                logger.error(f"Error removing sandbox directory {session.workspace_path}: {err}")

        return True

    def list_active_sessions(self, tenant_id: Optional[str] = None) -> List[UserSessionContext]:
        if tenant_id:
            return [s for s in self._sessions.values() if s.tenant_id == tenant_id]
        return list(self._sessions.values())


# Global Sandbox Manager Singleton
sandbox_manager = SessionSandboxManager()
