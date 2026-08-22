"""Switcher — entry point. Serves the GUI and starts the local server."""

import os
import threading
import webbrowser

import uvicorn
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app import APP_VERSION, config
from app.activity import router as activity_router
from app.agents import router as agents_router
from app.banner import print_banner
from app.capabilities import router as capabilities_router
from app.claude_adapter import router as claude_router
from app.discovery import router as discovery_router
from app.engine import router as engine_router
from app.mcp import router as mcp_router
from app.lsp import router as lsp_router
from app.plugins import router as plugins_router
from app.preferences import router as preferences_router
from app.profiles import router as profiles_router
from app.providers import router as providers_router
from app.proxy import router as proxy_router
from app.serve import router as serve_router
from app.testing import router as testing_router

app = FastAPI(title="Switcher", version=APP_VERSION)


class NoCacheStaticFiles(StaticFiles):
    """Dev app: always revalidate static assets so edited files show up on refresh."""

    def file_response(self, *args, **kwargs):
        response = super().file_response(*args, **kwargs)
        response.headers["Cache-Control"] = "no-cache"
        return response


app.mount("/lib", NoCacheStaticFiles(directory=config.APP_DIR / "lib"), name="lib")
app.mount("/assets", NoCacheStaticFiles(directory=config.APP_DIR / "assets"), name="assets")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(127\.0\.0\.1|localhost)(:\d+)?",
    allow_methods=["*"],
    allow_headers=["*"],
)

_ALLOWED_HOSTS = {f"{config.HOST}:{config.PORT}", f"localhost:{config.PORT}"}
_ALLOWED_ORIGINS = {f"http://{config.HOST}:{config.PORT}", f"http://localhost:{config.PORT}"}


@app.middleware("http")
async def enforce_loopback_origin(request, call_next):
    """DNS-rebinding / cross-site write protection for every API and proxy route.

    Static assets stay open (read-only, no secrets); everything under /api and
    /v1 requires a loopback Host and, when present, a loopback Origin header.
    """
    path = request.url.path
    if path.startswith("/api") or path.startswith("/v1"):
        if request.headers.get("host", "") not in _ALLOWED_HOSTS:
            return JSONResponse({"detail": "Request origin not allowed."}, status_code=403)
        origin = request.headers.get("origin")
        if origin is not None and origin not in _ALLOWED_ORIGINS:
            return JSONResponse({"detail": "Request origin not allowed."}, status_code=403)
    return await call_next(request)

app.include_router(serve_router)
app.include_router(agents_router)
app.include_router(capabilities_router)
app.include_router(claude_router)
app.include_router(discovery_router)
app.include_router(providers_router)
app.include_router(engine_router)
app.include_router(testing_router)
app.include_router(plugins_router)
app.include_router(mcp_router)
app.include_router(lsp_router)
app.include_router(preferences_router)
app.include_router(profiles_router)
app.include_router(activity_router)
app.include_router(proxy_router)

def open_app_browser(url):
    """Open the app in the preferred browser (from local preferences), else the default."""
    try:
        from app.preferences import get_preferences

        preferred = get_preferences().get("browser", "default")
    except Exception:
        preferred = "default"
    if preferred == "firefox":
        try:
            webbrowser.get("firefox")
        except webbrowser.Error:
            candidates = [
                os.path.join(os.environ.get("ProgramFiles", ""), "Mozilla Firefox", "firefox.exe"),
                os.path.join(os.environ.get("ProgramFiles(x86)", ""), "Mozilla Firefox", "firefox.exe"),
                os.path.join(os.environ.get("LOCALAPPDATA", ""), "Mozilla Firefox", "firefox.exe"),
            ]
            for path in candidates:
                if path and os.path.isfile(path):
                    webbrowser.register("firefox", None, webbrowser.GenericBrowser(path), preferred=True)
                    break
    webbrowser.open(url)


if __name__ == "__main__":
    print_banner()
    url = f"http://{config.HOST}:{config.PORT}"
    threading.Timer(1.2, lambda: open_app_browser(url)).start()
    uvicorn.run(app, host=config.HOST, port=config.PORT, log_level="info")
