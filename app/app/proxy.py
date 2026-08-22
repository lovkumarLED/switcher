"""OpenAI-compatible proxy: forwards /v1/* requests to the active provider."""

import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse, Response, StreamingResponse

from . import activity, agentstore

router = APIRouter()

_BASE_URL_RE = re.compile(r"^https?://[^\s/$.?#].[^\s]*$", re.IGNORECASE)
_PATH_SAFE_RE = re.compile(r"^[A-Za-z0-9._~/-]*$")


class _NoRedirectHandler(urllib.request.HTTPRedirectHandler):
    """Never follow upstream redirects: a redirect must not re-point the
    bearer token at an arbitrary host (SSRF-via-redirect)."""

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


_OPENER = urllib.request.build_opener(_NoRedirectHandler)


def _model_from_body(body):
    try:
        value = json.loads(body.decode("utf-8"))
    except (AttributeError, UnicodeDecodeError, ValueError):
        return None
    return value.get("model") if isinstance(value, dict) and isinstance(value.get("model"), str) else None


def _is_streaming_request(body):
    try:
        value = json.loads(body.decode("utf-8"))
    except (AttributeError, UnicodeDecodeError, ValueError):
        return False
    return isinstance(value, dict) and value.get("stream") is True


def _usage_from_json(payload):
    values = {"inputTokens": None, "outputTokens": None, "totalTokens": None}
    try:
        usage = json.loads(payload.decode("utf-8")).get("usage")
    except (AttributeError, UnicodeDecodeError, ValueError):
        return values
    if not isinstance(usage, dict):
        return values
    for source, target in (("prompt_tokens", "inputTokens"), ("completion_tokens", "outputTokens"), ("total_tokens", "totalTokens")):
        value = usage.get(source)
        if isinstance(value, (int, float)) and not isinstance(value, bool):
            values[target] = value
    return values


def _record(**values):
    try:
        activity.record_event(values)
    except Exception:
        pass


@router.api_route("/v1/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy(path: str, request: Request):
    try:
        agent_dir = agentstore.require_agent_dir()
    except HTTPException as exc:
        return JSONResponse({"error": {"message": str(exc.detail)}}, status_code=exc.status_code)
    provider = agentstore.active_provider(agent_dir)
    if not provider:
        return JSONResponse(
            {"error": {"message": "No active provider. Add one and click 'Switch to this' first."}},
            status_code=503,
        )
    base_url = (provider.get("baseUrl") or "").rstrip("/")
    if not base_url:
        return JSONResponse(
            {"error": {"message": "The active provider has no base URL."}},
            status_code=500,
        )
    if not _BASE_URL_RE.match(base_url) or "@" in base_url:
        return JSONResponse(
            {"error": {"message": "The active provider has an invalid base URL."}},
            status_code=500,
        )
    if not _PATH_SAFE_RE.match(path) or "/../" in f"/{path}/":
        return JSONResponse(
            {"error": {"message": "Invalid path."}},
            status_code=400,
        )
    target = base_url + "/" + path
    if request.url.query:
        target += "?" + request.url.query
    body = await request.body()
    headers = {
        "Authorization": "Bearer " + provider.get("apiKey", ""),
        "Content-Type": request.headers.get("content-type", "application/json"),
    }
    upstream = urllib.request.Request(
        target,
        data=body or None,
        method=request.method,
        headers=headers,
    )
    started = time.monotonic()
    metadata = {
        "providerId": provider.get("id"),
        "model": _model_from_body(body),
        "route": "/" + path,
        "method": request.method,
    }

    def record_attempt(status, error_category=None, **usage):
        _record(
            **metadata,
            status=status,
            latencyMs=round((time.monotonic() - started) * 1000),
            inputTokens=usage.get("inputTokens"),
            outputTokens=usage.get("outputTokens"),
            totalTokens=usage.get("totalTokens"),
            errorCategory=error_category,
        )

    try:
        response = _OPENER.open(upstream, timeout=120)
    except urllib.error.HTTPError as error:
        record_attempt(error.code, "upstream_http_error")
        try:
            detail = error.read().decode("utf-8", "replace")
        except OSError:
            detail = ""
        finally:
            try:
                error.close()
            except Exception:
                pass
        return Response(content=detail, status_code=error.code, media_type="application/json")
    except (urllib.error.URLError, OSError) as error:
        record_attempt(502, "upstream_unreachable")
        reason = getattr(error, "reason", str(error))
        return JSONResponse(
            {"error": {"message": f"Couldn't reach the active provider: {reason}"}},
            status_code=502,
        )

    content_type = response.headers.get("content-type", "application/json")

    if _is_streaming_request(body):
        record_attempt(response.status)

        def chunks():
            try:
                while True:
                    part = response.read(8192)
                    if not part:
                        break
                    yield part
            finally:
                response.close()

        return StreamingResponse(chunks(), media_type=content_type)

    payload = response.read()
    response.close()
    record_attempt(response.status, **_usage_from_json(payload))
    return Response(content=payload, status_code=response.status, media_type=content_type)
