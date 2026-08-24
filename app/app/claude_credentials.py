"""Claude credential store: Windows DPAPI-encrypted app-owned storage.

Design (2026-08-17, session 48 - approved): route credential values are
encrypted with the current Windows user's DPAPI key and stored per-value in
app/state/claude-credentials.bin (git-ignored). Plaintext exists only
transiently in process memory; it is never written to the registry,
environment, route store, logs, or reports. This works for every Windows user
of the app (each user's keys are locked to their own login).

Storage shape:
    { "version": 1, "entries": { "<ref>": "<base64 dpapi-ciphertext>" } }

Corrupted/missing entries resolve to None (treated as absent, never an error
page). Public functions are patchable in tests so no real DPAPI runs in
fixtures.
"""

import base64
import ctypes
import hashlib
import json
from ctypes import wintypes
from pathlib import Path

from .config import APP_DIR

CREDENTIALS_FILE = APP_DIR / "state" / "claude-credentials.bin"
STORE_VERSION = 1


class _DataBlob(ctypes.Structure):
    _fields_ = [("cbData", wintypes.DWORD), ("pbData", ctypes.POINTER(ctypes.c_char))]


def _dpapi_protect(data: bytes) -> bytes:
    buffer = ctypes.create_string_buffer(data, len(data))
    blob_in = _DataBlob(len(data), ctypes.cast(buffer, ctypes.POINTER(ctypes.c_char)))
    blob_out = _DataBlob()
    if not ctypes.windll.crypt32.CryptProtectData(
        ctypes.byref(blob_in), None, None, None, None, 0, ctypes.byref(blob_out)
    ):
        raise OSError("DPAPI protection failed")
    try:
        return ctypes.string_at(blob_out.pbData, blob_out.cbData)
    finally:
        ctypes.windll.kernel32.LocalFree(blob_out.pbData)


def _dpapi_unprotect(data: bytes) -> bytes:
    buffer = ctypes.create_string_buffer(data, len(data))
    blob_in = _DataBlob(len(data), ctypes.cast(buffer, ctypes.POINTER(ctypes.c_char)))
    blob_out = _DataBlob()
    if not ctypes.windll.crypt32.CryptUnprotectData(
        ctypes.byref(blob_in), None, None, None, None, 0, ctypes.byref(blob_out)
    ):
        raise OSError("DPAPI unprotection failed")
    try:
        return ctypes.string_at(blob_out.pbData, blob_out.cbData)
    finally:
        ctypes.windll.kernel32.LocalFree(blob_out.pbData)


def _read_document():
    try:
        raw = CREDENTIALS_FILE.read_bytes()
    except FileNotFoundError:
        return {"version": STORE_VERSION, "entries": {}}
    except OSError:
        return {"version": STORE_VERSION, "entries": {}}
    try:
        doc = json.loads(raw.decode("utf-8"))
    except (ValueError, UnicodeDecodeError):
        return {"version": STORE_VERSION, "entries": {}}
    if not isinstance(doc, dict) or doc.get("version") != STORE_VERSION or not isinstance(doc.get("entries"), dict):
        return {"version": STORE_VERSION, "entries": {}}
    return doc


def _write_document(doc):
    CREDENTIALS_FILE.parent.mkdir(parents=True, exist_ok=True)
    tmp = CREDENTIALS_FILE.with_suffix(CREDENTIALS_FILE.suffix + ".tmp")
    tmp.write_bytes(json.dumps(doc, separators=(",", ":")).encode("utf-8"))
    tmp.replace(CREDENTIALS_FILE)


def store(name, value):
    """Encrypt and persist the value under `name`. Replaces any existing entry.
    The value is never returned."""
    if not name or not isinstance(value, str):
        return
    ciphertext = _dpapi_protect(value.encode("utf-8"))
    doc = _read_document()
    doc["entries"][name] = base64.b64encode(ciphertext).decode("ascii")
    _write_document(doc)


def resolve(name):
    """Return the decrypted plaintext for `name`, or None when absent,
    corrupted, or undecryptable."""
    if not name:
        return None
    doc = _read_document()
    encoded = doc["entries"].get(name)
    if not encoded:
        return None
    try:
        ciphertext = base64.b64decode(encoded)
        return _dpapi_unprotect(ciphertext).decode("utf-8")
    except (ValueError, OSError, UnicodeDecodeError):
        return None


def delete(name):
    """Remove the entry for `name` (missing entries are ignored)."""
    if not name:
        return
    doc = _read_document()
    if name in doc["entries"]:
        del doc["entries"][name]
        _write_document(doc)


def has(name):
    return bool(name) and name in _read_document()["entries"]


def list_names():
    return sorted(_read_document()["entries"].keys())


def revision(name):
    """Return a non-secret revision for the encrypted credential entry."""
    if not name:
        return None
    encoded = _read_document()["entries"].get(name)
    if not encoded:
        return None
    try:
        ciphertext = base64.b64decode(encoded, validate=True)
    except (ValueError, TypeError):
        return None
    return hashlib.sha256(ciphertext).hexdigest()
