"""
Unit Tests for AWS Cognito Authentication and Simulation Provider.
"""

import pytest
from app.core.auth import cognito_service, LoginRequest


def test_cognito_simulation_login_and_verification():
    req = LoginRequest(
        username="karthik",
        password="ValidPassword123!",
        tenant_id="enterprise-dev"
    )

    auth_resp = cognito_service.simulate_login(req)
    assert auth_resp.access_token is not None
    assert auth_resp.id_token is not None
    assert auth_resp.user.username == "karthik"
    assert auth_resp.user.tenant_id == "enterprise-dev"

    # Verify token
    verified_user = cognito_service.verify_token(auth_resp.id_token)
    assert verified_user.username == "karthik"
    assert verified_user.tenant_id == "enterprise-dev"
    assert verified_user.is_authenticated is True


@pytest.mark.asyncio
async def test_require_admin_role_rbac():
    """Validates RBAC check allows admins and denies non-admins with 403."""
    from app.core.auth import require_admin_role, CognitoUser
    from fastapi import HTTPException

    admin_user = CognitoUser(
        user_id="usr_admin",
        username="admin_user",
        email="admin@enterprise.internal",
        roles=["admin"]
    )
    res = await require_admin_role(user=admin_user)
    assert res.username == "admin_user"

    viewer_user = CognitoUser(
        user_id="usr_viewer",
        username="viewer_user",
        email="viewer@enterprise.internal",
        roles=["viewer"]
    )
    with pytest.raises(HTTPException) as exc_info:
        await require_admin_role(user=viewer_user)
    assert exc_info.value.status_code == 403

