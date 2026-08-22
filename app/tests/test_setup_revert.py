"""Regression tests for the onboarding setup revert endpoint."""

import json
import tempfile
import unittest
from pathlib import Path

from fastapi import HTTPException


class SetupRevertTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.agent_dir = Path(self.tmp.name)
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

    def _register(self, name):
        from app.storage import set_state

        set_state(agents=[{"name": name, "dir": str(self.agent_dir)}], activeAgent=name)

    def _seed_main_and_backup(self, stem, custom_agent_name):
        main = self.agent_dir / f"{stem}.json"
        main.write_text(json.dumps({"provider": {"p1": {"name": "P1"}}}), encoding="utf-8")
        backup_dir = self.agent_dir / "backup"
        backup_dir.mkdir(exist_ok=True)
        backup = backup_dir / f"{stem}_2026-08-22_00-00-00.json"
        backup.write_text(json.dumps({"provider": {}}), encoding="utf-8")
        self._register(custom_agent_name)

    def _revert(self):
        from app.engine import revert_setup

        return revert_setup(__import__("app.engine", fromlist=["VerifyBody"]).VerifyBody())

    def test_revert_restores_custom_named_agent_from_stem_backup(self):
        """Catches revert matching backups by registered agent name instead of config stem."""
        self._seed_main_and_backup("opencode", "opencode-test")
        result = self._revert()
        self.assertTrue(result["ok"], result)
        restored = json.loads((self.agent_dir / "opencode.json").read_text(encoding="utf-8"))
        self.assertEqual(restored, {"provider": {}})

    def test_revert_restores_standard_named_agent(self):
        self._seed_main_and_backup("kilo", "kilo")
        result = self._revert()
        self.assertTrue(result["ok"], result)
        restored = json.loads((self.agent_dir / "kilo.json").read_text(encoding="utf-8"))
        self.assertEqual(restored, {"provider": {}})

    def test_revert_without_backup_reports_failure_without_writes(self):
        (self.agent_dir / "opencode.json").write_text("{}", encoding="utf-8")
        self._register("opencode-test")
        result = self._revert()
        self.assertFalse(result["ok"])
        self.assertEqual((self.agent_dir / "opencode.json").read_text(encoding="utf-8"), "{}")

    def test_revert_requires_agent(self):
        from app.engine import revert_setup

        with self.assertRaises(HTTPException) as context:
            revert_setup(__import__("app.engine", fromlist=["VerifyBody"]).VerifyBody())
        self.assertEqual(context.exception.status_code, 400)


if __name__ == "__main__":
    unittest.main()
