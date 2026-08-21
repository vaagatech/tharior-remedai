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
