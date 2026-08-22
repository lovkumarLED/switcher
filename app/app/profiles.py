"""Profile endpoints: list the agent's profiles and switch the active one."""

from fastapi import APIRouter, HTTPException

from . import agentstore
from .storage import get_state, set_state

router = APIRouter(prefix="/api")


def _excluded_dir(name):
    return name.startswith(".") or name in ("backup", "schemas", "scripts")


def list_profiles(agent_dir):
    profiles_dir = agent_dir / "profiles"
    if not profiles_dir.is_dir():
        return []
    return sorted(
        p.name for p in profiles_dir.iterdir() if p.is_dir() and not _excluded_dir(p.name)
    )


def _ensure_profile_scope(agent_dir, profile):
    """Mark non-legacy profiles as provider-isolated for the external builders."""
    if profile not in ("coding", "default"):
        (agent_dir / "profiles" / profile / "providers").mkdir(parents=True, exist_ok=True)


def active_profile():
    state = get_state()
    profile = state.get("activeProfile")
    if isinstance(profile, str) and profile:
        return profile
    return "coding"


@router.get("/profiles")
def read_profiles():
    agent_dir = agentstore.require_agent_dir()
    current = agentstore.active_profile(agent_dir)
    _ensure_profile_scope(agent_dir, current)
    return {
        "profiles": list_profiles(agent_dir),
        "active": current,
    }


@router.post("/profiles/switch")
def switch_profile(body: dict):
    profile = str((body or {}).get("profile") or "").strip()
    if not profile:
        raise HTTPException(400, "Type a profile name.")
    agent_dir = agentstore.require_agent_dir()
    if profile not in list_profiles(agent_dir):
        raise HTTPException(404, f"Profile '{profile}' doesn't exist.")
    _ensure_profile_scope(agent_dir, profile)
    set_state(activeProfile=profile)
    return {"ok": True, "active": profile, "profiles": list_profiles(agent_dir)}
