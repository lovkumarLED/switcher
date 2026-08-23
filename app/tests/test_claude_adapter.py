import hashlib
import json
import os
import re
import shutil
import subprocess
import tempfile
import threading
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi import HTTPException
from pydantic import ValidationError

from app import agentstore, claude_adapter, config

FAKE_KEY = "FAKE_GATE4_KEY_VALUE_DO_NOT_USE"
FAKE_TOKEN = "FAKE_GATE4_TOKEN_VALUE_DO_NOT_USE"


class ClaudeAdapterBase(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp(prefix="bdf-gate4a-"))
        self.profile_root = self.tmp / "profile"
        (self.profile_root / ".claude").mkdir(parents=True)
        self.target = self.profile_root / ".claude" / "settings.json"
        self.target.write_text(
            json.dumps({"model": "old", "env": {}, "enabledPlugins": ["x"], "extraKnownMarketplaces": ["m"], "mcpLikeData": {"s": 1}, "unknownRoot": {"nullValue": None, "array": ["first"]}, "env": {"UNKNOWN_NESTED": {"array": [3]}, "UNKNOWN_MARKER": "FAKE_EXISTING_SECRET_MARKER"}}),
            encoding="utf-8",
        )
        self.routes_file = self.tmp / "claude-routes.json"
        self.manifest_file = self.tmp / "claude-backup-manifest.json"
        self.activity_file = self.tmp / "claude-activity.jsonl"
        self.credentials_file = self.tmp / "claude-credentials.bin"
        patchers = [
            patch.object(claude_adapter, "get_profile_root", return_value=self.profile_root),
            patch.object(claude_adapter, "CLAUDE_ROUTES_FILE", self.routes_file),
            patch.object(claude_adapter, "CLAUDE_MANIFEST_FILE", self.manifest_file),
            patch.object(claude_adapter, "CLAUDE_ACTIVITY_FILE", self.activity_file),
            patch.object(claude_adapter, "ALLOW_REAL_CLAUDE_TARGET", False),
            patch.object(claude_adapter.claude_credentials, "CREDENTIALS_FILE", self.credentials_file),
            patch.object(claude_adapter.claude_credentials, "_dpapi_protect", lambda data: b"ENC:" + data),
            patch.object(claude_adapter.claude_credentials, "_dpapi_unprotect", lambda data: data[4:] if data.startswith(b"ENC:") else (_ for _ in ()).throw(OSError("bad"))),
        ]
        for p in patchers:
            p.start()
            self.addCleanup(p.stop)
        self.old_key = os.environ.get("BDF_GATE4A_API_KEY_REF")
        self.old_token = os.environ.get("BDF_GATE4A_TOKEN_REF")
        os.environ["BDF_GATE4A_API_KEY_REF"] = FAKE_KEY
        os.environ["BDF_GATE4A_TOKEN_REF"] = FAKE_TOKEN

    def tearDown(self):
        if self.old_key is None:
            os.environ.pop("BDF_GATE4A_API_KEY_REF", None)
        else:
            os.environ["BDF_GATE4A_API_KEY_REF"] = self.old_key
        if self.old_token is None:
            os.environ.pop("BDF_GATE4A_TOKEN_REF", None)
        else:
            os.environ["BDF_GATE4A_TOKEN_REF"] = self.old_token
        import shutil
        shutil.rmtree(self.tmp, ignore_errors=True)

    def create_route(self, name="Main", model="sonnet"):
        body = claude_adapter.RouteCreateBody(
            name=name, baseUrl="https://api.example.test/v1", authKind="apiKey",
            secretEnvRef="BDF_GATE4A_API_KEY_REF", model=model,
            gatewayDiscovery=True, disableExperimentalBetas=True,
            autoCompactWindow=190000, disableNonessentialTraffic=False,
        )
        return claude_adapter.claude_route_create(body)["route"]

    def store(self):
        return claude_adapter._read_store()

    def manifest(self):
        try:
            return json.loads(self.manifest_file.read_text(encoding="utf-8"))
        except FileNotFoundError:
            return []

    def activity_types(self):
        try:
            text = self.activity_file.read_text(encoding="utf-8")
        except FileNotFoundError:
            return []
        return [json.loads(line)["type"] for line in text.splitlines() if line.strip()]

    def target_hash(self):
        return claude_adapter._sha256_file(self.target)


class RegistryAndDiscoveryTests(ClaudeAdapterBase):
    def test_registry_excludes_claudecode(self):
        self.assertNotIn("claudecode", [e["name"] for e in config.AGENT_REGISTRY])
        for entry in config.AGENT_REGISTRY:
            self.assertNotIn(".claude", entry.get("home", ""))

    def test_generic_discover_excludes_claudecode(self):
        from app.discovery import discover, DiscoverBody
        with patch.object(agentstore, "current_agent", return_value=(None, None)):
            result = discover(DiscoverBody(path=""))
        names = [a["name"] for a in result["agents"]]
        self.assertNotIn("claudecode", names)

    def test_discover_uses_only_structural_probe(self):
        with patch.object(claude_adapter, "_probe_settings_present", return_value=True) as probe:
            result = claude_adapter.claude_discover()
        self.assertTrue(result["detected"])
        probe.assert_called_once_with(self.profile_root)

    def test_status_unlocked_schema(self):
        status = claude_adapter.claude_status()
        self.assertEqual(status["scope"], "user")
        self.assertEqual(status["inspectionState"], "unlocked")
        self.assertIsInstance(status["settingsPresent"], bool)
        self.assertIs(status["realTargetLocked"], False)
        self.assertEqual(status["restartNotice"], "Restarting Claude Code may be required for startup-only values.")
        self.assertFalse(any("path" in k.lower() for k in status))

    def test_locked_endpoints_do_not_probe(self):
        with patch.object(claude_adapter, "get_profile_root", return_value=Path.home()):
            with patch.object(claude_adapter, "_probe_settings_present", side_effect=AssertionError("probed")) as probe:
                status = claude_adapter.claude_status()
                discover = claude_adapter.claude_discover()
                route = claude_adapter.claude_route_create(claude_adapter.RouteCreateBody(
                    name="x", baseUrl="https://a.test/v1", authKind="apiKey", secretEnvRef="BDF_GATE4A_API_KEY_REF",
                    model="m", gatewayDiscovery=False, disableExperimentalBetas=False,
                    autoCompactWindow=190000, disableNonessentialTraffic=False))["route"]
            self.assertEqual(status["inspectionState"], "locked")
            self.assertIsNone(status["settingsPresent"])
            self.assertTrue(status["realTargetLocked"])
            self.assertIsNone(discover["detected"])
            probe.assert_not_called()
            # Route CRUD is app-owned state and stays available while locked;
            # it must never probe the real settings target either.
            self.assertEqual(route["name"], "x")

    def test_no_clear_applied_route_endpoint(self):
        paths = [r.path for r in claude_adapter.router.routes]
        self.assertNotIn("/api/claude/routes/clear", paths)


class RouteCrudTests(ClaudeAdapterBase):
    def test_routes_get_contract(self):
        route = self.create_route()
        result = claude_adapter.claude_routes()
        self.assertEqual(result["appliedRouteId"], None)
        self.assertIsNone(result["appliedRouteConfigSha256"])
        self.assertRegex(result["revision"], r"^[0-9a-f]{64}$")
        self.assertRegex(result["routesRevision"], r"^[0-9a-f]{64}$")
        self.assertEqual(result["routes"][0]["id"], route["id"])
        self.assertFalse(any("path" in k.lower() for k in result))

    def test_create_validation_errors(self):
        base = dict(name="X", baseUrl="https://a.test/v1", authKind="apiKey", secretEnvRef="BDF_GATE4A_API_KEY_REF",
                    model="m", gatewayDiscovery=False, disableExperimentalBetas=False,
                    autoCompactWindow=190000, disableNonessentialTraffic=False)
        cases = [
            dict(base, name=""),
            dict(base, name="x" * 65),
            dict(base, baseUrl="relative/path"),
            dict(base, baseUrl="ftp://a.test"),
            dict(base, baseUrl="https://u@a.test"),
            dict(base, baseUrl="https://a.test/?q=1"),
            dict(base, model=""),
            dict(base, model="m" * 300),
            dict(base, authKind="both"),
            dict(base, secretEnvRef="BAD-REF"),
            dict(base, secretEnvRef=""),
            dict(base, autoCompactWindow=99999),
            dict(base, autoCompactWindow=1000001),
        ]
        for payload in cases:
            with self.assertRaises(HTTPException, msg=str(payload)) as ctx:
                claude_adapter.claude_route_create(claude_adapter.RouteCreateBody(**payload))
            self.assertEqual(ctx.exception.status_code, 400)

    def test_create_rejects_discovery_plus_disabled_traffic(self):
        payload = dict(name="Conflict", baseUrl="https://a.test/v1", authKind="apiKey",
                       secretEnvRef="BDF_GATE4A_API_KEY_REF", model="m",
                       gatewayDiscovery=True, disableExperimentalBetas=False,
                       autoCompactWindow=190000, disableNonessentialTraffic=True)
        with self.assertRaises(HTTPException) as ctx:
            claude_adapter.claude_route_create(claude_adapter.RouteCreateBody(**payload))
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertEqual(str(ctx.exception.detail), "Gateway model discovery cannot be combined with disabled nonessential traffic.")
        self.assertEqual(self.store()["routes"], [])

    def test_edit_rejects_discovery_plus_disabled_traffic_before_revision_change(self):
        route = self.create_route()
        rev = claude_adapter.claude_routes()["routesRevision"]
        body = claude_adapter.RouteEditBody(
            name="Edited", baseUrl="https://a.test/v1", authKind="apiKey",
            secretEnvRef="BDF_GATE4A_API_KEY_REF", model="m",
            gatewayDiscovery=True, disableExperimentalBetas=False,
            autoCompactWindow=190000, disableNonessentialTraffic=True,
            expectedRoutesRevision=rev)
        with self.assertRaises(HTTPException) as ctx:
            claude_adapter.claude_route_edit(route["id"], body)
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertEqual(self.store()["routes"][0]["name"], "Main")
        self.assertEqual(self.activity_file.read_text(encoding="utf-8").count("\n"), 1)

    def test_routing_profile_model_source_is_environment(self):
        route = self.create_route()
        profile = claude_adapter._routing_profile(route)
        self.assertEqual(profile["model"]["source"], "environment")
        self.assertEqual(profile["model"]["value"], route["model"])

    def test_create_rejects_unknown_fields(self):
        with self.assertRaises(ValidationError):
            claude_adapter.RouteCreateBody(name="x", baseUrl="https://a.test/v1", authKind="apiKey",
                                           secretEnvRef="B", model="m", gatewayDiscovery=False,
                                           disableExperimentalBetas=False, autoCompactWindow=190000,
                                           disableNonessentialTraffic=False, unexpected=True)

    def test_create_success_no_apply(self):
        before = self.target_hash()
        route = self.create_route()
        self.assertTrue(route["id"].startswith("route-"))
        self.assertIn("route_created", self.activity_types())
        self.assertEqual(self.target_hash(), before)
        store = self.store()
        self.assertIsNone(store["appliedRouteId"])

    def test_duplicate_name_rejected(self):
        self.create_route(name="Main")
        with self.assertRaises(HTTPException) as ctx:
            self.create_route(name="MAIN")
        self.assertEqual(ctx.exception.status_code, 400)

    def test_edit_stale_revision_409(self):
        route = self.create_route()
        with self.assertRaises(HTTPException) as ctx:
            claude_adapter.claude_route_edit(route["id"], claude_adapter.RouteEditBody(
                name="Renamed", baseUrl="https://b.test/v1", authKind="authToken", secretEnvRef="BDF_GATE4A_TOKEN_REF",
                model="opus", gatewayDiscovery=False, disableExperimentalBetas=False,
                autoCompactWindow=200000, disableNonessentialTraffic=True, expectedRoutesRevision="0" * 64))
        self.assertEqual(ctx.exception.status_code, 409)

    def test_edit_success(self):
        route = self.create_route()
        rev = claude_adapter.claude_routes()["routesRevision"]
        result = claude_adapter.claude_route_edit(route["id"], claude_adapter.RouteEditBody(
            name="Renamed", baseUrl="https://b.test/v1", authKind="authToken", secretEnvRef="BDF_GATE4A_TOKEN_REF",
            model="opus", gatewayDiscovery=False, disableExperimentalBetas=False,
            autoCompactWindow=200000, disableNonessentialTraffic=True, expectedRoutesRevision=rev))
        self.assertEqual(result["route"]["name"], "Renamed")
        self.assertIn("route_edited", self.activity_types())

    def test_delete_applied_route_rejected(self):
        route = self.create_route()
        rev = claude_adapter.claude_routes()["routesRevision"]
        body = claude_adapter.RouteApplyBody(expectedRevision=claude_adapter._target_revision(self.profile_root), expectedRoutesRevision=rev)
        claude_adapter.claude_route_apply(route["id"], body)
        with self.assertRaises(HTTPException) as ctx:
            claude_adapter.claude_route_delete(route["id"], claude_adapter.RouteDeleteBody(expectedRoutesRevision=claude_adapter.claude_routes()["routesRevision"]))
        self.assertEqual(ctx.exception.status_code, 409)

    def test_delete_success(self):
        route = self.create_route()
        rev = claude_adapter.claude_routes()["routesRevision"]
        result = claude_adapter.claude_route_delete(route["id"], claude_adapter.RouteDeleteBody(expectedRoutesRevision=rev))
        self.assertTrue(result["ok"])
        self.assertIn("route_deleted", self.activity_types())


class FingerprintTests(ClaudeAdapterBase):
    def test_fingerprint_stability_and_sensitivity(self):
        route = self.create_route()
        fp = claude_adapter._fingerprint(route)
        self.assertRegex(fp, r"^[0-9a-f]{64}$")
        self.assertEqual(claude_adapter._fingerprint(route), fp)
        changed = dict(route, model="other-model")
        self.assertNotEqual(claude_adapter._fingerprint(changed), fp)
        changed_ref = dict(route, secretEnvRef="BDF_GATE4A_TOKEN_REF")
        self.assertNotEqual(claude_adapter._fingerprint(changed_ref), fp)
        renamed = dict(route, name="Different")
        self.assertEqual(claude_adapter._fingerprint(renamed), fp)

    def test_route_without_credential_revision_keeps_legacy_fingerprint(self):
        route = self.create_route()
        legacy_payload = {
            "baseUrl": route["baseUrl"],
            "authKind": route["authKind"],
            "secretEnvRef": route["secretEnvRef"],
            "model": route["effectiveModel"],
            "gatewayDiscovery": route["gatewayDiscovery"],
            "disableExperimentalBetas": route["disableExperimentalBetas"],
            "autoCompactWindow": route["autoCompactWindow"],
            "disableNonessentialTraffic": route["disableNonessentialTraffic"],
            "modelRoles": route.get("modelRoles") or {},
            "restrictModelPicker": route.get("restrictModelPicker", True),
        }
        legacy_text = json.dumps(
            legacy_payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False
        )

        expected = hashlib.sha256(legacy_text.encode("utf-8")).hexdigest()
        self.assertEqual(claude_adapter._fingerprint(route), expected)

    def test_null_applied_requires_null_fingerprint(self):
        store = self.store()
        self.assertIsNone(store["appliedRouteId"])
        self.assertIsNone(store["appliedRouteConfigSha256"])

    def test_edit_applied_route_changes_fingerprint_state(self):
        route = self.create_route()
        rev = claude_adapter.claude_routes()["routesRevision"]
        claude_adapter.claude_route_apply(route["id"], claude_adapter.RouteApplyBody(
            expectedRevision=claude_adapter._target_revision(self.profile_root), expectedRoutesRevision=rev))
        store = self.store()
        self.assertEqual(store["appliedRouteId"], route["id"])
        self.assertEqual(store["appliedRouteConfigSha256"], claude_adapter._fingerprint(route))
        new_rev = claude_adapter.claude_routes()["routesRevision"]
        edited = claude_adapter.claude_route_edit(route["id"], claude_adapter.RouteEditBody(
            name=route["name"], baseUrl=route["baseUrl"], authKind=route["authKind"], secretEnvRef=route["secretEnvRef"],
            model="different-model", gatewayDiscovery=route["gatewayDiscovery"], disableExperimentalBetas=route["disableExperimentalBetas"],
            autoCompactWindow=route["autoCompactWindow"], disableNonessentialTraffic=route["disableNonessentialTraffic"],
            expectedRoutesRevision=new_rev))
        store_after = self.store()
        self.assertNotEqual(store_after["appliedRouteConfigSha256"], claude_adapter._fingerprint(edited["route"]))

    def test_edit_applied_route_with_new_api_key_changes_fingerprint_state(self):
        route = self.create_route()
        store = self.store()
        store["appliedRouteId"] = route["id"]
        store["appliedRouteConfigSha256"] = route["configSha256"]
        claude_adapter._atomic_write(
            self.routes_file,
            json.dumps(store, indent=2, ensure_ascii=False) + "\n",
        )

        result = claude_adapter.claude_routes()
        edited = claude_adapter.claude_route_edit(route["id"], claude_adapter.RouteEditBody(
            name=route["name"], baseUrl=route["baseUrl"], authKind=route["authKind"], secretEnvRef=route["secretEnvRef"],
            model=route["model"], gatewayDiscovery=route["gatewayDiscovery"], disableExperimentalBetas=route["disableExperimentalBetas"],
            autoCompactWindow=route["autoCompactWindow"], disableNonessentialTraffic=route["disableNonessentialTraffic"],
            secretValue="replacement-api-key", expectedRoutesRevision=result["routesRevision"]))

        after = claude_adapter.claude_routes()
        self.assertEqual(after["appliedRouteId"], route["id"])
        self.assertNotEqual(after["appliedRouteConfigSha256"], edited["route"]["configSha256"])
        detail = claude_adapter.claude_route_detail(route["id"])
        self.assertNotIn("credentialRevision", edited["route"])
        self.assertNotIn("credentialRevision", after["routes"][0])
        self.assertNotIn("credentialRevision", detail["route"])
        self.assertNotIn("replacement-api-key", json.dumps([edited, after, detail]))
        self.assertNotIn("replacement-api-key", self.routes_file.read_text(encoding="utf-8"))


class ModelRolesTests(ClaudeAdapterBase):
    def _roles(self, model="main/model", **roles):
        return claude_adapter.RouteCreateBody(
            name="Roles", baseUrl="https://api.example.test/v1", authKind="apiKey",
            secretEnvRef="BDF_GATE4A_API_KEY_REF", model=model,
            gatewayDiscovery=False, disableExperimentalBetas=False,
            autoCompactWindow=None, disableNonessentialTraffic=False,
            modelRoles=roles, restrictModelPicker=True)

    def test_create_with_model_roles_round_trips(self):
        route = claude_adapter.claude_route_create(self._roles(opus="gateway/role-opus", haiku="gateway/role-haiku"))["route"]
        self.assertEqual(route["modelRoles"], {"opus": "gateway/role-opus", "haiku": "gateway/role-haiku"})
        self.assertTrue(route["restrictModelPicker"])

    def test_create_without_roles_defaults_empty_and_restrict_on(self):
        route = self.create_route()
        self.assertEqual(route.get("modelRoles") or {}, {})
        self.assertTrue(route.get("restrictModelPicker", True))

    def test_unknown_role_rejected(self):
        with self.assertRaises(HTTPException) as ctx:
            claude_adapter.claude_route_create(self._roles(extrasmart="gateway/x"))
        self.assertEqual(ctx.exception.status_code, 400)

    def test_empty_role_value_dropped(self):
        route = claude_adapter.claude_route_create(self._roles(opus="  ", haiku="gateway/h"))["route"]
        self.assertEqual(route["modelRoles"], {"haiku": "gateway/h"})

    def test_auto_compact_optional(self):
        route = claude_adapter.claude_route_create(self._roles())["route"]
        self.assertIsNone(route["autoCompactWindow"])
        self.assertNotIn("autoCompactWindow", claude_adapter._routing_profile(route)["envPolicy"])

    def test_routing_profile_includes_roles_and_allowlist(self):
        route = claude_adapter.claude_route_create(self._roles(opus="gateway/o", fable="gateway/f"))["route"]
        profile = claude_adapter._routing_profile(route)
        self.assertEqual(profile["modelRoles"], {"opus": "gateway/o", "fable": "gateway/f"})
        self.assertTrue(profile["restrictModelPicker"])
        self.assertNotIn("autoCompactWindow", profile["envPolicy"])

    def test_fingerprint_sensitive_to_roles_and_allowlist(self):
        base = claude_adapter.claude_route_create(self._roles(haiku="gateway/h"))["route"]
        fp = claude_adapter._fingerprint(base)
        self.assertNotEqual(claude_adapter._fingerprint(dict(base, modelRoles={**base["modelRoles"], "opus": "gateway/o"})), fp)
        self.assertNotEqual(claude_adapter._fingerprint(dict(base, restrictModelPicker=False)), fp)
        self.assertEqual(claude_adapter._fingerprint(dict(base, name="Renamed")), fp)

    def test_existing_route_without_roles_backward_compatible(self):
        route = self.create_route()
        self.assertEqual(claude_adapter._routing_profile(route)["modelRoles"], {})
        self.assertIn("restrictModelPicker", claude_adapter._routing_profile(route))

    def test_main_model_optional_when_roles_assigned(self):
        route = claude_adapter.claude_route_create(self._roles(sonnet="gateway/s", haiku="gateway/h", model=""))["route"]
        self.assertEqual(route["model"], "")

    def test_main_model_and_roles_both_absent_rejected(self):
        with self.assertRaises(HTTPException) as ctx:
            claude_adapter.claude_route_create(self._roles(model=""))
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("Add a model ID or assign at least one role model", str(ctx.exception.detail))

    def test_effective_model_derives_from_sonnet_when_main_blank(self):
        route = claude_adapter.claude_route_create(self._roles(sonnet="gateway/s", haiku="gateway/h", model=""))["route"]
        self.assertEqual(claude_adapter._effective_model(route), "gateway/s")
        self.assertEqual(claude_adapter._routing_profile(route)["model"]["value"], "gateway/s")

    def test_effective_model_precedence_sonnet_haiku_opus_fable(self):
        route = claude_adapter.claude_route_create(self._roles(haiku="gateway/h", opus="gateway/o", fable="gateway/f", model=""))["route"]
        self.assertEqual(claude_adapter._effective_model(route), "gateway/h")
        self.assertIn("effectiveModel", claude_adapter.claude_routes()["routes"][0])


class ApplyRestoreTests(ClaudeAdapterBase):
    def test_apply_stale_revisions_409(self):
        route = self.create_route()
        for body in (
            claude_adapter.RouteApplyBody(expectedRevision="0" * 64, expectedRoutesRevision=claude_adapter.claude_routes()["routesRevision"]),
            claude_adapter.RouteApplyBody(expectedRevision=claude_adapter._target_revision(self.profile_root), expectedRoutesRevision="0" * 64),
        ):
            with self.assertRaises(HTTPException) as ctx:
                claude_adapter.claude_route_apply(route["id"], body)
            self.assertEqual(ctx.exception.status_code, 409)

    def test_apply_success(self):
        route = self.create_route()
        rev = claude_adapter.claude_routes()["routesRevision"]
        result = claude_adapter.claude_route_apply(route["id"], claude_adapter.RouteApplyBody(
            expectedRevision=claude_adapter._target_revision(self.profile_root), expectedRoutesRevision=rev))
        self.assertTrue(result["ok"])
        self.assertRegex(result["revision"], r"^[0-9a-f]{64}$")
        self.assertRegex(result["routesRevision"], r"^[0-9a-f]{64}$")
        store = self.store()
        self.assertEqual(store["appliedRouteId"], route["id"])
        self.assertEqual(store["appliedRouteConfigSha256"], claude_adapter._fingerprint(route))
        target = json.loads(self.target.read_text(encoding="utf-8"))
        self.assertEqual(target["model"], "old")
        self.assertEqual(target["env"]["ANTHROPIC_MODEL"], route["model"])
        self.assertEqual(target["env"]["ANTHROPIC_BASE_URL"], route["baseUrl"])
        self.assertEqual(target["env"]["ANTHROPIC_API_KEY"], FAKE_KEY)
        self.assertEqual(target["env"]["CLAUDE_CODE_AUTO_COMPACT_WINDOW"], "190000")
        self.assertNotIn("ANTHROPIC_AUTH_TOKEN", target["env"])
        self.assertEqual(target["unknownRoot"]["array"][0], "first")
        self.assertEqual(target["env"]["UNKNOWN_NESTED"]["array"][0], 3)
        self.assertEqual(target["enabledPlugins"], ["x"])
        backups = list((self.profile_root / ".claude" / "backup").glob("settings.backup.*.json"))
        self.assertEqual(len(backups), 1)
        manifest = self.manifest()
        self.assertEqual(len(manifest), 1)
        entry = manifest[0]
        for field in ("backupName", "backupSha256", "preWriteTargetSha256", "postWriteTargetSha256", "targetBindingSha256", "appliedRouteId", "appliedRouteConfigSha256", "previousAppliedRouteId", "previousAppliedRouteConfigSha256", "previousStorePresent", "previousStoreBackupName", "previousStoreSha256", "createdAt", "coreVersion", "schemaIdentity"):
            self.assertIn(field, entry)
        self.assertEqual(entry["coreVersion"], "0.3.0")
        self.assertEqual(entry["schemaIdentity"], claude_adapter._sha256_file(claude_adapter.CLAUDE_SCHEMA))
        self.assertIn("route_applied", self.activity_types())

    def test_apply_missing_secret_fails_before_mutation(self):
        route = self.create_route(name="Secret", model="m2")
        os.environ.pop("BDF_GATE4A_API_KEY_REF", None)
        before = self.target_hash()
        rev = claude_adapter.claude_routes()["routesRevision"]
        with self.assertRaises(HTTPException) as ctx:
            claude_adapter.claude_route_apply(route["id"], claude_adapter.RouteApplyBody(
                expectedRevision=claude_adapter._target_revision(self.profile_root), expectedRoutesRevision=rev))
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertEqual(self.target_hash(), before)
        self.assertEqual(self.manifest(), [])
        self.assertIn("apply_failed", self.activity_types())

    def test_apply_preserves_target_bytes_outside_managed_spans(self):
        self.target.write_text(
            '{\n  "model"  :  "old/model"  ,\n  "env"  :  {  "ANTHROPIC_BASE_URL"  :  "http://old.invalid/v1"  }  ,\n  "theme"  :  { "x"  :  1e2  }\n}\n',
            encoding="utf-8", newline="\n")
        route = self.create_route(model="env-model")
        rev = claude_adapter.claude_routes()["routesRevision"]
        result = claude_adapter.claude_route_apply(route["id"], claude_adapter.RouteApplyBody(
            expectedRevision=claude_adapter._target_revision(self.profile_root), expectedRoutesRevision=rev))
        self.assertTrue(result["ok"])
        raw = self.target.read_text(encoding="utf-8")
        self.assertIn('"model"  :  "old/model"', raw)
        self.assertIn('"theme"  :  { "x"  :  1e2  }', raw)
        target = json.loads(raw)
        self.assertEqual(target["model"], "old/model")
        self.assertEqual(target["env"]["ANTHROPIC_MODEL"], "env-model")
        self.assertIn("\n", raw)

    def test_version1_route_store_loads_without_migration(self):
        route = self.create_route()
        raw = self.routes_file.read_text(encoding="utf-8")
        parsed = json.loads(raw)
        self.assertEqual(parsed["version"], 1)
        self.assertEqual(len(parsed["routes"]), 1)
        self.assertIn("gatewayDiscovery", parsed["routes"][0])
        self.assertIn("disableNonessentialTraffic", parsed["routes"][0])
        store = claude_adapter.claude_routes()
        self.assertEqual(store["routes"][0]["id"], route["id"])
        self.assertEqual(len(store["routes"]), 1)

    def test_fingerprint_sensitive_to_all_four_curated_options(self):
        base = dict(name="M", baseUrl="https://a.test/v1", authKind="apiKey",
                    secretEnvRef="BDF_GATE4A_API_KEY_REF", model="m",
                    gatewayDiscovery=False, disableExperimentalBetas=False,
                    autoCompactWindow=190000, disableNonessentialTraffic=False)
        route = claude_adapter._route_dict(claude_adapter.RouteCreateBody(**base))
        baseline = claude_adapter._fingerprint(route)
        variants = [
            dict(base, gatewayDiscovery=True),
            dict(base, disableExperimentalBetas=True),
            dict(base, autoCompactWindow=200000),
            dict(base, disableNonessentialTraffic=True),
        ]
        for payload in variants:
            variant = claude_adapter._route_dict(claude_adapter.RouteCreateBody(**payload))
            self.assertNotEqual(claude_adapter._fingerprint(variant), baseline)

    def test_zero_forbidden_path_access_in_locked_and_temp_roots(self):
        # The adapter's read/write surface is limited to the injected temp-root
        # constants. Prove every constant resolves under the temporary root and
        # that the locked status path never leaves it.
        forbidden = [
            str((Path.home() / ".claude.json").resolve()).lower(),
            str((Path.home() / ".claude" / "plugins").resolve()).lower(),
            str((Path.home() / ".claude" / "settings.local.json").resolve()).lower(),
            str((Path.home() / ".mcp.json").resolve()).lower(),
        ]
        constants = [
            claude_adapter.CLAUDE_ROUTES_FILE,
            claude_adapter.CLAUDE_MANIFEST_FILE,
            claude_adapter.CLAUDE_ACTIVITY_FILE,
        ]
        tmp_root = str(self.tmp.resolve()).lower()
        for constant in constants:
            resolved = str(Path(constant).resolve()).lower()
            self.assertTrue(resolved.startswith(tmp_root), f"constant outside temp root: {constant}")
            for prefix in forbidden:
                self.assertFalse(resolved.startswith(prefix))
        claude_adapter.claude_route_create(claude_adapter.RouteCreateBody(
            name="Locked", baseUrl="https://a.test/v1", authKind="apiKey",
            secretEnvRef="BDF_GATE4A_API_KEY_REF", model="m",
            gatewayDiscovery=False, disableExperimentalBetas=False,
            autoCompactWindow=190000, disableNonessentialTraffic=False))
        self.assertEqual(len(self.store()["routes"]), 1)
        profile_resolved = str(claude_adapter.get_profile_root().resolve()).lower()
        self.assertTrue(profile_resolved.startswith(tmp_root))


    def test_production_entry_rejects_real_profile_without_allow_switch(self):
        from app.engine import PS1, PS1_ARGS
        routing = self.tmp / "routing.json"
        routing.write_text(json.dumps(claude_adapter._routing_profile(self.create_route())), encoding="utf-8")
        cmd = [PS1, *PS1_ARGS, str(claude_adapter.PRODUCTION_ENTRY), "-Operation", "Apply",
               "-ProfileRoot", str(Path.home()), "-SettingsPath", str(Path.home() / ".claude" / "settings.json"),
               "-RoutingProfilePath", str(routing), "-SchemaPath", str(claude_adapter.CLAUDE_SCHEMA)]
        proc = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=120)
        self.assertNotEqual(proc.returncode, 0)
        self.assertIn("locked", (proc.stdout + proc.stderr).lower())

    def test_restore_eligibility_rejections(self):
        route = self.create_route()
        rev = claude_adapter.claude_routes()["routesRevision"]
        claude_adapter.claude_route_apply(route["id"], claude_adapter.RouteApplyBody(
            expectedRevision=claude_adapter._target_revision(self.profile_root), expectedRoutesRevision=rev))
        revision = claude_adapter._target_revision(self.profile_root)

        def restore():
            return claude_adapter.claude_restore(claude_adapter.RestoreBody(
                expectedRevision=revision, expectedRoutesRevision=claude_adapter.claude_routes()["routesRevision"]))

        with self.assertRaises(HTTPException) as ctx:
            claude_adapter.claude_restore(claude_adapter.RestoreBody(
                expectedRevision="0" * 64, expectedRoutesRevision=claude_adapter.claude_routes()["routesRevision"]))
        self.assertEqual(ctx.exception.status_code, 409)

        entry = self.manifest()[-1]
        backup = self.profile_root / ".claude" / "backup" / entry["backupName"]
        backup_bytes = backup.read_bytes()

        foreign_entry = dict(entry, backupName="settings.backup.20260814000000000.aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.json")
        foreign_manifest = json.dumps([foreign_entry], indent=2, ensure_ascii=False) + "\n"
        self.manifest_file.write_text(foreign_manifest, encoding="utf-8", newline="\n")
        with self.assertRaises(HTTPException) as ctx:
            restore()
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertEqual(self.manifest_file.read_bytes(), foreign_manifest.encode("utf-8"))

        tampered_entry = dict(entry, backupSha256="0" * 64)
        self.manifest_file.write_text(json.dumps([tampered_entry]), encoding="utf-8", newline="\n")
        with self.assertRaises(HTTPException) as ctx:
            restore()
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertEqual(backup.read_bytes(), backup_bytes)

        binding_entry = dict(entry, targetBindingSha256="0" * 64)
        self.manifest_file.write_text(json.dumps([binding_entry]), encoding="utf-8", newline="\n")
        with self.assertRaises(HTTPException) as ctx:
            restore()
        self.assertEqual(ctx.exception.status_code, 409)

        malformed = self.tmp / "claude-backup-malformed.json"
        malformed.write_text("[not json", encoding="utf-8")
        with patch.object(claude_adapter, "CLAUDE_MANIFEST_FILE", malformed):
            with self.assertRaises(HTTPException) as ctx:
                claude_adapter.claude_restore(claude_adapter.RestoreBody(
                    expectedRevision=revision, expectedRoutesRevision=claude_adapter.claude_routes()["routesRevision"]))
            self.assertEqual(ctx.exception.status_code, 500)

    def test_restore_success_roundtrip(self):
        route = self.create_route()
        rev = claude_adapter.claude_routes()["routesRevision"]
        before_apply = self.target_hash()
        claude_adapter.claude_route_apply(route["id"], claude_adapter.RouteApplyBody(
            expectedRevision=claude_adapter._target_revision(self.profile_root), expectedRoutesRevision=rev))
        self.assertNotEqual(self.target_hash(), before_apply)
        entry = self.manifest()[-1]
        backup = self.profile_root / ".claude" / "backup" / entry["backupName"]
        backup_bytes = backup.read_bytes()
        result = claude_adapter.claude_restore(claude_adapter.RestoreBody(
            expectedRevision=claude_adapter._target_revision(self.profile_root),
            expectedRoutesRevision=claude_adapter.claude_routes()["routesRevision"]))
        self.assertTrue(result["restored"])
        self.assertEqual(self.target_hash(), before_apply)
        self.assertEqual(self.target.read_bytes(), backup_bytes)
        store = self.store()
        self.assertIsNone(store["appliedRouteId"])
        self.assertIsNone(store["appliedRouteConfigSha256"])
        self.assertEqual(self.manifest(), [])
        self.assertIn("restore_completed", self.activity_types())

    def test_restore_of_old_state_without_current_route_equivalence(self):
        route = self.create_route(name="First", model="model-a")
        rev = claude_adapter.claude_routes()["routesRevision"]
        claude_adapter.claude_route_apply(route["id"], claude_adapter.RouteApplyBody(
            expectedRevision=claude_adapter._target_revision(self.profile_root), expectedRoutesRevision=rev))
        second = self.create_route(name="Second", model="model-b")
        claude_adapter.claude_route_apply(second["id"], claude_adapter.RouteApplyBody(
            expectedRevision=claude_adapter._target_revision(self.profile_root),
            expectedRoutesRevision=claude_adapter.claude_routes()["routesRevision"]))
        result = claude_adapter.claude_restore(claude_adapter.RestoreBody(
            expectedRevision=claude_adapter._target_revision(self.profile_root),
            expectedRoutesRevision=claude_adapter.claude_routes()["routesRevision"]))
        self.assertTrue(result["restored"])
        target = json.loads(self.target.read_text(encoding="utf-8"))
        self.assertEqual(target["model"], "old")
        self.assertEqual(target["env"]["ANTHROPIC_MODEL"], "model-a")
        store = self.store()
        self.assertEqual(store["appliedRouteId"], route["id"])
        self.assertEqual(store["appliedRouteConfigSha256"], claude_adapter._fingerprint(route))


class TransactionAndManifestTests(ClaudeAdapterBase):
    def test_apply_rollback_restores_all_artifacts(self):
        route = self.create_route()
        rev = claude_adapter.claude_routes()["routesRevision"]
        previous_store = self.routes_file.read_bytes()
        previous_manifest = None
        previous_activity = None
        with patch.object(claude_adapter, "_write_manifest", side_effect=OSError("boom")):
            with self.assertRaises(HTTPException) as ctx:
                claude_adapter.claude_route_apply(route["id"], claude_adapter.RouteApplyBody(
                    expectedRevision=claude_adapter._target_revision(self.profile_root), expectedRoutesRevision=rev))
            self.assertEqual(ctx.exception.status_code, 500)
        self.assertEqual(self.target_hash(), claude_adapter._sha256_file(self.target))
        target = json.loads(self.target.read_text(encoding="utf-8"))
        self.assertEqual(target["model"], "old")
        self.assertEqual(self.routes_file.read_bytes(), previous_store)

    def test_store_activity_transaction_rollback(self):
        route = self.create_route()
        previous_store = self.routes_file.read_bytes()
        with patch.object(claude_adapter, "_append_activity", side_effect=OSError("boom")):
            with self.assertRaises(HTTPException) as ctx:
                self.create_route(name="Failing")
            self.assertEqual(ctx.exception.status_code, 500)
        self.assertEqual(self.routes_file.read_bytes(), previous_store)
        self.assertEqual(len(self.store()["routes"]), 1)

    def test_manifest_cap_and_prune(self):
        route = self.create_route()
        for i in range(claude_adapter.MANIFEST_CAP + 2):
            route = self.create_route(name=f"Route{i}")
            claude_adapter.claude_route_apply(route["id"], claude_adapter.RouteApplyBody(
                expectedRevision=claude_adapter._target_revision(self.profile_root),
                expectedRoutesRevision=claude_adapter.claude_routes()["routesRevision"]))
        manifest = self.manifest()
        self.assertLessEqual(len(manifest), claude_adapter.MANIFEST_CAP)
        backups = list((self.profile_root / ".claude" / "backup").glob("settings.backup.*.json"))
        self.assertLessEqual(len(backups), claude_adapter.MANIFEST_CAP + 1)

    def test_activity_capped_and_redacted(self):
        route = self.create_route()
        for i in range(claude_adapter.ACTIVITY_CAP + 50):
            claude_adapter._append_activity("route_applied", route["id"])
        result = claude_adapter.claude_activity(limit=500)
        self.assertLessEqual(result["count"], claude_adapter.ACTIVITY_CAP)
        self.assertEqual(result["cappedAt"], claude_adapter.ACTIVITY_CAP)
        for event in result["events"]:
            self.assertEqual(set(event), {"ts", "type", "routeId"})
            self.assertNotIn(FAKE_KEY, json.dumps(event))
            self.assertNotIn("\\Users\\", json.dumps(event))

    def test_concurrent_mutations_serialize(self):
        errors = []

        def worker(name):
            try:
                self.create_route(name=name)
            except Exception as exc:
                errors.append(exc)

        threads = [threading.Thread(target=worker, args=(f"T{i}",)) for i in range(6)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()
        self.assertEqual(errors, [])
        store = self.store()
        self.assertEqual(len(store["routes"]), 6)
        self.assertIsNotNone(self.routes_file.read_text(encoding="utf-8"))

    def test_responses_contain_no_absolute_paths(self):
        route = self.create_route()
        for result in (claude_adapter.claude_status(), claude_adapter.claude_routes(), claude_adapter.claude_route_detail(route["id"]), claude_adapter.claude_activity()):
            text = json.dumps(result)
            self.assertNotIn("\\Users\\", text)
            self.assertNotIn(":\\", text)


class BindingTests(ClaudeAdapterBase):
    def test_binding_different_roots_and_case_equivalence(self):
        a = claude_adapter._binding_sha(Path("C:/Users/Alpha/App"))
        b = claude_adapter._binding_sha(Path("c:\\users\\alpha\\app"))
        c = claude_adapter._binding_sha(Path("D:/Other/Root"))
        self.assertEqual(a, b)
        self.assertNotEqual(a, c)


class HostOriginTests(ClaudeAdapterBase):
    class FakeHeaders:
        def __init__(self, host, origin):
            self._data = {"host": host}
            if origin is not None:
                self._data["origin"] = origin

        def get(self, key, default=None):
            return self._data.get(key, default)

    class FakeRequest:
        def __init__(self, headers):
            self.headers = headers

    def _check(self, host, origin):
        req = self.FakeRequest(self.FakeHeaders(host, origin))
        claude_adapter._check_origin(req)

    def test_valid_same_origin_passes(self):
        self._check("127.0.0.1:9090", "http://127.0.0.1:9090")
        self._check("localhost:9090", "http://localhost:9090")

    def test_missing_origin_with_valid_host_passes(self):
        self._check("127.0.0.1:9090", None)

    def test_malicious_origin_rejected(self):
        for origin in ("http://evil.example", "http://127.0.0.1:8080", "https://127.0.0.1:9090"):
            with self.assertRaises(HTTPException) as ctx:
                self._check("127.0.0.1:9090", origin)
            self.assertEqual(ctx.exception.status_code, 403)

    def test_bad_host_rejected(self):
        for host in ("evil.example", "127.0.0.1:8080", ""):
            with self.assertRaises(HTTPException) as ctx:
                self._check(host, None)
            self.assertEqual(ctx.exception.status_code, 403)


class StaticSafetyTests(ClaudeAdapterBase):
    def test_gitignore_rules_runtime_state(self):
        text = (config.APP_DIR / ".gitignore").read_text(encoding="utf-8")
        self.assertIn("state/", text.splitlines())

    def test_fake_markers_never_in_responses(self):
        route = self.create_route()
        rev = claude_adapter.claude_routes()["routesRevision"]
        result = claude_adapter.claude_route_apply(route["id"], claude_adapter.RouteApplyBody(
            expectedRevision=claude_adapter._target_revision(self.profile_root), expectedRoutesRevision=rev))
        text = json.dumps(result)
        self.assertNotIn(FAKE_KEY, text)
        self.assertNotIn(FAKE_TOKEN, text)

    def test_source_scan_no_literals(self):
        source = Path(claude_adapter.__file__).read_text(encoding="utf-8")
        self.assertNotIn(("." + "claude" + ".json"), source)
        self.assertNotIn(("." + "jsonc"), source)
        self.assertNotIn("\\Users\\", source)
        self.assertNotIn("sk-", source)
        self.assertNotIn("Bearer", source)
        config_source = Path(config.__file__).read_text(encoding="utf-8")
        self.assertNotIn(("." + "claude" + ".json"), config_source)

    def test_manifest_entries_have_all_fields(self):
        route = self.create_route()
        rev = claude_adapter.claude_routes()["routesRevision"]
        claude_adapter.claude_route_apply(route["id"], claude_adapter.RouteApplyBody(
            expectedRevision=claude_adapter._target_revision(self.profile_root), expectedRoutesRevision=rev))
        entry = self.manifest()[0]
        self.assertEqual(len(entry), 15)

    def test_core_version_observable(self):
        route = self.create_route()
        rev = claude_adapter.claude_routes()["routesRevision"]
        claude_adapter.claude_route_apply(route["id"], claude_adapter.RouteApplyBody(
            expectedRevision=claude_adapter._target_revision(self.profile_root), expectedRoutesRevision=rev))
        entry = self.manifest()[0]
        self.assertEqual(entry["coreVersion"], "0.3.0")
        self.assertEqual(entry["schemaIdentity"], claude_adapter._sha256_file(claude_adapter.CLAUDE_SCHEMA))


class FingerprintContractTests(ClaudeAdapterBase):
    def test_route_responses_carry_derived_config_sha256(self):
        route = self.create_route()
        result = claude_adapter.claude_routes()
        view = result["routes"][0]
        self.assertEqual(view["configSha256"], claude_adapter._fingerprint(route))
        self.assertRegex(view["configSha256"], r"^[0-9a-f]{64}$")
        detail = claude_adapter.claude_route_detail(route["id"])
        self.assertEqual(detail["route"]["configSha256"], claude_adapter._fingerprint(route))

    def test_config_sha256_not_persisted_in_store(self):
        route = self.create_route()
        self.assertNotIn("configSha256", self.store()["routes"][0])

    def test_applied_renders_when_id_and_fingerprint_match(self):
        route = self.create_route()
        rev = claude_adapter.claude_routes()["routesRevision"]
        claude_adapter.claude_route_apply(route["id"], claude_adapter.RouteApplyBody(
            expectedRevision=claude_adapter._target_revision(self.profile_root), expectedRoutesRevision=rev))
        result = claude_adapter.claude_routes()
        view = result["routes"][0]
        self.assertEqual(result["appliedRouteId"], view["id"])
        self.assertEqual(result["appliedRouteConfigSha256"], view["configSha256"])
        edited = claude_adapter.claude_route_edit(view["id"], claude_adapter.RouteEditBody(
            name=view["name"], baseUrl=view["baseUrl"], authKind=view["authKind"], secretEnvRef=view["secretEnvRef"],
            model="other-model", gatewayDiscovery=view["gatewayDiscovery"], disableExperimentalBetas=view["disableExperimentalBetas"],
            autoCompactWindow=view["autoCompactWindow"], disableNonessentialTraffic=view["disableNonessentialTraffic"],
            expectedRoutesRevision=result["routesRevision"]))
        after = claude_adapter.claude_routes()
        edited_view = after["routes"][0]
        self.assertNotEqual(after["appliedRouteConfigSha256"], edited_view["configSha256"])


class ApplyOutputValidationTests(ClaudeAdapterBase):
    def _fake_apply_output(self, route=None, **overrides):
        if route is None:
            route = self.create_route()
        profile = claude_adapter._routing_profile(route)
        profile_path = self.tmp / "profile.json"
        profile_path.write_text(json.dumps(profile), encoding="utf-8")
        self._profile_path = profile_path
        before = claude_adapter._sha256_file(self.target)
        output = {
            "ok": True,
            "backupName": "settings.backup.20260814000000000.aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.json",
            "backupSha256": "0" * 64,
            "preWriteTargetSha256": before,
            "postWriteTargetSha256": "1" * 64,
            "coreVersion": "0.2.0",
            "schemaIdentity": claude_adapter._sha256_file(claude_adapter.CLAUDE_SCHEMA),
        }
        output.update(overrides)
        return route, output

    def _apply_with_fake(self, route, output):
        def fake_run(args, timeout=120):
            if "-Operation" in args and "Apply" in args:
                return 0, json.dumps(output), ""
            if "-Operation" in args and "Restore" in args:
                idx = args.index("-BackupPath")
                backup_sha = claude_adapter._sha256_file(args[idx + 1])
                return 0, json.dumps({"ok": True, "restoredTargetSha256": backup_sha, "coreVersion": "0.2.0", "schemaIdentity": claude_adapter._sha256_file(claude_adapter.CLAUDE_SCHEMA)}), ""
            raise AssertionError("unexpected production call")
        with patch.object(claude_adapter, "_run_production", side_effect=fake_run):
            rev = claude_adapter.claude_routes()["routesRevision"]
            return claude_adapter.claude_route_apply(route["id"], claude_adapter.RouteApplyBody(
                expectedRevision=claude_adapter._target_revision(self.profile_root), expectedRoutesRevision=rev))

    def test_wrong_schema_identity_rejected_without_commit(self):
        route, output = self._fake_apply_output(schemaIdentity="f" * 64)
        before_store = claude_adapter._store_bytes()
        with self.assertRaises(HTTPException) as ctx:
            self._apply_with_fake(route, output)
        self.assertEqual(ctx.exception.status_code, 500)
        self.assertEqual(claude_adapter._store_bytes(), before_store)
        self.assertEqual(self.manifest(), [])

    def test_wrong_prewrite_hash_rejected(self):
        route, output = self._fake_apply_output(preWriteTargetSha256="d" * 64)
        with self.assertRaises(HTTPException) as ctx:
            self._apply_with_fake(route, output)
        self.assertEqual(ctx.exception.status_code, 500)

    def test_missing_metadata_fields_rejected(self):
        route = self.create_route()
        for drop in ("backupName", "backupSha256", "postWriteTargetSha256"):
            _, output = self._fake_apply_output(route)
            output.pop(drop)
            with self.assertRaises(HTTPException) as ctx:
                self._apply_with_fake(route, output)
            self.assertEqual(ctx.exception.status_code, 500)

    def test_invalid_backup_name_rejected(self):
        route, output = self._fake_apply_output(backupName="evil.txt")
        with self.assertRaises(HTTPException) as ctx:
            self._apply_with_fake(route, output)
        self.assertEqual(ctx.exception.status_code, 500)


class RestoreEligibilityAndRollbackTests(ClaudeAdapterBase):
    def _applied(self):
        route = self.create_route()
        rev = claude_adapter.claude_routes()["routesRevision"]
        claude_adapter.claude_route_apply(route["id"], claude_adapter.RouteApplyBody(
            expectedRevision=claude_adapter._target_revision(self.profile_root), expectedRoutesRevision=rev))
        return route

    def test_malformed_target_backup_rejected_before_mutation(self):
        self._applied()
        entry = self.manifest()[-1]
        backup = self.profile_root / ".claude" / "backup" / entry["backupName"]
        backup.write_text("{not json", encoding="utf-8")
        before = self.target_hash()
        with self.assertRaises(HTTPException) as ctx:
            claude_adapter.claude_restore(claude_adapter.RestoreBody(
                expectedRevision=claude_adapter._target_revision(self.profile_root),
                expectedRoutesRevision=claude_adapter.claude_routes()["routesRevision"]))
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertEqual(self.target_hash(), before)

    def test_duplicate_key_target_backup_rejected_before_mutation(self):
        self._applied()
        entry = self.manifest()[-1]
        backup = self.profile_root / ".claude" / "backup" / entry["backupName"]
        backup.write_text('{"model":"a","model":"b"}', encoding="utf-8")
        before = self.target_hash()
        with self.assertRaises(HTTPException) as ctx:
            claude_adapter.claude_restore(claude_adapter.RestoreBody(
                expectedRevision=claude_adapter._target_revision(self.profile_root),
                expectedRoutesRevision=claude_adapter.claude_routes()["routesRevision"]))
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertEqual(self.target_hash(), before)

    def test_invalid_route_store_backup_rejected_before_mutation(self):
        self._applied()
        entry = self.manifest()[-1]
        store_backup = self.routes_file.parent / entry["previousStoreBackupName"]
        store_backup.write_text('{"version": 99, "routes": []}', encoding="utf-8")
        before = self.target_hash()
        with self.assertRaises(HTTPException) as ctx:
            claude_adapter.claude_restore(claude_adapter.RestoreBody(
                expectedRevision=claude_adapter._target_revision(self.profile_root),
                expectedRoutesRevision=claude_adapter.claude_routes()["routesRevision"]))
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertEqual(self.target_hash(), before)

    def test_restore_rollback_on_manifest_write_failure(self):
        route = self._applied()
        before_target = self.target_hash()
        before_store = self.routes_file.read_bytes()
        with patch.object(claude_adapter, "_write_manifest", side_effect=OSError("boom")):
            with self.assertRaises(HTTPException) as ctx:
                claude_adapter.claude_restore(claude_adapter.RestoreBody(
                    expectedRevision=claude_adapter._target_revision(self.profile_root),
                    expectedRoutesRevision=claude_adapter.claude_routes()["routesRevision"]))
            self.assertEqual(ctx.exception.status_code, 500)
        self.assertEqual(self.target_hash(), before_target)
        self.assertEqual(self.routes_file.read_bytes(), before_store)
        self.assertEqual(len(self.manifest()), 1)

    def test_restore_rejects_wrong_returned_schema_identity(self):
        self._applied()
        entry = self.manifest()[-1]

        def fake_run(args, timeout=120):
            return 0, json.dumps({"ok": True, "restoredTargetSha256": "0" * 64, "coreVersion": "0.2.0", "schemaIdentity": "f" * 64}), ""
        with patch.object(claude_adapter, "_run_production", side_effect=fake_run):
            with self.assertRaises(HTTPException) as ctx:
                claude_adapter.claude_restore(claude_adapter.RestoreBody(
                    expectedRevision=claude_adapter._target_revision(self.profile_root),
                    expectedRoutesRevision=claude_adapter.claude_routes()["routesRevision"]))
            self.assertEqual(ctx.exception.status_code, 500)
        self.assertEqual(len(self.manifest()), 1)


class RestoreBoundaryStageTests(ClaudeAdapterBase):
    def _restore_via_entry(self, stage, target, backup_path, schema, binding):
        cmd = [claude_adapter.PS1, *claude_adapter.PS1_ARGS, str(claude_adapter.PRODUCTION_ENTRY),
               "-Operation", "Restore", "-ProfileRoot", str(self.profile_root), "-SettingsPath", str(target),
               "-SchemaPath", str(schema), "-BackupPath", str(backup_path),
               "-ExpectedBackupSha256", claude_adapter._sha256_file(backup_path),
               "-TargetBindingSha256", binding, "-TestFailureStage", stage]
        proc = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=120)
        return proc.returncode, (proc.stdout + proc.stderr)

    def test_restore_synthetic_boundaries(self):
        route = self.create_route()
        rev = claude_adapter.claude_routes()["routesRevision"]
        claude_adapter.claude_route_apply(route["id"], claude_adapter.RouteApplyBody(
            expectedRevision=claude_adapter._target_revision(self.profile_root), expectedRoutesRevision=rev))
        entry = self.manifest()[-1]
        target = self.profile_root / ".claude" / "settings.json"
        backup = self.profile_root / ".claude" / "backup" / entry["backupName"]
        binding = claude_adapter._binding_sha(self.profile_root)
        for stage, expected_exit in (("AfterBackup", 1), ("AfterTempWrite", 1), ("AfterReplace", 1), ("AfterRecoveryCopy", 2), ("AfterRecoveryReplace", 2)):
            before = self.target_hash()
            code, output = self._restore_via_entry(stage, target, backup, claude_adapter.CLAUDE_SCHEMA, binding)
            self.assertEqual(code, expected_exit, f"{stage} exit class: {output}")
            json.loads(target.read_text(encoding="utf-8"))
            if stage == "AfterRecoveryCopy":
                self.assertEqual(self.target_hash(), claude_adapter._sha256_file(backup), f"{stage} leaves the replaced backup content")
            else:
                self.assertEqual(self.target_hash(), before, f"{stage} must leave the original target")

    def test_apply_boundaries_restore_target(self):
        route = self.create_route()
        rev = claude_adapter.claude_routes()["routesRevision"]
        before = self.target_hash()
        profile = claude_adapter._routing_profile(route)
        profile_path = self.tmp / "profile.json"
        profile_path.write_text(json.dumps(profile), encoding="utf-8")
        schema = claude_adapter.CLAUDE_SCHEMA
        target = self.profile_root / ".claude" / "settings.json"
        for stage in ("AfterBackup", "AfterTempWrite", "AfterReplace"):
            code, output = (lambda s: (lambda p: (p.returncode, p.stdout + p.stderr))(subprocess.run(
                [claude_adapter.PS1, *claude_adapter.PS1_ARGS, str(claude_adapter.PRODUCTION_ENTRY),
                 "-Operation", "Apply", "-ProfileRoot", str(self.profile_root), "-SettingsPath", str(target),
                 "-RoutingProfilePath", str(profile_path), "-SchemaPath", str(schema), "-TestFailureStage", s],
                capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=120)))(stage)
            self.assertEqual(code, 1, f"{stage} exit 1")
            json.loads(target.read_text(encoding="utf-8"))
            self.assertEqual(self.target_hash(), before, f"{stage} must restore the target")


class ActivityRetentionTests(ClaudeAdapterBase):
    def test_activity_keeps_exactly_newest_200_single_line_events(self):
        route = self.create_route()
        for i in range(250):
            claude_adapter._append_activity("route_applied", route["id"])
        text = self.activity_file.read_text(encoding="utf-8")
        lines = [line for line in text.splitlines()]
        self.assertEqual(len(lines), 200)
        for line in lines:
            self.assertEqual(line.count("\n"), 0)
            event = json.loads(line)
            self.assertEqual(set(event), {"ts", "type", "routeId"})


class TargetBindingContractTests(ClaudeAdapterBase):
    def test_binding_is_over_the_settings_target_and_passed_to_restore(self):
        route = self.create_route()
        rev = claude_adapter.claude_routes()["routesRevision"]
        claude_adapter.claude_route_apply(route["id"], claude_adapter.RouteApplyBody(
            expectedRevision=claude_adapter._target_revision(self.profile_root), expectedRoutesRevision=rev))
        entry = self.manifest()[-1]
        self.assertEqual(entry["targetBindingSha256"], claude_adapter._binding_sha(self.profile_root))
        captured = {}

        def fake_run(args, timeout=120):
            captured["args"] = list(args)
            return 1, "", "VALIDATION FAILED; fake"
        with patch.object(claude_adapter, "_run_production", side_effect=fake_run):
            with self.assertRaises(HTTPException):
                claude_adapter.claude_restore(claude_adapter.RestoreBody(
                    expectedRevision=claude_adapter._target_revision(self.profile_root),
                    expectedRoutesRevision=claude_adapter.claude_routes()["routesRevision"]))
        self.assertIn("-TargetBindingSha256", captured["args"])
        self.assertEqual(captured["args"][captured["args"].index("-TargetBindingSha256") + 1], entry["targetBindingSha256"])


class ProductionCliContractTests(ClaudeAdapterBase):
    def _cli(self, extra):
        target = self.profile_root / ".claude" / "settings.json"
        cmd = [claude_adapter.PS1, *claude_adapter.PS1_ARGS, str(claude_adapter.PRODUCTION_ENTRY),
               "-Operation", "Apply", "-ProfileRoot", str(self.profile_root), "-SettingsPath", str(target),
               "-SchemaPath", str(claude_adapter.CLAUDE_SCHEMA)] + extra
        return subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=120)

    def test_forbidden_combinations_rejected_before_mutation(self):
        route = self.create_route()
        profile = claude_adapter._routing_profile(route)
        profile_path = self.tmp / "profile.json"
        profile_path.write_text(json.dumps(profile), encoding="utf-8")
        backup = self.tmp / "settings.backup.20260814000000000.cccccccccccccccccccccccccccccccccc.json"
        backup.write_text("{}", encoding="utf-8")
        before = self.target_hash()
        cases = [
            ["-RoutingProfilePath", str(profile_path), "-BackupPath", str(backup)],
            ["-RoutingProfilePath", str(profile_path), "-ExpectedBackupSha256", "0" * 64],
            ["-RoutingProfilePath", str(profile_path), "-TargetBindingSha256", "0" * 64],
        ]
        for extra in cases:
            proc = self._cli(extra)
            self.assertNotEqual(proc.returncode, 0, f"accepted: {extra}")
        self.assertEqual(self.target_hash(), before)

    def test_missing_apply_parameters_rejected(self):
        proc = self._cli([])
        self.assertNotEqual(proc.returncode, 0)

    def test_restore_parameter_matrix(self):
        route = self.create_route()
        rev = claude_adapter.claude_routes()["routesRevision"]
        claude_adapter.claude_route_apply(route["id"], claude_adapter.RouteApplyBody(
            expectedRevision=claude_adapter._target_revision(self.profile_root), expectedRoutesRevision=rev))
        entry = self.manifest()[-1]
        target = self.profile_root / ".claude" / "settings.json"
        backup = self.profile_root / ".claude" / "backup" / entry["backupName"]
        binding = claude_adapter._binding_sha(self.profile_root)
        profile = claude_adapter._routing_profile(route)
        profile_path = self.tmp / "profile.json"
        profile_path.write_text(json.dumps(profile), encoding="utf-8")
        base = [claude_adapter.PS1, *claude_adapter.PS1_ARGS, str(claude_adapter.PRODUCTION_ENTRY),
                "-Operation", "Restore", "-ProfileRoot", str(self.profile_root), "-SettingsPath", str(target),
                "-SchemaPath", str(claude_adapter.CLAUDE_SCHEMA)]
        with_profile = base + ["-RoutingProfilePath", str(profile_path)]
        self.assertNotEqual(subprocess.run(with_profile, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=120).returncode, 0)
        missing_expected = base + ["-BackupPath", str(backup), "-ExpectedBackupSha256", "0" * 64, "-TargetBindingSha256", binding]
        self.assertNotEqual(subprocess.run(missing_expected, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=120).returncode, 0)
        valid = base + ["-BackupPath", str(backup), "-ExpectedBackupSha256", claude_adapter._sha256_file(backup), "-TargetBindingSha256", binding]
        proc = subprocess.run(valid, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=120)
        self.assertEqual(proc.returncode, 0, proc.stdout + proc.stderr)

    def test_restore_rejects_wrong_binding_before_mutation(self):
        route = self.create_route()
        rev = claude_adapter.claude_routes()["routesRevision"]
        claude_adapter.claude_route_apply(route["id"], claude_adapter.RouteApplyBody(
            expectedRevision=claude_adapter._target_revision(self.profile_root), expectedRoutesRevision=rev))
        entry = self.manifest()[-1]
        target = self.profile_root / ".claude" / "settings.json"
        backup = self.profile_root / ".claude" / "backup" / entry["backupName"]
        before = self.target_hash()
        cmd = [claude_adapter.PS1, *claude_adapter.PS1_ARGS, str(claude_adapter.PRODUCTION_ENTRY),
               "-Operation", "Restore", "-ProfileRoot", str(self.profile_root), "-SettingsPath", str(target),
               "-SchemaPath", str(claude_adapter.CLAUDE_SCHEMA), "-BackupPath", str(backup),
               "-ExpectedBackupSha256", claude_adapter._sha256_file(backup), "-TargetBindingSha256", "0" * 64]
        proc = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=120)
        self.assertNotEqual(proc.returncode, 0)
        self.assertEqual(self.target_hash(), before)


class LockedEndpointCoverageTests(ClaudeAdapterBase):
    def test_locked_every_real_target_mutation(self):
        route = self.create_route()
        with patch.object(claude_adapter, "get_profile_root", return_value=Path.home()):
            with patch.object(claude_adapter, "_probe_settings_present", side_effect=AssertionError("probed")):
                routes = claude_adapter.claude_routes()
                self.assertTrue(routes["realTargetLocked"])
                # App-owned store revision stays available so CRUD works while
                # locked; only the target-file revision stays gated.
                self.assertIsInstance(routes["routesRevision"], str)
                self.assertNotIn("revision", routes)
                detail = claude_adapter.claude_route_detail(route["id"])
                self.assertTrue(detail["realTargetLocked"])
                for call in (
                    lambda: claude_adapter.claude_route_apply(route["id"], claude_adapter.RouteApplyBody(expectedRevision="0" * 64, expectedRoutesRevision="0" * 64)),
                    lambda: claude_adapter.claude_restore(claude_adapter.RestoreBody(expectedRevision="0" * 64, expectedRoutesRevision="0" * 64)),
                ):
                    with self.assertRaises(HTTPException) as ctx:
                        call()
                    self.assertEqual(ctx.exception.status_code, 503)

    def test_connect_registers_app_state_while_locked_without_probing(self):
        with patch.object(claude_adapter, "get_profile_root", return_value=Path.home()):
            with patch.object(claude_adapter, "_probe_settings_present", side_effect=AssertionError("probed")):
                with patch.object(agentstore, "upsert_agent") as upsert:
                    result = claude_adapter.claude_connect(claude_adapter.ConnectBody())
        self.assertEqual(result, {"ok": True, "active": "claude-code"})
        upsert.assert_called_once_with("claude-code", str(Path.home() / ".claude"))

    def test_scan_reports_saved_routes_without_real_access(self):
        self.create_route(name="Main", model="sonnet")
        with patch.object(claude_adapter, "_probe_settings_present", side_effect=AssertionError("probed")):
            result = claude_adapter.claude_scan()
        self.assertEqual(result["agent"], "claude-code")
        self.assertEqual(result["providers"], ["Main"])
        self.assertEqual(result["savedRoutes"], 1)
        self.assertEqual(result["mcps"], [])
        self.assertEqual(result["plugins"], [])
        self.assertIs(result["split"], False)
        self.assertIs(result["hasBuilder"], False)
        self.assertIs(result["realTargetLocked"], False)

    def test_scan_locked_reports_app_state_and_lock_flag(self):
        self.create_route(name="Main", model="sonnet")
        with patch.object(claude_adapter, "get_profile_root", return_value=Path.home()):
            with patch.object(claude_adapter, "_probe_settings_present", side_effect=AssertionError("probed")):
                result = claude_adapter.claude_scan()
        self.assertEqual(result["savedRoutes"], 1)
        self.assertEqual(result["providers"], ["Main"])
        self.assertIs(result["realTargetLocked"], True)

    def test_scan_includes_read_only_inventory_from_state_file(self):
        self.create_route(name="Main", model="sonnet")
        state_file = self.profile_root / ".claude.json"
        state_file.write_text(json.dumps({
            "mcpServers": {"filesystem": {"command": "npx", "args": ["-y", "fs"]}},
            "projects": {"C:\\Users\\you\\app": {"mcpServers": {"db": {"type": "http", "url": "https://db.test/mcp"}}}},
            "plugins": ["skills@market"],
        }), encoding="utf-8")
        with patch.object(claude_adapter, "_probe_settings_present", side_effect=AssertionError("probed")):
            result = claude_adapter.claude_scan()
        self.assertIs(result["statePresent"], True)
        self.assertIs(result["stateParseError"], False)
        self.assertEqual(result["projectCount"], 1)
        by_name = {m["name"]: m for m in result["mcps"]}
        self.assertEqual(by_name["filesystem"]["scope"], "user")
        self.assertEqual(by_name["filesystem"]["type"], "stdio")
        self.assertEqual(by_name["db"]["scope"], "project")
        self.assertEqual(by_name["db"]["project"], "app")
        self.assertEqual(result["plugins"], ["skills@market"])
        self.assertEqual(result["savedRoutes"], 1)
        self.assertIs(result["realTargetLocked"], False)
        self.assertNotIn("env", json.dumps(result))
        self.assertNotIn("https://db.test", json.dumps(result))


class EnvVarLifecycleTests(ClaudeAdapterBase):
    """Credential store flow (session 48): route key values are stored in the
    app's Windows DPAPI-encrypted store (never the environment/registry); the
    route keeps only the reference name. DPAPI + the store file are patched in
    the base class, so no real encryption or registry is touched."""

    def setUp(self):
        super().setUp()
        patchers = [
            patch.object(claude_adapter.claude_envvars, "user_env_exists", return_value=False),
            patch.object(claude_adapter.claude_envvars, "set_user_env"),
            patch.object(claude_adapter.claude_envvars, "delete_user_env"),
        ]
        for p in patchers:
            p.start()
            self.addCleanup(p.stop)

    def create_body(self, ref="BDF_GATE4A_API_KEY_REF", secret_value="", name="Main"):
        return claude_adapter.RouteCreateBody(
            name=name, baseUrl="https://api.example.test/v1", authKind="apiKey",
            secretEnvRef=ref, model="sonnet",
            gatewayDiscovery=True, disableExperimentalBetas=True,
            autoCompactWindow=190000, disableNonessentialTraffic=False,
            secretValue=secret_value,
        )

    def edit_body(self, ref="BDF_GATE4A_API_KEY_REF", secret_value="", name="Main"):
        return claude_adapter.RouteEditBody(
            name=name, baseUrl="https://api.example.test/v1", authKind="apiKey",
            secretEnvRef=ref, model="sonnet",
            gatewayDiscovery=True, disableExperimentalBetas=True,
            autoCompactWindow=190000, disableNonessentialTraffic=False,
            secretValue=secret_value,
            expectedRoutesRevision=claude_adapter.claude_routes()["routesRevision"],
        )

    def test_create_with_secret_stores_in_dpapi_and_marks_managed(self):
        route = claude_adapter.claude_route_create(self.create_body(secret_value="sk-test-value"))["route"]
        self.assertEqual(route["credentialBackend"], "store")
        self.assertTrue(route["envVarManaged"])
        self.assertEqual(claude_adapter.claude_credentials.resolve("BDF_GATE4A_API_KEY_REF"), "sk-test-value")
        self.assertNotIn("sk-test-value", json.dumps(claude_adapter.claude_routes()))

    def test_create_without_secret_never_stores(self):
        route = claude_adapter.claude_route_create(self.create_body(secret_value=""))["route"]
        self.assertEqual(route["credentialBackend"], "env")
        self.assertFalse(route["envVarManaged"])
        self.assertFalse(claude_adapter.claude_credentials.has("BDF_GATE4A_API_KEY_REF"))

    def test_create_with_secret_removes_stale_app_created_env_var(self):
        with patch.object(claude_adapter.claude_envvars, "user_env_exists", return_value=True):
            claude_adapter.claude_route_create(self.create_body(secret_value="sk-test"))
        claude_adapter.claude_envvars.delete_user_env.assert_called_once_with("BDF_GATE4A_API_KEY_REF")

    def test_edit_updates_store_value(self):
        claude_adapter.claude_route_create(self.create_body(secret_value="first"))
        edited = claude_adapter.claude_route_edit(
            claude_adapter.claude_routes()["routes"][0]["id"], self.edit_body(secret_value="second"))["route"]
        self.assertEqual(edited["credentialBackend"], "store")
        self.assertTrue(edited["envVarManaged"])
        self.assertEqual(claude_adapter.claude_credentials.resolve("BDF_GATE4A_API_KEY_REF"), "second")

    def test_edit_without_new_secret_keeps_fingerprint_applied(self):
        route = claude_adapter.claude_route_create(self.create_body(secret_value="first"))["route"]
        store = self.store()
        store["appliedRouteId"] = route["id"]
        store["appliedRouteConfigSha256"] = route["configSha256"]
        claude_adapter._atomic_write(
            self.routes_file, json.dumps(store, indent=2, ensure_ascii=False) + "\n"
        )
        edited = claude_adapter.claude_route_edit(
            route["id"], self.edit_body(secret_value="", name="Renamed"))["route"]

        self.assertEqual(edited["configSha256"], route["configSha256"])
        self.assertEqual(claude_adapter.claude_credentials.resolve("BDF_GATE4A_API_KEY_REF"), "first")
        self.assertNotIn("credentialRevision", edited)
        after = self.store()
        self.assertEqual(after["appliedRouteConfigSha256"], edited["configSha256"])

    def test_shared_credential_rotation_invalidates_every_referencing_route(self):
        first = claude_adapter.claude_route_create(
            self.create_body(secret_value="", name="First"))["route"]
        store = self.store()
        store["appliedRouteId"] = first["id"]
        store["appliedRouteConfigSha256"] = first["configSha256"]
        claude_adapter._atomic_write(
            self.routes_file, json.dumps(store, indent=2, ensure_ascii=False) + "\n"
        )
        second = claude_adapter.claude_route_create(
            self.create_body(secret_value="second", name="Second"))["route"]
        create_result = claude_adapter.claude_routes()
        after_create = {route["id"]: route for route in create_result["routes"]}

        self.assertNotEqual(create_result["appliedRouteConfigSha256"], after_create[first["id"]]["configSha256"])
        self.assertNotEqual(after_create[first["id"]]["configSha256"], first["configSha256"])

        before_edit = {route_id: route["configSha256"] for route_id, route in after_create.items()}
        claude_adapter.claude_route_edit(
            second["id"], self.edit_body(secret_value="third", name="Second"))
        after_edit = {route["id"]: route for route in claude_adapter.claude_routes()["routes"]}
        self.assertEqual(after_create[first["id"]]["credentialBackend"], "store")
        self.assertTrue(after_create[first["id"]]["envVarManaged"])

        self.assertNotEqual(after_edit[first["id"]]["configSha256"], before_edit[first["id"]])
        self.assertNotEqual(after_edit[second["id"]]["configSha256"], before_edit[second["id"]])
        self.assertEqual(
            claude_adapter.claude_credentials.resolve("BDF_GATE4A_API_KEY_REF"), "third")

    def test_failed_route_commit_restores_previous_stored_credential(self):
        route = claude_adapter.claude_route_create(
            self.create_body(secret_value="first"))["route"]
        original_store = self.routes_file.read_bytes()
        os.environ["BDF_GATE4A_API_KEY_REF"] = "process-before"

        with patch.object(claude_adapter.claude_envvars, "user_env_exists", return_value=True), \
                patch.object(claude_adapter.claude_envvars, "user_env_get", return_value="legacy-env"), \
                patch.object(claude_adapter.claude_envvars, "delete_user_env",
                             side_effect=lambda name: os.environ.pop(name, None)), \
                patch.object(claude_adapter, "_commit_store_and_activity",
                             side_effect=HTTPException(500, "simulated route commit failure")):
            with self.assertRaises(HTTPException):
                claude_adapter.claude_route_edit(
                    route["id"], self.edit_body(secret_value="second"))

        self.assertEqual(self.routes_file.read_bytes(), original_store)
        self.assertEqual(claude_adapter.claude_credentials.resolve("BDF_GATE4A_API_KEY_REF"), "first")
        claude_adapter.claude_envvars.set_user_env.assert_called_with(
            "BDF_GATE4A_API_KEY_REF", "legacy-env")

        self.assertEqual(os.environ["BDF_GATE4A_API_KEY_REF"], "process-before")

    def test_revision_generation_failure_does_not_replace_credential(self):
        route = claude_adapter.claude_route_create(
            self.create_body(secret_value="first"))["route"]
        original_store = self.routes_file.read_bytes()

        with patch.object(claude_adapter.secrets, "token_hex", side_effect=OSError("rng failed")):
            with self.assertRaises(OSError):
                claude_adapter.claude_route_edit(
                    route["id"], self.edit_body(secret_value="second"))

        self.assertEqual(self.routes_file.read_bytes(), original_store)
        self.assertEqual(claude_adapter.claude_credentials.resolve("BDF_GATE4A_API_KEY_REF"), "first")


    def test_shared_reference_migration_prefers_existing_stored_credential(self):
        target = claude_adapter.claude_route_create(
            self.create_body(ref="BDF_GATE4A_TOKEN_REF", name="Target"))["route"]
        env_route = claude_adapter.claude_route_create(
            self.create_body(name="Env"))["route"]
        stored = claude_adapter.claude_route_create(
            self.create_body(secret_value="stored-key", name="Stored"))["route"]
        store = self.store()
        store["routes"] = [
            dict(route, credentialBackend="env", envVarManaged=False)
            if route["id"] == env_route["id"]
            else route
            for route in store["routes"]
        ]
        store["routes"] = [
            {key: value for key, value in route.items() if key != "credentialRevision"}
            if route["id"] == env_route["id"]
            else route
            for route in store["routes"]
        ]
        claude_adapter._atomic_write(
            self.routes_file, json.dumps(store, indent=2, ensure_ascii=False) + "\n"
        )
        stored_view = next(
            route for route in claude_adapter.claude_routes()["routes"] if route["id"] == stored["id"]
        )

        edited = claude_adapter.claude_route_edit(
            target["id"], self.edit_body(ref="BDF_GATE4A_API_KEY_REF", name="Target"))["route"]

        self.assertEqual(edited["credentialBackend"], "store")
        self.assertTrue(edited["envVarManaged"])
        self.assertEqual(edited["configSha256"], stored_view["configSha256"])

    def test_credential_store_failure_restores_state_and_fails_save(self):
        route = claude_adapter.claude_route_create(
            self.create_body(secret_value="first"))["route"]
        original_store = self.routes_file.read_bytes()

        def partial_store(ref, value):
            claude_adapter.claude_credentials.store(ref, value)
            raise OSError("simulated credential write failure")

        with patch.object(claude_adapter, "_store_route_credential", side_effect=partial_store):
            with self.assertRaises(HTTPException) as ctx:
                claude_adapter.claude_route_edit(
                    route["id"], self.edit_body(secret_value="second"))

        self.assertEqual(ctx.exception.status_code, 500)
        self.assertEqual(self.routes_file.read_bytes(), original_store)
        self.assertEqual(
            claude_adapter.claude_credentials.resolve("BDF_GATE4A_API_KEY_REF"), "first")

    def test_delete_managed_unreferenced_removes_store_entry(self):
        route = claude_adapter.claude_route_create(self.create_body(secret_value="sk-test"))["route"]
        rev = claude_adapter.claude_routes()["routesRevision"]
        result = claude_adapter.claude_route_delete(route["id"], claude_adapter.RouteDeleteBody(expectedRoutesRevision=rev))
        self.assertTrue(result["ok"])
        self.assertFalse(claude_adapter.claude_credentials.has("BDF_GATE4A_API_KEY_REF"))

    def test_delete_unmanaged_keeps_credential(self):
        route = claude_adapter.claude_route_create(self.create_body(secret_value=""))["route"]
        rev = claude_adapter.claude_routes()["routesRevision"]
        claude_adapter.claude_route_delete(route["id"], claude_adapter.RouteDeleteBody(expectedRoutesRevision=rev))
        claude_adapter.claude_envvars.delete_user_env.assert_not_called()

    def test_delete_keeps_store_entry_when_another_route_references_it(self):
        first = claude_adapter.claude_route_create(self.create_body(secret_value="sk-test", name="First"))["route"]
        claude_adapter.claude_route_create(self.create_body(secret_value="", name="Second"))
        rev = claude_adapter.claude_routes()["routesRevision"]
        claude_adapter.claude_route_delete(first["id"], claude_adapter.RouteDeleteBody(expectedRoutesRevision=rev))
        self.assertTrue(claude_adapter.claude_credentials.has("BDF_GATE4A_API_KEY_REF"))

    def test_edit_renaming_managed_ref_removes_old_credential(self):
        route = claude_adapter.claude_route_create(self.create_body(secret_value="sk-test"))["route"]
        claude_adapter.claude_route_edit(route["id"], self.edit_body(ref="BDF_GATE4A_TOKEN_REF", secret_value=""))["route"]
        self.assertFalse(claude_adapter.claude_credentials.has("BDF_GATE4A_API_KEY_REF"))
        self.assertFalse(claude_adapter.claude_credentials.has("BDF_GATE4A_TOKEN_REF"))

    def test_apply_resolves_store_credential_into_process_env(self):
        claude_adapter.claude_route_create(self.create_body(secret_value="sk-resolve-me"))
        route = claude_adapter.claude_routes()["routes"][0]
        with patch.dict(os.environ, {}, clear=False):
            claude_adapter.claude_envvars.os.environ.pop("BDF_GATE4A_API_KEY_REF", None)
            claude_adapter._resolve_route_credential(route)
            self.assertEqual(claude_adapter.claude_envvars.os.environ.get("BDF_GATE4A_API_KEY_REF"), "sk-resolve-me")

    def test_apply_migrates_legacy_app_managed_env_var_into_store(self):
        claude_adapter.claude_route_create(self.create_body(secret_value=""))
        route = claude_adapter.claude_routes()["routes"][0]
        route["envVarManaged"] = True
        route.pop("credentialBackend", None)
        with patch.object(claude_adapter.claude_envvars, "user_env_get", return_value="sk-legacy") as getter, \
             patch.object(claude_adapter.claude_envvars, "delete_user_env") as deleter, \
             patch.dict(os.environ, {}, clear=False):
            claude_adapter.claude_envvars.os.environ.pop("BDF_GATE4A_API_KEY_REF", None)
            value = claude_adapter._resolve_route_credential(route)
        self.assertEqual(value, "sk-legacy")
        self.assertEqual(claude_adapter.claude_credentials.resolve("BDF_GATE4A_API_KEY_REF"), "sk-legacy")
        deleter.assert_not_called()
        self.assertEqual(route["credentialBackend"], "store")

    def test_apply_resolves_legacy_from_store_when_env_var_already_gone(self):
        claude_adapter.claude_route_create(self.create_body(secret_value=""))
        route = claude_adapter.claude_routes()["routes"][0]
        route["envVarManaged"] = True
        route.pop("credentialBackend", None)
        claude_adapter.claude_credentials.store("BDF_GATE4A_API_KEY_REF", "sk-stranded")
        with patch.object(claude_adapter.claude_envvars, "user_env_get", return_value=None), \
             patch.dict(os.environ, {}, clear=False):
            claude_adapter.claude_envvars.os.environ.pop("BDF_GATE4A_API_KEY_REF", None)
            value = claude_adapter._resolve_route_credential(route)
        self.assertEqual(value, "sk-stranded")

class CredentialsEndpointTests(ClaudeAdapterBase):
    def _create_route(self, ref="BDF_GATE4A_API_KEY_REF", secret="", name="Cred"):
        return claude_adapter.claude_route_create(claude_adapter.RouteCreateBody(
            name=name, baseUrl="https://api.example.test/v1", authKind="apiKey",
            secretEnvRef=ref, model="sonnet",
            gatewayDiscovery=True, disableExperimentalBetas=True,
            autoCompactWindow=190000, disableNonessentialTraffic=False,
            secretValue=secret))["route"]

    def test_credentials_lists_store_credential_with_usage(self):
        self._create_route(secret="sk-live-secret")
        result = claude_adapter.claude_credentials_list()
        entry = next((c for c in result["credentials"] if c["name"] == "BDF_GATE4A_API_KEY_REF"), None)
        self.assertIsNotNone(entry)
        self.assertEqual(entry["backend"], "store")
        self.assertEqual(entry["usedBy"], ["Cred"])
        self.assertNotIn("sk-live-secret", json.dumps(result))

    def test_credentials_excludes_pre_existing_user_env_var(self):
        self._create_route(secret="")
        result = claude_adapter.claude_credentials_list()
        self.assertNotIn("BDF_GATE4A_API_KEY_REF", [c["name"] for c in result["credentials"]])

    def test_credentials_delete_blocked_while_referenced(self):
        self._create_route(secret="sk-live-secret")
        with self.assertRaises(HTTPException) as ctx:
            claude_adapter.claude_credential_delete("BDF_GATE4A_API_KEY_REF")
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertTrue(claude_adapter.claude_credentials.has("BDF_GATE4A_API_KEY_REF"))

    def test_credentials_delete_orphan_removes_entry(self):
        route = self._create_route(secret="sk-live-secret")
        rev = claude_adapter.claude_routes()["routesRevision"]
        claude_adapter.claude_route_delete(route["id"], claude_adapter.RouteDeleteBody(expectedRoutesRevision=rev))
        self.assertFalse(claude_adapter.claude_credentials.has("BDF_GATE4A_API_KEY_REF"))

    def test_credentials_delete_missing_404(self):
        with self.assertRaises(HTTPException) as ctx:
            claude_adapter.claude_credential_delete("DOES_NOT_EXIST")
        self.assertEqual(ctx.exception.status_code, 404)

    def test_store_value_never_appears_in_routes_or_activity(self):
        self._create_route(secret="sk-top-secret-value")
        text = json.dumps(claude_adapter.claude_routes()) + "\n" + (self.activity_file.read_text(encoding="utf-8") if self.activity_file.exists() else "")
        self.assertNotIn("sk-top-secret-value", text)


class EnsureProcessEnvTests(unittest.TestCase):
    def test_missing_from_process_resolves_from_user_scope(self):
        with patch.object(claude_adapter.claude_envvars, "user_env_get", return_value="sk-registry-value") as getter, \
             patch.dict(os.environ, {}, clear=False):
            claude_adapter.claude_envvars.os.environ.pop("RELOAD_ME_VAR", None)
            value = claude_adapter.claude_envvars.ensure_process_env("RELOAD_ME_VAR")
            self.assertEqual(claude_adapter.claude_envvars.os.environ.get("RELOAD_ME_VAR"), "sk-registry-value")
        getter.assert_called_once_with("RELOAD_ME_VAR")
        self.assertEqual(value, "sk-registry-value")

    def test_present_in_process_never_queries_registry(self):
        with patch.object(claude_adapter.claude_envvars, "user_env_get") as getter, \
             patch.dict(os.environ, {"ALREADY_SET_VAR": "sk-existing"}, clear=False):
            value = claude_adapter.claude_envvars.ensure_process_env("ALREADY_SET_VAR")
        getter.assert_not_called()
        self.assertEqual(value, "sk-existing")

    def test_absent_from_both_returns_none(self):
        with patch.object(claude_adapter.claude_envvars, "user_env_get", return_value=None), \
             patch.dict(os.environ, {}, clear=False):
            claude_adapter.claude_envvars.os.environ.pop("MISSING_BOTH_VAR", None)
            value = claude_adapter.claude_envvars.ensure_process_env("MISSING_BOTH_VAR")
        self.assertIsNone(value)


class HttpHostOriginTests(ClaudeAdapterBase):
    def test_host_origin_checks_run_before_body_processing(self):
        from fastapi import FastAPI
        from fastapi.testclient import TestClient
        app = FastAPI()
        app.include_router(claude_adapter.router)
        with patch.object(claude_adapter, "get_profile_root", return_value=self.profile_root):
            client = TestClient(app)
            bad_origin = client.post("/api/claude/routes", json={"name": "x"}, headers={"origin": "http://evil.example", "host": "127.0.0.1:9090"})
            self.assertEqual(bad_origin.status_code, 403)
            bad_host = client.get("/api/claude/routes", headers={"host": "evil.example"})
            self.assertEqual(bad_host.status_code, 403)
            wrong_port = client.get("/api/claude/routes", headers={"host": "127.0.0.1:8080", "origin": "http://127.0.0.1:8080"})
            self.assertEqual(wrong_port.status_code, 403)
            malformed_with_bad_origin = client.post("/api/claude/routes", content="not-json", headers={"origin": "http://evil.example", "host": "127.0.0.1:9090"})
            self.assertEqual(malformed_with_bad_origin.status_code, 403)
            valid = client.get("/api/claude/routes", headers={"host": "127.0.0.1:9090"})
            self.assertEqual(valid.status_code, 200)
            valid_origin = client.get("/api/claude/routes", headers={"host": "127.0.0.1:9090", "origin": "http://127.0.0.1:9090"})
            self.assertEqual(valid_origin.status_code, 200)
            activity = client.get("/api/claude/activity", headers={"host": "127.0.0.1:9090", "origin": "http://evil.example"})
            self.assertEqual(activity.status_code, 403)


class ApplyCommitBoundaryTests(ClaudeAdapterBase):
    def test_every_apply_commit_boundary_rolls_back_all_artifacts(self):
        route = self.create_route()
        before_target = self.target_hash()
        before_store = self.routes_file.read_bytes()
        real_atomic = claude_adapter._atomic_write

        def failing_store_write_factory():
            store_writes = {"count": 0}

            def failing_store_write(path, content):
                if str(path).lower() == str(self.routes_file).lower():
                    store_writes["count"] += 1
                    if store_writes["count"] == 1:
                        raise OSError("boom")
                return real_atomic(path, content)

            return patch.object(claude_adapter, "_atomic_write", side_effect=failing_store_write)

        boundaries = (
            ("store write", failing_store_write_factory),
            ("manifest write", lambda: patch.object(claude_adapter, "_write_manifest", side_effect=OSError("boom"))),
            ("activity write", lambda: patch.object(claude_adapter, "_append_activity", side_effect=OSError("boom"))),
        )
        for index, (target_point, factory) in enumerate(boundaries):
            with factory():
                rev = claude_adapter.claude_routes()["routesRevision"]
                with self.assertRaises(HTTPException) as ctx:
                    claude_adapter.claude_route_apply(route["id"], claude_adapter.RouteApplyBody(
                        expectedRevision=claude_adapter._target_revision(self.profile_root), expectedRoutesRevision=rev))
                self.assertEqual(ctx.exception.status_code, 500, target_point)
            self.assertEqual(self.target_hash(), before_target, f"{target_point}: target")
            self.assertEqual(self.routes_file.read_bytes(), before_store, f"{target_point}: store")
            self.assertEqual(self.manifest(), [], f"{target_point}: manifest")
            leftover_prune = [p.name for p in self.routes_file.parent.glob(".bdf-prune-*.tmp")]
            self.assertEqual(leftover_prune, [], f"{target_point}: prune temps")
            self.assertNotIn("route_applied", self.activity_types())
            self.assertEqual(len(list((self.profile_root / ".claude" / "backup").glob("settings.backup.*.json"))), index + 1, f"{target_point}: apply backup kept per contract")

    def test_prune_rollback_keeps_oldest_backups_referenced(self):
        route = self.create_route()
        for i in range(claude_adapter.MANIFEST_CAP):
            route = self.create_route(name=f"Route{i}")
            claude_adapter.claude_route_apply(route["id"], claude_adapter.RouteApplyBody(
                expectedRevision=claude_adapter._target_revision(self.profile_root),
                expectedRoutesRevision=claude_adapter.claude_routes()["routesRevision"]))
        before = self.manifest()
        oldest = before[0]
        oldest_target = self.profile_root / ".claude" / "backup" / oldest["backupName"]
        self.assertTrue(oldest_target.is_file())
        with patch.object(claude_adapter, "_write_manifest", side_effect=OSError("boom")):
            route = self.create_route(name="Final")
            with self.assertRaises(HTTPException) as ctx:
                claude_adapter.claude_route_apply(route["id"], claude_adapter.RouteApplyBody(
                    expectedRevision=claude_adapter._target_revision(self.profile_root),
                    expectedRoutesRevision=claude_adapter.claude_routes()["routesRevision"]))
            self.assertEqual(ctx.exception.status_code, 500)
        self.assertEqual(len(self.manifest()), claude_adapter.MANIFEST_CAP)
        self.assertTrue(oldest_target.is_file(), "oldest target backup must survive a failed prune")
        self.assertEqual(self.manifest()[0]["backupName"], oldest["backupName"])
        self.assertFalse([p for p in self.routes_file.parent.glob(".bdf-prune-*.tmp")])

    def test_apply_keeps_new_target_backup_after_rollback(self):
        route = self.create_route()
        rev = claude_adapter.claude_routes()["routesRevision"]
        with patch.object(claude_adapter, "_write_manifest", side_effect=OSError("boom")):
            with self.assertRaises(HTTPException):
                claude_adapter.claude_route_apply(route["id"], claude_adapter.RouteApplyBody(
                    expectedRevision=claude_adapter._target_revision(self.profile_root), expectedRoutesRevision=rev))
        backups = list((self.profile_root / ".claude" / "backup").glob("settings.backup.*.json"))
        self.assertEqual(len(backups), 1)


class RoundTwoDefectTests(ClaudeAdapterBase):
    def _mutating_apply_fake(self, output):
        """Fake production Apply that actually creates an owned backup and
        mutates the target before returning, proving post-mutation validation
        failures recover the target. Fake Restore actually restores the target
        from the named backup file."""

        def fake_run(args, timeout=120):
            if "-Operation" in args and "Apply" in args:
                target = Path(args[args.index("-SettingsPath") + 1])
                stamp = datetime_now_17()
                backup_dir = target.parent / "backup"
                backup_dir.mkdir(parents=True, exist_ok=True)
                backup = backup_dir / ("settings.backup." + stamp + "." + "d" * 32 + ".json")
                shutil.copy2(str(target), str(backup))
                content = json.loads(target.read_text(encoding="utf-8"))
                content["model"] = "mutated-by-fake"
                target.write_text(json.dumps(content), encoding="utf-8", newline="\n")
                return 0, json.dumps(output), ""
            if "-Operation" in args and "Restore" in args:
                backup_path = Path(args[args.index("-BackupPath") + 1])
                target = Path(args[args.index("-SettingsPath") + 1])
                shutil.copy2(str(backup_path), str(target))
                backup_sha = claude_adapter._sha256_file(backup_path)
                return 0, json.dumps({"ok": True, "restoredTargetSha256": backup_sha, "coreVersion": "0.2.0", "schemaIdentity": claude_adapter._sha256_file(claude_adapter.CLAUDE_SCHEMA)}), ""
            raise AssertionError("unexpected production call")

        return fake_run

    def test_invalid_apply_output_after_target_mutation_restores_everything(self):
        route = self.create_route()
        before_target = self.target_hash()
        before_store = self.routes_file.read_bytes()
        schema = claude_adapter._sha256_file(claude_adapter.CLAUDE_SCHEMA)
        base = {
            "ok": True,
            "backupName": "settings.backup.20260814000000000.eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.json",
            "backupSha256": "0" * 64,
            "preWriteTargetSha256": claude_adapter._target_revision(self.profile_root),
            "postWriteTargetSha256": "1" * 64,
            "coreVersion": "0.2.0",
            "schemaIdentity": schema,
        }
        cases = [
            dict(base, schemaIdentity="f" * 64),
            dict(base, backupSha256="f" * 64),
            dict(base, extra="surprise"),
            dict(base, preWriteTargetSha256="f" * 64),
        ]
        for index, bad in enumerate(cases):
            with patch.object(claude_adapter, "_run_production", side_effect=self._mutating_apply_fake(bad)):
                rev = claude_adapter.claude_routes()["routesRevision"]
                with self.assertRaises(HTTPException) as ctx:
                    claude_adapter.claude_route_apply(route["id"], claude_adapter.RouteApplyBody(
                        expectedRevision=claude_adapter._target_revision(self.profile_root), expectedRoutesRevision=rev))
                self.assertEqual(ctx.exception.status_code, 500, bad)
            self.assertEqual(self.target_hash(), before_target, f"target restored: {bad}")
            json.loads(self.target.read_text(encoding="utf-8"))
            self.assertEqual(self.routes_file.read_bytes(), before_store)
            self.assertEqual(self.manifest(), [])
            self.assertNotIn("route_applied", self.activity_types())
            self.assertEqual(len(list((self.profile_root / ".claude" / "backup").glob("settings.backup.*.json"))), index + 1, "only apply-owned backups remain as evidence")

    def test_production_exit_2_is_hard_failure_with_recovery(self):
        route = self.create_route()
        before_target = self.target_hash()
        schema = claude_adapter._sha256_file(claude_adapter.CLAUDE_SCHEMA)

        def fake_run(args, timeout=120):
            if "-Operation" in args and "Apply" in args:
                target = Path(args[args.index("-SettingsPath") + 1])
                content = json.loads(target.read_text(encoding="utf-8"))
                content["model"] = "mutated-by-fake"
                target.write_text(json.dumps(content), encoding="utf-8", newline="\n")
                return 2, "", "RECOVERY FAILED"
            if "-Operation" in args and "Restore" in args:
                backup_path = Path(args[args.index("-BackupPath") + 1])
                target = Path(args[args.index("-SettingsPath") + 1])
                shutil.copy2(str(backup_path), str(target))
                backup_sha = claude_adapter._sha256_file(backup_path)
                return 0, json.dumps({"ok": True, "restoredTargetSha256": backup_sha, "coreVersion": "0.2.0", "schemaIdentity": schema}), ""
            raise AssertionError("unexpected production call")

        with patch.object(claude_adapter, "_run_production", side_effect=fake_run):
            rev = claude_adapter.claude_routes()["routesRevision"]
            with self.assertRaises(HTTPException) as ctx:
                claude_adapter.claude_route_apply(route["id"], claude_adapter.RouteApplyBody(
                    expectedRevision=claude_adapter._target_revision(self.profile_root), expectedRoutesRevision=rev))
            self.assertEqual(ctx.exception.status_code, 500)
        self.assertEqual(self.target_hash(), before_target, "exit 2 must still recover the target")

    def test_prune_second_backup_validation_failure_restores_first(self):
        route = self.create_route()
        for i in range(claude_adapter.MANIFEST_CAP):
            route = self.create_route(name=f"Route{i}")
            claude_adapter.claude_route_apply(route["id"], claude_adapter.RouteApplyBody(
                expectedRevision=claude_adapter._target_revision(self.profile_root),
                expectedRoutesRevision=claude_adapter.claude_routes()["routesRevision"]))
        oldest = self.manifest()[0]
        oldest_target = self.profile_root / ".claude" / "backup" / oldest["backupName"]
        oldest_store = self.routes_file.parent / oldest["previousStoreBackupName"]
        self.assertTrue(oldest_target.is_file())
        self.assertTrue(oldest_store.is_file())
        self.manifest_file.write_text(json.dumps([dict(self.manifest()[0], previousStoreSha256="0" * 64)] + self.manifest()[1:], indent=2, ensure_ascii=False) + "\n")
        before_target = self.target_hash()
        route = self.create_route(name="Final")
        with self.assertRaises(HTTPException) as ctx:
            claude_adapter.claude_route_apply(route["id"], claude_adapter.RouteApplyBody(
                expectedRevision=claude_adapter._target_revision(self.profile_root),
                expectedRoutesRevision=claude_adapter.claude_routes()["routesRevision"]))
        self.assertEqual(ctx.exception.status_code, 409)
        self.assertIn("safely pruned", ctx.exception.detail)
        self.assertEqual(self.target_hash(), before_target, "target must survive a failed prune untouched")
        self.assertTrue(oldest_target.is_file(), "first backup must be unstaged")
        self.assertTrue(oldest_store.is_file(), "second backup untouched")
        self.assertFalse([p for p in self.routes_file.parent.glob(".bdf-prune-*.tmp")])

    def test_prune_missing_oldest_backup_file_reports_prune_failure_and_rolls_back(self):
        """Catches a stale manifest record (backup file deleted out-of-band) surfacing
        as an opaque 500 instead of its real prune failure."""
        route = self.create_route()
        for i in range(claude_adapter.MANIFEST_CAP):
            route = self.create_route(name=f"Route{i}")
            claude_adapter.claude_route_apply(route["id"], claude_adapter.RouteApplyBody(
                expectedRevision=claude_adapter._target_revision(self.profile_root),
                expectedRoutesRevision=claude_adapter.claude_routes()["routesRevision"]))
        oldest = self.manifest()[0]
        oldest_target = self.profile_root / ".claude" / "backup" / oldest["backupName"]
        before_target = self.target_hash()
        oldest_target.unlink()  # exactly the observed real-world drift
        route = self.create_route(name="Final")
        with self.assertRaises(HTTPException) as ctx:
            claude_adapter.claude_route_apply(route["id"], claude_adapter.RouteApplyBody(
                expectedRevision=claude_adapter._target_revision(self.profile_root),
                expectedRoutesRevision=claude_adapter.claude_routes()["routesRevision"]))
        self.assertEqual(ctx.exception.status_code, 409)
        self.assertIn("safely pruned", ctx.exception.detail)
        self.assertEqual(self.target_hash(), before_target, "rollback must leave the target byte-equal")
        self.assertFalse([p for p in self.routes_file.parent.glob(".bdf-prune-*.tmp")])

    def test_prune_staging_destination_never_overwrites_preexisting(self):
        route = self.create_route()
        for i in range(claude_adapter.MANIFEST_CAP):
            route = self.create_route(name=f"Route{i}")
            claude_adapter.claude_route_apply(route["id"], claude_adapter.RouteApplyBody(
                expectedRevision=claude_adapter._target_revision(self.profile_root),
                expectedRoutesRevision=claude_adapter.claude_routes()["routesRevision"]))
        oldest = self.manifest()[0]
        oldest_target = self.profile_root / ".claude" / "backup" / oldest["backupName"]
        sentinel = self.routes_file.parent / ".bdf-sentinel.tmp"
        sentinel.write_text("do not overwrite", encoding="utf-8")
        with patch.object(claude_adapter, "_new_staging_name", return_value=sentinel):
            with self.assertRaises(HTTPException):
                claude_adapter._prepare_prune(list(self.manifest()), self.profile_root)
        self.assertEqual(sentinel.read_text(encoding="utf-8"), "do not overwrite")
        self.assertTrue(oldest_target.is_file())
        self.assertFalse([p for p in self.routes_file.parent.glob(".bdf-prune-*.tmp")])

    def test_prune_move_and_finalize_boundary_failures_are_consistent(self):
        route = self.create_route()
        for i in range(claude_adapter.MANIFEST_CAP):
            route = self.create_route(name=f"Route{i}")
            claude_adapter.claude_route_apply(route["id"], claude_adapter.RouteApplyBody(
                expectedRevision=claude_adapter._target_revision(self.profile_root),
                expectedRoutesRevision=claude_adapter.claude_routes()["routesRevision"]))
        oldest = self.manifest()[0]
        oldest_target = self.profile_root / ".claude" / "backup" / oldest["backupName"]
        real_link = os.link
        real_unlink = os.unlink
        calls = {"moves": 0}

        def failing_second_move(src, dst):
            if ".bdf-prune-" in str(dst):
                calls["moves"] += 1
                if calls["moves"] == 2:
                    raise OSError("second move fails")
            return real_link(src, dst)

        def passthrough_unlink(path):
            return real_unlink(path)

        with patch.object(claude_adapter.os, "link", side_effect=failing_second_move):
            with patch.object(claude_adapter.os, "unlink", side_effect=passthrough_unlink):
                with self.assertRaises(HTTPException):
                    claude_adapter._prepare_prune(list(self.manifest()), self.profile_root)
        self.assertTrue(oldest_target.is_file(), "first moved file unstaged after second-move failure")
        self.assertFalse([p for p in self.routes_file.parent.glob(".bdf-prune-*.tmp")])
        self.assertFalse([p for p in (self.profile_root / ".claude").glob(".bdf-prune-*.tmp")])

    def test_restore_consumed_backup_staging_failure_restores_everything(self):
        route = self.create_route()
        rev = claude_adapter.claude_routes()["routesRevision"]
        claude_adapter.claude_route_apply(route["id"], claude_adapter.RouteApplyBody(
            expectedRevision=claude_adapter._target_revision(self.profile_root), expectedRoutesRevision=rev))
        entry = self.manifest()[-1]
        store_backup = self.routes_file.parent / entry["previousStoreBackupName"]
        before_target = self.target_hash()
        before_store = self.routes_file.read_bytes()
        real_replace = os.replace

        def failing_consume_move(src, dst):
            if ".bdf-consume-" in str(dst):
                raise OSError("consume staging fails")
            return real_replace(src, dst)

        with patch.object(claude_adapter.os, "replace", side_effect=failing_consume_move):
            with self.assertRaises(HTTPException) as ctx:
                claude_adapter.claude_restore(claude_adapter.RestoreBody(
                    expectedRevision=claude_adapter._target_revision(self.profile_root),
                    expectedRoutesRevision=claude_adapter.claude_routes()["routesRevision"]))
            self.assertEqual(ctx.exception.status_code, 500)
        self.assertEqual(self.target_hash(), before_target)
        self.assertEqual(self.routes_file.read_bytes(), before_store)
        self.assertTrue(store_backup.is_file())
        self.assertEqual(len(self.manifest()), 1)
        self.assertFalse([p for p in self.routes_file.parent.glob(".bdf-consume-*.tmp")])
        self.assertFalse([p for p in (self.profile_root / ".claude" / "backup").glob("settings.backup.*.json") if p.name != entry["backupName"]])

    def test_restore_consumed_backup_finalize_failure_commits_consistently(self):
        route = self.create_route()
        rev = claude_adapter.claude_routes()["routesRevision"]
        claude_adapter.claude_route_apply(route["id"], claude_adapter.RouteApplyBody(
            expectedRevision=claude_adapter._target_revision(self.profile_root), expectedRoutesRevision=rev))
        entry = self.manifest()[-1]
        store_backup = self.routes_file.parent / entry["previousStoreBackupName"]
        real_remove = claude_adapter._remove_owned_file

        def failing_consume_finalize(path, expected_sha):
            if path is not None and ".bdf-consume-" in str(path):
                raise HTTPException(500, "consumed route backup could not be removed")
            return real_remove(path, expected_sha)

        with patch.object(claude_adapter, "_remove_owned_file", side_effect=failing_consume_finalize):
            with self.assertRaises(HTTPException) as ctx:
                claude_adapter.claude_restore(claude_adapter.RestoreBody(
                    expectedRevision=claude_adapter._target_revision(self.profile_root),
                    expectedRoutesRevision=claude_adapter.claude_routes()["routesRevision"]))
            self.assertEqual(ctx.exception.status_code, 500)
        self.assertEqual(self.manifest(), [], "committed manifest no longer references the consumed backup")
        store = self.store()
        self.assertIsNone(store["appliedRouteId"])
        leftovers = [p.name for p in self.routes_file.parent.glob(".bdf-consume-*.tmp")]
        self.assertEqual(len(leftovers), 1, "committed consume temp remains and is unreferenced")
        json.loads(self.target.read_text(encoding="utf-8"))

    def test_cli_explicit_empty_forbidden_parameters_rejected(self):
        route = self.create_route()
        profile = claude_adapter._routing_profile(route)
        profile_path = self.tmp / "profile.json"
        profile_path.write_text(json.dumps(profile), encoding="utf-8")
        target = self.profile_root / ".claude" / "settings.json"
        before = self.target_hash()
        for extra in (["-RoutingProfilePath", str(profile_path), "-BackupPath", ""],
                      ["-RoutingProfilePath", str(profile_path), "-ExpectedBackupSha256", ""],
                      ["-RoutingProfilePath", str(profile_path), "-TargetBindingSha256", ""]):
            cmd = [claude_adapter.PS1, *claude_adapter.PS1_ARGS, str(claude_adapter.PRODUCTION_ENTRY),
                   "-Operation", "Apply", "-ProfileRoot", str(self.profile_root), "-SettingsPath", str(target),
                   "-SchemaPath", str(claude_adapter.CLAUDE_SCHEMA)] + extra
            proc = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=120)
            self.assertNotEqual(proc.returncode, 0, f"accepted: {extra}")
        restore_cmd = [claude_adapter.PS1, *claude_adapter.PS1_ARGS, str(claude_adapter.PRODUCTION_ENTRY),
                       "-Operation", "Restore", "-ProfileRoot", str(self.profile_root), "-SettingsPath", str(target),
                       "-SchemaPath", str(claude_adapter.CLAUDE_SCHEMA), "-RoutingProfilePath", ""]
        proc = subprocess.run(restore_cmd, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=120)
        self.assertNotEqual(proc.returncode, 0)
        self.assertEqual(self.target_hash(), before)


def datetime_now_17():
    from datetime import datetime, timezone
    return datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S") + datetime.now(timezone.utc).strftime("%f")[:3]


class RoundThreeTransactionTests(ClaudeAdapterBase):
    def test_invalid_apply_output_rolls_back_exactly_once(self):
        route = self.create_route()
        before_target = self.target_hash()
        before_store = self.routes_file.read_bytes()
        schema = claude_adapter._sha256_file(claude_adapter.CLAUDE_SCHEMA)

        def mutating_fake(args, timeout=120):
            if "-Operation" in args and "Apply" in args:
                target = Path(args[args.index("-SettingsPath") + 1])
                stamp = datetime_now_17()
                backup_dir = target.parent / "backup"
                backup_dir.mkdir(parents=True, exist_ok=True)
                backup = backup_dir / ("settings.backup." + stamp + "." + "d" * 32 + ".json")
                shutil.copy2(str(target), str(backup))
                data = json.loads(target.read_text(encoding="utf-8"))
                data["model"] = "mutated-by-fake"
                target.write_text(json.dumps(data), encoding="utf-8", newline="\n")
                return 0, json.dumps({"ok": True, "backupName": backup.name, "backupSha256": claude_adapter._sha256_file(backup), "preWriteTargetSha256": claude_adapter._target_revision(self.profile_root), "postWriteTargetSha256": "1" * 64, "coreVersion": "0.2.0", "schemaIdentity": "f" * 64}), ""
            if "-Operation" in args and "Restore" in args:
                b = Path(args[args.index("-BackupPath") + 1])
                t = Path(args[args.index("-SettingsPath") + 1])
                shutil.copy2(str(b), str(t))
                return 0, json.dumps({"ok": True, "restoredTargetSha256": claude_adapter._sha256_file(b), "coreVersion": "0.2.0", "schemaIdentity": schema}), ""
            raise AssertionError("unexpected production call")

        real_rollback = claude_adapter._rollback_apply
        calls = {"count": 0}

        def counted_rollback(*args, **kwargs):
            calls["count"] += 1
            return real_rollback(*args, **kwargs)

        with patch.object(claude_adapter, "_run_production", side_effect=mutating_fake):
            with patch.object(claude_adapter, "_rollback_apply", side_effect=counted_rollback):
                rev = claude_adapter.claude_routes()["routesRevision"]
                with self.assertRaises(HTTPException) as ctx:
                    claude_adapter.claude_route_apply(route["id"], claude_adapter.RouteApplyBody(
                        expectedRevision=claude_adapter._target_revision(self.profile_root), expectedRoutesRevision=rev))
                self.assertEqual(ctx.exception.status_code, 500)
        self.assertEqual(calls["count"], 1, "rollback must execute exactly once")
        self.assertEqual(self.target_hash(), before_target)
        self.assertEqual(self.routes_file.read_bytes(), before_store)
        self.assertEqual(self.manifest(), [])
        self.assertNotIn("route_applied", self.activity_types())

    def test_apply_recovery_cleanup_false_is_hard_failure_never_success(self):
        route = self.create_route()
        schema = claude_adapter._sha256_file(claude_adapter.CLAUDE_SCHEMA)
        real_remove = claude_adapter._remove_owned_file

        def failing_cleanup(path, expected_sha):
            if path is not None and "settings.backup." in str(path) and claude_adapter._sha256_file(path) is not None:
                recovery_dir = self.profile_root / ".claude"
                if path.parent == recovery_dir and "recovery" not in str(path):
                    pass
            return real_remove(path, expected_sha)

        def fake_run(args, timeout=120):
            if "-Operation" in args and "Apply" in args:
                target = Path(args[args.index("-SettingsPath") + 1])
                stamp = datetime_now_17()
                backup_dir = target.parent / "backup"
                backup_dir.mkdir(parents=True, exist_ok=True)
                backup = backup_dir / ("settings.backup." + stamp + "." + "d" * 32 + ".json")
                shutil.copy2(str(target), str(backup))
                return 0, json.dumps({"ok": True, "backupName": backup.name, "backupSha256": claude_adapter._sha256_file(backup), "preWriteTargetSha256": claude_adapter._target_revision(self.profile_root), "postWriteTargetSha256": claude_adapter._sha256_file(target), "coreVersion": "0.2.0", "schemaIdentity": schema}), ""
            raise AssertionError("unexpected production call")

        with patch.object(claude_adapter, "_run_production", side_effect=fake_run):
            with patch.object(claude_adapter, "_remove_owned_file", side_effect=lambda path, sha: False if path is not None and path.is_file() else True):
                rev = claude_adapter.claude_routes()["routesRevision"]
                with self.assertRaises(HTTPException) as ctx:
                    claude_adapter.claude_route_apply(route["id"], claude_adapter.RouteApplyBody(
                        expectedRevision=claude_adapter._target_revision(self.profile_root), expectedRoutesRevision=rev))
                self.assertEqual(ctx.exception.status_code, 500)
        store = self.store()
        self.assertEqual(store["appliedRouteId"], route["id"], "committed state stays applied")
        self.assertEqual(len(self.manifest()), 1)
        self.assertEqual(self.manifest()[0]["appliedRouteId"], route["id"])
        json.loads(self.target.read_text(encoding="utf-8"))
        leftovers = [p for p in (self.profile_root / ".claude" / "backup").glob("settings.backup.*.json")]
        self.assertGreaterEqual(len(leftovers), 2, "apply backup + preserved recovery evidence")

    def test_restore_recovery_cleanup_false_is_hard_failure_never_success(self):
        route = self.create_route()
        rev = claude_adapter.claude_routes()["routesRevision"]
        claude_adapter.claude_route_apply(route["id"], claude_adapter.RouteApplyBody(
            expectedRevision=claude_adapter._target_revision(self.profile_root), expectedRoutesRevision=rev))
        with patch.object(claude_adapter, "_remove_owned_file", side_effect=lambda path, sha: False if path is not None and path.is_file() else True):
            with self.assertRaises(HTTPException) as ctx:
                claude_adapter.claude_restore(claude_adapter.RestoreBody(
                    expectedRevision=claude_adapter._target_revision(self.profile_root),
                    expectedRoutesRevision=claude_adapter.claude_routes()["routesRevision"]))
            self.assertEqual(ctx.exception.status_code, 500)
        self.assertEqual(self.manifest(), [], "committed restore stays committed")
        store = self.store()
        self.assertIsNone(store["appliedRouteId"])

    def test_exit_1_with_cleanup_failure_is_hard_failure(self):
        route = self.create_route()
        before_target = self.target_hash()

        def fake_run(args, timeout=120):
            return 1, "", "VALIDATION FAILED; fake"
        with patch.object(claude_adapter, "_run_production", side_effect=fake_run):
            with patch.object(claude_adapter, "_remove_owned_file", side_effect=lambda path, sha: False if path is not None and path.is_file() else True):
                rev = claude_adapter.claude_routes()["routesRevision"]
                with self.assertRaises(HTTPException) as ctx:
                    claude_adapter.claude_route_apply(route["id"], claude_adapter.RouteApplyBody(
                        expectedRevision=claude_adapter._target_revision(self.profile_root), expectedRoutesRevision=rev))
                self.assertEqual(ctx.exception.status_code, 500)
        self.assertEqual(self.target_hash(), before_target)
        self.assertEqual(self.manifest(), [])

    def test_normal_success_leaves_no_recovery_artifacts(self):
        route = self.create_route()
        rev = claude_adapter.claude_routes()["routesRevision"]
        claude_adapter.claude_route_apply(route["id"], claude_adapter.RouteApplyBody(
            expectedRevision=claude_adapter._target_revision(self.profile_root), expectedRoutesRevision=rev))
        backups = [p.name for p in (self.profile_root / ".claude" / "backup").glob("settings.backup.*.json")]
        self.assertEqual(len(backups), 1, "only the apply-owned backup remains")
        self.assertFalse([p for p in self.routes_file.parent.glob(".bdf-*")])
        rev2 = claude_adapter.claude_routes()["routesRevision"]
        claude_adapter.claude_restore(claude_adapter.RestoreBody(
            expectedRevision=claude_adapter._target_revision(self.profile_root), expectedRoutesRevision=rev2))
        backups_after = [p.name for p in (self.profile_root / ".claude" / "backup").glob("settings.backup.*.json")]
        self.assertEqual(len(backups_after), 1, "only the apply-owned backup remains after restore")
        self.assertFalse([p for p in self.routes_file.parent.glob(".bdf-*")])


if __name__ == "__main__":
    unittest.main()
