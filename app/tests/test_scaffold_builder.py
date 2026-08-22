"""Integration regression: scaffolding a custom-named kilo-type agent must use K1."""

import json
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

ENGINE = Path(__file__).resolve().parent.parent / "engine"
SCAFFOLD = ENGINE / "scaffold-agent.ps1"


class ScaffoldBuilderTypeTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name) / "kilo-custom"
        self.root.mkdir()

    def _scaffold(self, name):
        return subprocess.run(
            ["powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass",
             "-File", str(SCAFFOLD), "-Agent", name, "-ConfigRoot", str(self.root),
             "-NonInteractive", "-Bootstrap"],
            capture_output=True, text=True, timeout=240,
            cwd=str(ENGINE),
        )

    def _seed_main(self):
        (self.root / "kilo.json").write_text(
            json.dumps({"provider": {"px": {"name": "PX", "apiKey": "sk-test-fake-key-000000"}}}),
            encoding="utf-8",
        )

    def test_custom_named_kilo_agent_gets_k1_builder(self):
        """Catches kilo-type agents with custom names receiving the OpenCode V2.7 builder."""
        self._seed_main()
        result = self._scaffold("kilo-custom")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        generated = (self.root / "scripts" / "build-kilo-custom.ps1").read_text(encoding="utf-8-sig")
        self.assertIn("kilo.json", generated)
        self.assertNotIn('$TargetArtifact = "opencode.json"', generated)
        self.assertIn("K1", generated)

    def test_custom_named_opencode_agent_gets_v27_builder(self):
        (self.root / "kilo.json").unlink(missing_ok=True)
        (self.root / "customcode.json").write_text(json.dumps({"provider": {}}), encoding="utf-8")
        result = self._scaffold("customcode")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        generated = (self.root / "scripts" / "build-customcode.ps1").read_text(encoding="utf-8-sig")
        self.assertIn('BuilderVersion = "2.7"', generated)


if __name__ == "__main__":
    unittest.main()
