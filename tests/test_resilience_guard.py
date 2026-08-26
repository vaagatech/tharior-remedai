"""
Tests for SystemResourceGuard and EphemeralAttachmentManager.
"""

import pytest
import os
from app.core.resilience_guard import SystemResourceGuard, EphemeralAttachmentManager


def test_system_resource_guard_initialization():
    guard = SystemResourceGuard(max_memory_mb=256, gc_reserve_ratio=0.20)
    assert guard.max_memory_mb == 256
    assert guard.max_memory_bytes == 256 * 1024 * 1024
    assert guard.reserve_bytes == guard.max_memory_bytes * 0.20
    
    metrics = guard.get_metrics()
    assert "rss_mb" in metrics
    assert "headroom_mb" in metrics
    assert "usage_percent" in metrics
    assert metrics["max_memory_mb"] == 256


def test_system_resource_guard_check_headroom():
    guard = SystemResourceGuard(max_memory_mb=500, gc_reserve_ratio=0.10)
    headroom_ok = guard.check_headroom()
    assert isinstance(headroom_ok, bool)


@pytest.mark.asyncio
async def test_ephemeral_scratchpad_cleanup():
    created_dir = None
    async with EphemeralAttachmentManager.get_isolated_scratchpad() as scratch_dir:
        created_dir = scratch_dir
        assert os.path.exists(created_dir)
        # Create a test file in the scratchpad
        test_file = os.path.join(scratch_dir, "temp_log.txt")
        with open(test_file, "w") as f:
            f.write("temporary log data")
        assert os.path.exists(test_file)

    # After exit, directory must be wiped completely
    assert not os.path.exists(created_dir)


@pytest.mark.asyncio
async def test_process_attachments_multimodal():
    attachments = [
        {
            "filename": "error.log",
            "content_type": "text/plain",
            "bytes": "Traceback (most recent call last):\n  File 'main.py', line 10\nHTTP 500 Internal Server Error".encode('utf-8')
        },
        {
            "filename": "screenshot.png",
            "content_type": "image/png",
            "bytes": b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01"
        }
    ]

    extracted = await EphemeralAttachmentManager.process_attachments(attachments)
    assert len(extracted) == 2
    assert extracted[0]["type"] == "text"
    assert "Attachment: error.log" in extracted[0]["text"]
    assert extracted[1]["type"] == "image_url"
    assert "data:image/png;base64," in extracted[1]["image_url"]["url"]


def test_adaptive_chunk_size_and_gc_reserve():
    """Validates 75% memory limits and dynamic chunk size reduction under load."""
    guard = SystemResourceGuard(max_memory_mb=300, gc_reserve_ratio=0.25)
    assert guard.reserve_bytes == 300 * 1024 * 1024 * 0.25

    # Standard chunk
    normal_chunk = guard.calculate_adaptive_chunk_size(default_chunk_size=100, item_size_bytes=1000)
    assert normal_chunk > 0

    # Huge item size (>500KB) scales down chunk size
    huge_item_chunk = guard.calculate_adaptive_chunk_size(default_chunk_size=100, item_size_bytes=600_000)
    assert huge_item_chunk <= 20

