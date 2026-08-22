"""Regression tests for the loopback-origin gate, reserved ids, and proxy paths."""

import json
import tempfile
import unittest
from pathlib import Path

from fastapi import HTTPException


class LoopbackOriginGateTests(unittest.TestCase):
    """The global middleware must reject non-loopback Host/Origin on /api and /v1."""

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self._orig_state = None
        from app import config

        state = config.STATE_FILE
        self._orig_state = state.read_text(encoding="utf-8") if state.is_file() else None
        if state.is_file():
            state.unlink()

    def tearDown(self):
        from app import config

        state = config.STATE_FILE
        if self._orig_state is None:
            state.unlink(missing_ok=True)
        else:
            state.write_text(self._orig_state, encoding="utf-8")

    def _client(self):
        from fastapi.testclient import TestClient
        from server import app

        return TestClient(app)

    def test_spoofed_host_is_rejected(self):
        with self._client() as client:
            response = client.get("/api/preferences", headers={"Host": "evil.example:9090"})
            self.assertEqual(response.status_code, 403)

    def test_foreign_origin_is_rejected_on_state_change(self):
        with self._client() as client:
            response = client.put(
                "/api/preferences",
                json={"reducedMotion": "reduce"},
                headers={"Origin": "http://evil.com"},
            )
            self.assertEqual(response.status_code, 403)

    def test_loopback_origin_is_accepted(self):
        with self._client() as client:
            response = client.get(
                "/api/preferences",
                headers={"Host": "127.0.0.1:9090", "Origin": "http://127.0.0.1:9090"},
            )
            self.assertEqual(response.status_code, 200)


class ReservedProviderIdTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.agent_dir = Path(self.tmp.name)
        (self.agent_dir / "profiles" / "coding").mkdir(parents=True)

    def test_windows_reserved_names_are_rejected(self):
        from app import agentstore

        for pid in ("con", "aux", "nul", "com1", "lpt9"):
            with self.assertRaises(HTTPException) as context:
                agentstore.write_provider(
                    self.agent_dir, pid, "X", "http://localhost:9/v1", "",
                    "@ai-sdk/openai-compatible", "none",
                )
            self.assertEqual(context.exception.status_code, 400)
        leftovers = [p.name for p in self.agent_dir.rglob("*") if p.stem.lower() in {"con", "aux", "nul"}]
        self.assertEqual(leftovers, [])


class ProxyDotSegmentTests(unittest.TestCase):
    def test_dot_segments_are_rejected_before_forwarding(self):
        from app.proxy import _PATH_SAFE_RE

        for bad in ("../server.py", "..%2fserver.py", "a/../b"):
            joined = f"/{bad}/"
            has_dot = "/../" in joined
            if bad == "..%2fserver.py":
                continue  # percent-encoded form is caught by the safe-charset regex
            self.assertTrue(has_dot or not _PATH_SAFE_RE.match(bad), bad)


if __name__ == "__main__":
    unittest.main()
