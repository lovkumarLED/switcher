"""Agent discovery, config scanning, and status endpoints."""

import json
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from . import agentstore
from .config import AGENT_REGISTRY, EXCLUDED_MAIN_NAMES
from .storage import get_state

router = APIRouter(prefix="/api")


class DiscoverBody(BaseModel):
    path: str = ""


class ScanBody(BaseModel):
    agent: str
    dir: str


def _excluded(name):
    return name.startswith(EXCLUDED_MAIN_NAMES)


def _first_main_json(directory):
    hits = sorted(
        (f for f in directory.glob("*.json") if not _excluded(f.name)),
        key=lambda f: f.name,
    )
    return str(hits[0]) if hits else ""


def _registry_hit(entry):
    home = Path.home() / entry["home"]
    if not home.is_dir():
        return None
    for main in entry["main"]:
        if (home / main).is_file():
            return {"name": entry["name"], "dir": str(home), "main": main}
    return None


def _agent_entry(name):
    return next((e for e in AGENT_REGISTRY if e["name"] == name), None)


@router.get("/status")
def status():
    agent, directory = agentstore.current_agent()
    has_builder = False
    if agent and directory:
        has_builder = agentstore.find_builder_script(directory, agent) is not None
    return {"ready": bool(agent and has_builder), "agent": agent, "hasBuilder": has_builder}


@router.post("/discover")
def discover(body: DiscoverBody):
    if body.path:
        directory = Path(body.path)
        if not directory.is_dir():
            raise HTTPException(400, "That folder doesn't exist on this computer. Check the path and try again.")
        agent = {"name": directory.name, "dir": str(directory), "main": _first_main_json(directory)}
        return {"agents": [agent], "chosen": agent}
    agents = [hit for entry in AGENT_REGISTRY if (hit := _registry_hit(entry))]
    chosen = agents[0] if agents else None
    return {"agents": agents, "chosen": chosen}


@router.post("/scan")
def scan(body: ScanBody):
    directory = Path(body.dir)
    if not directory.is_dir():
        raise HTTPException(400, "That folder doesn't exist on this computer.")
    entry = _agent_entry(body.agent)
    main_file = None
    patterns = entry["main"] if entry else ["*.json"]
    for pattern in patterns:
        if "*" in pattern:
            hits = sorted(
                (f for f in directory.glob("*.json") if not _excluded(f.name)),
                key=lambda f: f.name,
            )
            if hits:
                main_file = hits[0]
                break
        else:
            candidate = directory / pattern
            if candidate.is_file():
                main_file = candidate
                break

    mcps, plugins = [], []
    if main_file:
        try:
            data = json.loads(main_file.read_text(encoding="utf-8-sig"))
        except (ValueError, OSError):
            data = {}
        if isinstance(data, dict):
            mcp = data.get("mcp")
            if isinstance(mcp, dict):
                mcps = list(mcp.keys())
            keys = entry["plugkeys"] if entry else ["plugin"]
            for key in keys:
                node = data
                for segment in key.split("."):
                    node = node.get(segment) if isinstance(node, dict) else None
                if isinstance(node, list):
                    plugins.extend(str(item) for item in node)
    plugins = sorted(set(plugins))

    profiles_dir = directory / "profiles"
    profiles = [p.name for p in profiles_dir.glob("*") if p.is_dir()] if profiles_dir.is_dir() else []
    providers = sorted(p["id"] for p in agentstore.list_providers(directory))
    has_builder = agentstore.has_any_builder(directory)
    profile = agentstore.active_profile(directory)
    split = (directory / "profiles" / profile / "mcp.json").is_file()
    return {"agent": body.agent, "mcps": mcps, "plugins": plugins, "profiles": profiles, "providers": providers, "activeProviders": agentstore.get_active_providers(directory, existing_only=True), "split": split, "hasBuilder": has_builder}
