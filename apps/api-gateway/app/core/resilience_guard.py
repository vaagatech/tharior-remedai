"""
System Resilience, Memory Guard & Multimodal Scratchpad Manager.
Enforces real-time OS-level memory fences, proactive garbage collection reserves,
and isolated file scratchpads with zero-disk-leak guarantees.
"""

import os
import gc
import psutil
import resource
import tempfile
import shutil
import base64
import asyncio
import logging
from contextlib import asynccontextmanager
from typing import List, Dict, Any, Optional

logger = logging.getLogger("resource_guard")


class SystemResourceGuard:
    """
    Monitors RSS memory, prevents memory leaks in long-running pods,
    and manages proactive garbage collection reserves.
    """

    def __init__(self, max_memory_mb: int = 300, gc_reserve_ratio: float = 0.25):
        self.max_memory_mb = max_memory_mb
        self.max_memory_bytes = max_memory_mb * 1024 * 1024
        self.reserve_bytes = self.max_memory_bytes * gc_reserve_ratio  # 25% reserve headroom
        self.process = psutil.Process(os.getpid())
        self._watcher_task: Optional[asyncio.Task] = None
        self._apply_os_limits()

    def calculate_adaptive_chunk_size(self, default_chunk_size: int = 100, item_size_bytes: int = 1024) -> int:
        """
        Dynamically calculates safe batch chunk size based on real-time memory & CPU load.
        If system memory exceeds 75%, chunk size is reduced to protect GC headroom.
        """
        metrics = self.get_metrics()
        usage_pct = metrics.get("usage_percent", 0.0)

        # Scale down chunk size if individual items are large or if memory usage is elevated
        size_factor = 1.0
        if item_size_bytes > 500_000:  # > 500KB per item
            size_factor = 0.2
        elif item_size_bytes > 100_000:  # > 100KB per item
            size_factor = 0.5

        if usage_pct >= 75.0:
            # Under high load: drop chunk size to 25% and trigger proactive GC
            self.collect()
            return max(1, int(default_chunk_size * 0.25 * size_factor))
        elif usage_pct >= 60.0:
            # Under moderate load: drop chunk size to 50%
            return max(1, int(default_chunk_size * 0.50 * size_factor))

        return max(1, int(default_chunk_size * size_factor))

    def _apply_os_limits(self):
        """Attempts to set OS-level address space limit (RLIMIT_AS)."""
        try:
            limit = self.max_memory_bytes
            if hasattr(resource, 'RLIMIT_AS'):
                resource.setrlimit(resource.RLIMIT_AS, (limit, limit))
        except (ValueError, OSError, AttributeError):
            pass

    def check_headroom(self) -> bool:
        """
        Verifies that current RSS memory remains within safe operational limits.
        Triggers generational garbage collection if headroom dips below the reserve ratio.
        """
        try:
            current_rss = self.process.memory_info().rss
        except Exception:
            current_rss = 0

        headroom = self.max_memory_bytes - current_rss
        if headroom < self.reserve_bytes:
            # Multi-generational garbage collection
            gc.collect(0)
            gc.collect(1)
            gc.collect(2)
            try:
                current_rss = self.process.memory_info().rss
            except Exception:
                pass
            return (self.max_memory_bytes - current_rss) >= self.reserve_bytes
        return True

    def get_metrics(self) -> Dict[str, Any]:
        """Returns real-time memory metrics for telemetry & dashboard."""
        try:
            rss = self.process.memory_info().rss
            vms = self.process.memory_info().vms
            cpu_pct = self.process.cpu_percent(interval=None)
        except Exception:
            rss = 0
            vms = 0
            cpu_pct = 0.0

        rss_mb = round(rss / (1024 * 1024), 2)
        headroom_mb = round(max(0.0, (self.max_memory_bytes - rss) / (1024 * 1024)), 2)
        usage_pct = min(100.0, round((rss / self.max_memory_bytes) * 100, 1)) if self.max_memory_bytes > 0 else 0.0

        return {
            "rss_bytes": rss,
            "rss_mb": rss_mb,
            "vms_mb": round(vms / (1024 * 1024), 2),
            "max_memory_mb": self.max_memory_mb,
            "headroom_mb": headroom_mb,
            "reserve_mb": round(self.reserve_bytes / (1024 * 1024), 2),
            "usage_percent": usage_pct,
            "cpu_percent": cpu_pct,
            "headroom_healthy": (self.max_memory_bytes - rss) >= self.reserve_bytes,
        }

    def collect(self):
        """Forces immediate 3-generation garbage collection."""
        gc.collect(0)
        gc.collect(1)
        gc.collect(2)

    async def start_background_leak_watcher(self, interval_seconds: float = 30.0):
        """
        Background task running for the lifetime of the application.
        Proactively monitors RSS and frees unused cyclic references before pod threshold breaches.
        """
        while True:
            try:
                await asyncio.sleep(interval_seconds)
                metrics = self.get_metrics()
                if metrics["usage_percent"] >= 75.0:
                    logger.warning(
                        f"Memory Watcher: High RSS ({metrics['rss_mb']}MB / {metrics['max_memory_mb']}MB - {metrics['usage_percent']}%). "
                        "Triggering proactive generational GC."
                    )
                    self.collect()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.debug(f"Memory watcher tick exception: {e}")


# Singleton instance shared across the application
resource_guard = SystemResourceGuard(max_memory_mb=300, gc_reserve_ratio=0.25)


class EphemeralAttachmentManager:
    """Manages temporary storage for attachments with automated cleanup and zero disk leaks."""

    @staticmethod
    @asynccontextmanager
    async def get_isolated_scratchpad():
        """Creates an ephemeral isolated scratch directory and guarantees cleanup."""
        temp_dir = tempfile.mkdtemp(prefix="tharior_scratch_")
        try:
            yield temp_dir
        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)
            resource_guard.collect()

    @classmethod
    async def process_attachments(cls, attachments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Extracts multimodal context (images, logs, stack traces) safely within
        the ephemeral scratchpad without leaking file handles or storage.
        """
        extracted = []
        if not attachments:
            return extracted

        async with cls.get_isolated_scratchpad() as scratch_dir:
            for att in attachments:
                raw_bytes = att.get("bytes")
                if isinstance(raw_bytes, str):
                    try:
                        raw_bytes = base64.b64decode(raw_bytes)
                    except Exception:
                        raw_bytes = raw_bytes.encode('utf-8')
                elif raw_bytes is None and "content" in att:
                    raw_bytes = att["content"].encode('utf-8') if isinstance(att["content"], str) else att["content"]

                if not raw_bytes:
                    continue

                c_type = att.get("content_type", "application/octet-stream")
                filename = att.get("filename", f"attachment_{len(extracted)}")

                file_path = os.path.join(scratch_dir, filename)
                with open(file_path, "wb") as f:
                    f.write(raw_bytes)

                if c_type.startswith("image/"):
                    b64 = base64.b64encode(raw_bytes).decode("utf-8")
                    extracted.append({
                        "type": "image_url",
                        "filename": filename,
                        "content_type": c_type,
                        "image_url": {"url": f"data:{c_type};base64,{b64}"}
                    })
                elif c_type in ["text/plain", "application/json", "text/x-log", "application/x-yaml", "text/csv"]:
                    text_content = raw_bytes.decode('utf-8', errors='ignore')[:4000]
                    extracted.append({
                        "type": "text",
                        "filename": filename,
                        "content_type": c_type,
                        "text": f"--- Attachment: {filename} ---\n{text_content}"
                    })
                else:
                    extracted.append({
                        "type": "binary_meta",
                        "filename": filename,
                        "content_type": c_type,
                        "size_bytes": len(raw_bytes),
                        "text": f"--- Binary Attachment: {filename} ({c_type}, {len(raw_bytes)} bytes) ---"
                    })

        return extracted
