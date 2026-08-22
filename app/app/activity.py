"""Privacy-safe local activity owned by the app rather than agent configuration."""

import json
import threading
import uuid
from datetime import datetime, timedelta, timezone
from statistics import median

from fastapi import APIRouter, Query

from .config import ACTIVITY_FILE
from .preferences import get_preferences


ALLOWED_FIELDS = (
    "timestamp", "traceId", "providerId", "model", "route", "method", "status",
    "latencyMs", "inputTokens", "outputTokens", "totalTokens", "errorCategory",
)
_lock = threading.Lock()
MAX_EVENTS = 1000
router = APIRouter()


def _now():
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _clean_event(event):
    clean = {key: event.get(key) for key in ALLOWED_FIELDS}
    clean["timestamp"] = clean["timestamp"] or _now()
    clean["traceId"] = clean["traceId"] or uuid.uuid4().hex
    return clean


def _read_events():
    try:
        lines = ACTIVITY_FILE.read_text(encoding="utf-8").splitlines()
    except OSError:
        return []
    events = []
    for line in lines:
        try:
            value = json.loads(line)
        except ValueError:
            continue
        if isinstance(value, dict):
            events.append(_clean_event(value))
    return events


def _write_events(events):
    temporary = ACTIVITY_FILE.with_suffix(ACTIVITY_FILE.suffix + ".tmp")
    temporary.write_text(
        "".join(json.dumps(event, ensure_ascii=False, separators=(",", ":")) + "\n" for event in events),
        encoding="utf-8",
    )
    temporary.replace(ACTIVITY_FILE)


def record_event(event):
    with _lock:
        _write_events(_retained(_read_events() + [_clean_event(event)]))


def list_events(days, limit):
    retained = _read_events()
    if days > 0:
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        retained = [event for event in retained if _event_time(event) >= cutoff]
    return list(reversed(retained[-limit:]))


def _event_time(event):
    try:
        return datetime.fromisoformat(event["timestamp"].replace("Z", "+00:00"))
    except (AttributeError, TypeError, ValueError):
        return datetime.min.replace(tzinfo=timezone.utc)


def _retained(events):
    days = get_preferences()["activityRetentionDays"]
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    return [event for event in events if _event_time(event) >= cutoff][-MAX_EVENTS:]


def summary(days):
    events = list_events(days, MAX_EVENTS)
    failed = sum(1 for event in events if isinstance(event["status"], int) and event["status"] >= 400)
    latencies = [event["latencyMs"] for event in events if isinstance(event["latencyMs"], (int, float)) and not isinstance(event["latencyMs"], bool)]
    return {
        "requestCount": len(events),
        "failedRequestCount": failed,
        "successRate": round((len(events) - failed) / len(events) * 100) if events else 0,
        "medianLatencyMs": median(latencies) if latencies else None,
    }


@router.get("/api/activity")
def read_activity(days: int = Query(30, ge=0, le=365), limit: int = Query(100, ge=1, le=MAX_EVENTS)):
    return list_events(days, limit)


@router.get("/api/activity/summary")
def read_summary(days: int = Query(30, ge=0, le=365)):
    return summary(days)
