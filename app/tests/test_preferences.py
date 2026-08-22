"""Behavior tests for app-owned, local runtime preferences."""

import unittest
import json
import tempfile
from pathlib import Path

from fastapi import HTTPException

try:
    from app import preferences
    from app.preferences import get_preferences, update_preferences
except ImportError:
    preferences = None
    get_preferences = update_preferences = None


class PreferencesTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.original_path = preferences.PREFERENCES_FILE if preferences else None
        if preferences:
            preferences.PREFERENCES_FILE = Path(self.tmp.name) / "preferences.json"

    def tearDown(self):
        if preferences:
            preferences.PREFERENCES_FILE = self.original_path

    def test_defaults_are_returned_and_redaction_cannot_be_disabled(self):
        """Catches a missing privacy default or any path that disables redaction."""
        self.assertIsNotNone(get_preferences, "app.preferences must provide get_preferences")
        self.assertEqual(
            get_preferences(),
            {
                "activityRetentionDays": 30,
                "requestContentRedaction": True,
                "reducedMotion": "system",
                "browser": "default",
            },
        )
        with self.assertRaises(HTTPException) as context:
            update_preferences({"requestContentRedaction": False})
        self.assertEqual(context.exception.status_code, 400)

    def test_update_rejects_invalid_retention_and_preserves_existing_unknown_data(self):
        """Catches an invalid retention write or a rewrite that drops future app data."""
        preferences.PREFERENCES_FILE.write_text(
            json.dumps({"futureSetting": {"keep": True}, "activityRetentionDays": 30}),
            encoding="utf-8",
        )
        saved = update_preferences({"activityRetentionDays": 7, "reducedMotion": "reduce"})
        self.assertEqual(saved["activityRetentionDays"], 7)
        self.assertEqual(saved["reducedMotion"], "reduce")
        self.assertEqual(saved["futureSetting"], {"keep": True})
        self.assertEqual(
            json.loads(preferences.PREFERENCES_FILE.read_text(encoding="utf-8"))["futureSetting"],
            {"keep": True},
        )
        for invalid in (0, 366, "not-a-number", True):
            with self.assertRaises(HTTPException):
                update_preferences({"activityRetentionDays": invalid})

    def test_corrupt_or_unsafe_saved_values_recover_to_safe_defaults(self):
        """Catches a broken runtime file or persisted value that weakens redaction."""
        preferences.PREFERENCES_FILE.write_text("{not-json", encoding="utf-8")
        self.assertEqual(get_preferences(), {
            "activityRetentionDays": 30,
            "requestContentRedaction": True,
            "reducedMotion": "system",
            "browser": "default",
        })

        preferences.PREFERENCES_FILE.write_text(
            json.dumps({"requestContentRedaction": False, "reducedMotion": "flash", "futureSetting": "kept"}),
            encoding="utf-8",
        )
        recovered = get_preferences()
        self.assertTrue(recovered["requestContentRedaction"])
        self.assertEqual(recovered["reducedMotion"], "system")
        self.assertEqual(recovered["browser"], "default")
        self.assertEqual(recovered["futureSetting"], "kept")

    def test_update_rejects_an_unknown_browser_preference(self):
        """Catches persistence of a browser value the launcher cannot interpret."""
        for invalid in ("chrome", "", None, True):
            with self.assertRaises(HTTPException) as context:
                update_preferences({"browser": invalid})
            self.assertEqual(context.exception.status_code, 400)

    def test_update_rejects_an_unknown_motion_preference(self):
        """Catches persistence of a value the motion client cannot interpret."""
        with self.assertRaises(HTTPException) as context:
            update_preferences({"reducedMotion": "flash"})
        self.assertEqual(context.exception.status_code, 400)

    def test_server_exposes_preference_read_and_write_endpoints(self):
        """Catches omission of the app's public preference contract from the server."""
        from server import app as server_app

        paths = {
            child.path
            for route in server_app.routes
            for child in getattr(getattr(route, "original_router", route), "routes", [route])
            if hasattr(child, "path")
        }
        self.assertIn("/api/preferences", paths)


if __name__ == "__main__":
    unittest.main()
