"""
Multimodal Context Processing Service.
Handles OCR extraction, stack trace parsing, error screenshot decoders,
and binary log analysis via zero-disk-leak streaming scratchpads.
"""

import re
from typing import List, Dict, Any
from app.core.resilience_guard import EphemeralAttachmentManager


class MultimodalProcessor:
    """Extracts structured diagnostic signals from images, logs, and traces."""

    @staticmethod
    async def process_incoming_attachments(attachments: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Runs attachments through the ephemeral scratchpad with guaranteed cleanup.
        Extracts stack traces, HTTP error codes, and screenshot summaries.
        """
        extracted = await EphemeralAttachmentManager.process_attachments(attachments)
        
        stack_traces = []
        http_errors = []
        image_attachments = []

        for item in extracted:
            if item.get("type") == "text":
                text = item.get("text", "")
                # Regex for Traceback patterns
                if "Traceback (most recent call last):" in text or "Error:" in text:
                    stack_traces.append(text)
                # Regex for HTTP status codes
                codes = re.findall(r"\b(?:HTTP|status|code)\s*[:=]?\s*([45]\d{2})\b", text, re.IGNORECASE)
                http_errors.extend(codes)
            elif item.get("type") == "image_url":
                image_attachments.append(item.get("filename", "screenshot.png"))

        return {
            "processed_items": len(extracted),
            "stack_traces_found": len(stack_traces),
            "detected_http_errors": list(set(http_errors)),
            "images_extracted": image_attachments,
            "raw_extracted": extracted
        }
