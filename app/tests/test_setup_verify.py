"""Regression tests for the post-setup verification endpoint."""

import json
import tempfile
import unittest
from pathlib import Path

from fastapi import HTTPException


class SetupVerifyTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.agent_dir = Path(self.tmp.name)
        (self.agent_dir / "profiles" / "coding").mkdir(parents=True)
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

    def _register_active(self, active):
        from app.storage import set_state

        set_state(agents=[{"name": "agent-x", "dir": str(self.agent_dir)}], activeAgent="agent-x")

    def _write_provider(self, pid, url):
        from app import agentstore

        agentstore.write_provider(
            self.agent_dir, pid, pid.title(), url, "sk-test-fake-key-000000",
            "@ai-sdk/openai-compatible", "none",
        )

    def _set_main(self, ids):
        (self.agent_dir / "agentx.json").write_text(
            json.dumps({"provider": {pid: {"name": pid} for pid in ids}}), encoding="utf-8"
        )
        (self.agent_dir / "profiles" / "coding" / "mcp.json").write_text(
            json.dumps({"mcp": {"local": {"type": "local"}}}), encoding="utf-8"
        )
        (self.agent_dir / "profiles" / "coding" / "plugins.json").write_text(
            json.dumps({"plugin": ["demo"]}), encoding="utf-8"
        )

    def _verify(self):
        from app.engine import verify_setup

        return verify_setup(__import__("app.engine", fromlist=["VerifyBody"]).VerifyBody())

    def test_inactive_provider_does_not_block_verification(self):
        """Catches verification comparing every provider file instead of the active set."""
        from app.storage import set_state

        set_state(
            agents=[{"name": "agent-x", "dir": str(self.agent_dir)}],
            activeAgent="agent-x",
            activeProfile="coding",
        )
        # 'live' is active and reachable-ish; 'dormant' stays inactive and unreachable.
        self._write_provider("live", "http://127.0.0.1:9/v1")
        self._write_provider("dormant", "http://127.0.0.1:9/v1")
        settings_path = self.agent_dir / "profiles" / "coding" / "settings.json"
        settings_path.write_text(json.dumps({"activeProviders": ["live"]}), encoding="utf-8")
        self._set_main(["live"])

        result = self._verify()
        self.assertTrue(result["mainJson"]["ok"], result)
        tested = {p["id"] for p in result["providers"]}
        self.assertEqual(tested, {"live"})

    def test_verify_requires_agent(self):
        with self.assertRaises(HTTPException) as context:
            self._verify()
        self.assertEqual(context.exception.status_code, 400)


if __name__ == "__main__":
    unittest.main()
