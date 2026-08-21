"""
Unit Tests for Strict Multi-Tenant User Session Sandboxing and Isolation.
"""

import os
import stat
import pytest
from app.core.session_sandbox import sandbox_manager


def test_session_sandbox_creation_and_permissions():
    session = sandbox_manager.create_session(
        tenant_id="tenant_x",
        user_id="user_alice",
        user_email="alice@company.com"
    )

    assert session.session_id is not None
    assert os.path.exists(session.workspace_path)
    
    # Check POSIX 0700 permissions (Owner RWX only)
    mode = stat.S_IMODE(os.stat(session.workspace_path).st_mode)
    assert mode == 0o700

    # Store private scratchpad data
    sandbox_manager.store_scratchpad_data(session.session_id, "active_patch", "patch_data_123")
    val = sandbox_manager.get_scratchpad_data(session.session_id, "active_patch")
    assert val == "patch_data_123"

    # Cleanup session
    path = session.workspace_path
    sandbox_manager.cleanup_session(session.session_id)
    assert not os.path.exists(path)
    assert sandbox_manager.get_session(session.session_id) is None


def test_cross_tenant_isolation_boundary():
    s1 = sandbox_manager.create_session(tenant_id="org_a", user_id="user_1", user_email="u1@a.com")
    s2 = sandbox_manager.create_session(tenant_id="org_b", user_id="user_2", user_email="u2@b.com")

    assert s1.workspace_path != s2.workspace_path
    assert "org_a" in s1.workspace_path
    assert "org_b" in s2.workspace_path

    # List by tenant
    org_a_sessions = sandbox_manager.list_active_sessions(tenant_id="org_a")
    assert all(s.tenant_id == "org_a" for s in org_a_sessions)

    # Cleanup
    sandbox_manager.cleanup_session(s1.session_id)
    sandbox_manager.cleanup_session(s2.session_id)
