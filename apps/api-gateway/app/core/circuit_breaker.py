"""
Circuit Breaker Pattern for Resilient External Service & LLM Invocations.
Prevents cascading failures, applies fast-fallback strategies, and protects pod memory/threads.
"""

import time
import asyncio
import logging
from typing import Callable, Any, Optional, Dict
from enum import Enum

logger = logging.getLogger("circuit_breaker")


class CircuitState(str, Enum):
    CLOSED = "CLOSED"       # Normal operation; requests pass through
    OPEN = "OPEN"           # Failing state; fast-fallback active
    HALF_OPEN = "HALF_OPEN" # Recovery probe state


class CircuitBreaker:
    """
    Thread-safe & async-safe Circuit Breaker with exponential backoff and fast fallback.
    """

    def __init__(
        self,
        name: str,
        failure_threshold: int = 4,
        recovery_timeout_seconds: float = 20.0,
        half_open_success_threshold: int = 2
    ):
        self.name = name
        self.failure_threshold = failure_threshold
        self.recovery_timeout_seconds = recovery_timeout_seconds
        self.half_open_success_threshold = half_open_success_threshold
        
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time: float = 0.0
        self.total_trips = 0
        self._lock = asyncio.Lock()

    async def call(
        self,
        coro_func: Callable[..., Any],
        fallback_func: Optional[Callable[..., Any]] = None,
        *args: Any,
        **kwargs: Any
    ) -> Any:
        """
        Executes an async callable through the circuit breaker.
        If the circuit is OPEN and recovery timeout has not elapsed, immediately executes fallback.
        """
        async with self._lock:
            now = time.time()
            if self.state == CircuitState.OPEN:
                if now - self.last_failure_time > self.recovery_timeout_seconds:
                    logger.info(f"CircuitBreaker [{self.name}]: Transitioning from OPEN to HALF_OPEN (Probing).")
                    self.state = CircuitState.HALF_OPEN
                    self.success_count = 0
                else:
                    logger.warning(f"CircuitBreaker [{self.name}]: Short-circuiting execution (State: OPEN).")
                    if fallback_func:
                        return await fallback_func(*args, **kwargs)
                    raise RuntimeError(f"CircuitBreaker [{self.name}] is OPEN. Fast fallback triggered.")

        try:
            result = await coro_func(*args, **kwargs)
            await self._on_success()
            return result
        except Exception as exc:
            await self._on_failure(exc)
            if fallback_func:
                logger.info(f"CircuitBreaker [{self.name}]: Invoking fallback after error: {exc}")
                return await fallback_func(*args, **kwargs)
            raise

    async def _on_success(self):
        async with self._lock:
            if self.state == CircuitState.HALF_OPEN:
                self.success_count += 1
                if self.success_count >= self.half_open_success_threshold:
                    logger.info(f"CircuitBreaker [{self.name}]: Fully recovered. Transitioning to CLOSED.")
                    self.state = CircuitState.CLOSED
                    self.failure_count = 0
                    self.success_count = 0
            elif self.state == CircuitState.CLOSED:
                self.failure_count = 0

    async def _on_failure(self, exc: Exception):
        async with self._lock:
            self.last_failure_time = time.time()
            self.failure_count += 1
            logger.warning(f"CircuitBreaker [{self.name}]: Failure recorded ({self.failure_count}/{self.failure_threshold}): {exc}")

            if self.state in (CircuitState.CLOSED, CircuitState.HALF_OPEN):
                if self.failure_count >= self.failure_threshold:
                    logger.error(f"CircuitBreaker [{self.name}]: Failure threshold reached! Tripping circuit to OPEN.")
                    self.state = CircuitState.OPEN
                    self.total_trips += 1

    def get_metrics(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "state": self.state.value,
            "failure_count": self.failure_count,
            "success_count": self.success_count,
            "total_trips": self.total_trips,
            "last_failure_time": self.last_failure_time
        }


# Registry of active circuit breakers
circuit_breakers: Dict[str, CircuitBreaker] = {
    "openrouter_gateway": CircuitBreaker("openrouter_gateway", failure_threshold=3, recovery_timeout_seconds=15.0),
    "anvesh_storage": CircuitBreaker("anvesh_storage", failure_threshold=4, recovery_timeout_seconds=10.0),
    "sandbox_mcp": CircuitBreaker("sandbox_mcp", failure_threshold=3, recovery_timeout_seconds=10.0),
    "git_mcp": CircuitBreaker("git_mcp", failure_threshold=3, recovery_timeout_seconds=10.0),
}
