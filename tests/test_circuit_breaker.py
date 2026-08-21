"""
Unit and Integration Tests for Circuit Breakers and Fast Fallback Resiliency.
"""

import pytest
import asyncio
from app.core.circuit_breaker import CircuitBreaker, CircuitState


@pytest.mark.asyncio
async def test_circuit_breaker_success_flow():
    cb = CircuitBreaker("test_service", failure_threshold=2, recovery_timeout_seconds=1.0)
    assert cb.state == CircuitState.CLOSED

    async def successful_call(val: int) -> int:
        return val * 2

    res = await cb.call(successful_call, None, 5)
    assert res == 10
    assert cb.state == CircuitState.CLOSED
    assert cb.failure_count == 0


@pytest.mark.asyncio
async def test_circuit_breaker_trip_and_fallback():
    cb = CircuitBreaker("test_tripper", failure_threshold=2, recovery_timeout_seconds=0.5, half_open_success_threshold=1)

    async def failing_call():
        raise ConnectionError("Remote service unavailable")

    async def fallback_call():
        return "FALLBACK_SUCCESS"

    # 1st failure
    with pytest.raises(ConnectionError):
        await cb.call(failing_call, None)
    assert cb.state == CircuitState.CLOSED
    assert cb.failure_count == 1

    # 2nd failure -> Trips to OPEN
    with pytest.raises(ConnectionError):
        await cb.call(failing_call, None)
    assert cb.state == CircuitState.OPEN
    assert cb.total_trips == 1

    # Call while OPEN with fallback -> executes fallback immediately without calling failing_call
    res = await cb.call(failing_call, fallback_call)
    assert res == "FALLBACK_SUCCESS"

    # Wait for recovery timeout
    await asyncio.sleep(0.6)

    # Next call transitions to HALF_OPEN and probes recovery
    async def recovered_call():
        return "RECOVERED"

    res2 = await cb.call(recovered_call, None)
    assert res2 == "RECOVERED"
    assert cb.state == CircuitState.CLOSED
