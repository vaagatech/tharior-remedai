"""
Unit & Integration Tests for Background Repository Lint & SAST Watcher.
"""

import pytest
from app.services.background_sast_watcher import BackgroundSASTWatcher, sast_watcher


@pytest.mark.asyncio
async def test_sast_repository_scan():
    watcher = BackgroundSASTWatcher()
    report = await watcher.scan_repository("org/payments-service", tenant_id="tenant-security")
    assert report.scan_id.startswith("scan_")
    assert report.repo_name == "org/payments-service"
    assert report.findings_count > 0
    assert len(report.findings) > 0
    assert report.findings[0].severity in ("CRITICAL", "HIGH", "MEDIUM", "LOW")


def test_sast_list_scans():
    scans = sast_watcher.list_scans()
    assert len(scans) > 0
    assert scans[0].files_scanned > 0
