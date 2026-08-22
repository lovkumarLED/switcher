"""Behavior tests for privacy-safe local proxy activity."""

import json
import tempfile
import threading
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

try:
    from app import activity
except ImportError:
    activity = None


class ActivityTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.original_path = getattr(activity, "ACTIVITY_FILE", None)
        if activity:
            activity.ACTIVITY_FILE = Path(self.tmp.name) / "activity.jsonl"

    def tearDown(self):
        if activity and self.original_path is not None:
            activity.ACTIVITY_FILE = self.original_path

    def test_activity_module_exposes_the_public_recording_contract(self):
        """Catches a missing local activity contract before the proxy depends on it."""
        self.assertIsNotNone(activity, "app.activity must exist")
        for name in ("record_event", "list_events", "summary"):
            self.assertTrue(callable(getattr(activity, name, None)), f"app.activity must provide {name}")

    def test_recording_keeps_only_the_fixed_metadata_schema(self):
        """Catches a persistence change that writes request content, keys, or unknown fields."""
        self.assertIsNotNone(getattr(activity, "ACTIVITY_FILE", None), "activity storage needs an app-owned path")
        timestamp = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
        activity.record_event({
            "timestamp": timestamp,
            "traceId": "trace-1",
            "providerId": "provider-1",
            "route": "/chat/completions",
            "method": "POST",
            "status": 200,
            "latencyMs": 12,
            "prompt": "private prompt content",
            "apiKey": "sk-secret",
            "Authorization": "Bearer sk-secret",
        })
        events = activity.list_events(30, 10)
        self.assertEqual(len(events), 1)
        event = events[0]
        self.assertEqual(
            set(event),
            {
                "timestamp", "traceId", "providerId", "model", "route", "method", "status",
                "latencyMs", "inputTokens", "outputTokens", "totalTokens", "errorCategory",
            },
        )
        self.assertEqual(event["providerId"], "provider-1")
        self.assertEqual(event["model"], None)
        self.assertEqual(event["totalTokens"], None)
        persisted = activity.ACTIVITY_FILE.read_text(encoding="utf-8")
        for forbidden in ("private prompt content", "sk-secret", "Authorization", "apiKey"):
            self.assertNotIn(forbidden, persisted)

    def test_recording_prunes_expired_and_overflow_records(self):
        """Catches unbounded disk growth or retention being ignored when records are written."""
        original_limit = getattr(activity, "MAX_EVENTS", None)
        original_preferences = getattr(activity, "get_preferences", None)
        activity.MAX_EVENTS = 2
        activity.get_preferences = lambda: {"activityRetentionDays": 1}
        if original_limit is None:
            self.addCleanup(delattr, activity, "MAX_EVENTS")
        else:
            self.addCleanup(setattr, activity, "MAX_EVENTS", original_limit)
        if original_preferences is None:
            self.addCleanup(delattr, activity, "get_preferences")
        else:
            self.addCleanup(setattr, activity, "get_preferences", original_preferences)
        now = datetime.now(timezone.utc)
        for trace_id, age in (("expired", 2), ("kept-1", 0), ("kept-2", 0), ("overflow", 0)):
            activity.record_event({
                "timestamp": (now - timedelta(days=age)).isoformat().replace("+00:00", "Z"),
                "traceId": trace_id,
                "providerId": "p",
                "status": 200,
            })
        events = activity.list_events(365, 10)
        self.assertEqual([event["traceId"] for event in events], ["overflow", "kept-2"])
        self.assertEqual(len(activity.ACTIVITY_FILE.read_text(encoding="utf-8").splitlines()), 2)

    def test_summary_recovers_from_corrupt_lines_and_reports_request_metrics(self):
        """Catches analytics failures from one bad line or incorrect request metric aggregation."""
        activity.ACTIVITY_FILE.write_text("not-json\n", encoding="utf-8")
        for trace_id, status, latency in (("one", 200, 10), ("two", 200, 20), ("three", 502, 30)):
            activity.record_event({
                "traceId": trace_id,
                "providerId": "p",
                "status": status,
                "latencyMs": latency,
            })
        report = activity.summary(30)
        self.assertEqual(report.get("requestCount"), 3)
        self.assertEqual(report.get("failedRequestCount"), 1)
        self.assertEqual(report.get("successRate"), 67)
        self.assertEqual(report.get("medianLatencyMs"), 20)

    def test_concurrent_recording_retains_each_event(self):
        """Catches a read-then-write race that drops one simultaneous proxy event."""
        original_lock = activity._lock
        failures = []

        class CoordinatedLock:
            def __init__(self):
                self._barrier = threading.Barrier(2)
                self._lock = threading.Lock()

            def __enter__(self):
                self._barrier.wait(timeout=5)
                return self._lock.__enter__()

            def __exit__(self, *args):
                return self._lock.__exit__(*args)

        def record(trace_id):
            try:
                activity.record_event({"traceId": trace_id, "providerId": "p", "status": 200})
            except Exception as exc:
                failures.append(exc)

        activity._lock = CoordinatedLock()
        try:
            workers = [threading.Thread(target=record, args=(trace_id,)) for trace_id in ("one", "two")]
            for worker in workers:
                worker.start()
            for worker in workers:
                worker.join(timeout=5)
        finally:
            activity._lock = original_lock

        self.assertFalse(failures)
        self.assertTrue(all(not worker.is_alive() for worker in workers))
        self.assertEqual({event["traceId"] for event in activity.list_events(30, 10)}, {"one", "two"})

    def test_all_time_range_returns_all_retained_events(self):
        """All time includes every event still present in the app-owned activity log."""
        now = datetime.now(timezone.utc).replace(microsecond=0)
        older = (now - timedelta(days=2)).isoformat().replace("+00:00", "Z")
        current = now.isoformat().replace("+00:00", "Z")
        activity.ACTIVITY_FILE.write_text("".join(json.dumps({
            "timestamp": timestamp,
            "traceId": trace_id,
            "providerId": "p",
            "status": 200,
        }) + "\n" for timestamp, trace_id in ((older, "older"), (current, "current"))), encoding="utf-8")

        events = activity.list_events(0, 10)
        self.assertEqual([event["traceId"] for event in events], ["current", "older"])
        self.assertEqual(activity.summary(0)["requestCount"], 2)

    def test_all_time_endpoint_accepts_the_full_retention_limit(self):
        from fastapi import FastAPI
        from fastapi.testclient import TestClient

        server = FastAPI()
        server.include_router(activity.router)
        with TestClient(server) as client:
            response = client.get("/api/activity?days=0&limit=1000")
        self.assertEqual(response.status_code, 200)
    def test_server_exposes_activity_list_and_summary_endpoints(self):
        """Catches an implemented activity module that the GUI cannot reach."""
        from server import app as server_app

        paths = {
            child.path
            for route in server_app.routes
            for child in getattr(getattr(route, "original_router", route), "routes", [route])
            if hasattr(child, "path")
        }
        self.assertTrue({"/api/activity", "/api/activity/summary"}.issubset(paths))


if __name__ == "__main__":
    unittest.main()
