"""
Reactive Event Bus & WebSocket Broadcast Hub.
Publishes real-time execution traces, clarification events, and pod telemetry.
"""

import asyncio
import json
from typing import Dict, Any, Set, List
from fastapi import WebSocket


class ReactiveEventBus:
    """Non-blocking event broadcaster for real-time dashboard updates."""

    def __init__(self):
        self._active_connections: Set[WebSocket] = set()
        self._recent_events: List[Dict[str, Any]] = []
        self._max_history = 100
        self._lock = asyncio.Lock()

    async def register(self, websocket: WebSocket):
        """Registers a connected WebSocket client."""
        await websocket.accept()
        async with self._lock:
            self._active_connections.add(websocket)
            # Replay recent events on connect for fast state hydration
            for event in self._recent_events[-20:]:
                try:
                    await websocket.send_text(json.dumps(event))
                except Exception:
                    pass

    async def unregister(self, websocket: WebSocket):
        """Removes a disconnected client."""
        async with self._lock:
            self._active_connections.discard(websocket)

    async def publish(self, event_type: str, data: Dict[str, Any]):
        """Broadcasts an event asynchronously to all active dashboard listeners."""
        event_payload = {
            "type": event_type,
            "data": data
        }

        async with self._lock:
            self._recent_events.append(event_payload)
            if len(self._recent_events) > self._max_history:
                self._recent_events.pop(0)

            dead_connections = set()
            for ws in self._active_connections:
                try:
                    await ws.send_text(json.dumps(event_payload))
                except Exception:
                    dead_connections.add(ws)

            for dead in dead_connections:
                self._active_connections.discard(dead)

    def get_recent_events(self) -> List[Dict[str, Any]]:
        """Returns the circular buffer of recent events."""
        return list(self._recent_events)


# Global event bus singleton
event_bus = ReactiveEventBus()
