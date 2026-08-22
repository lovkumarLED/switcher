import json
import tempfile
import threading
import unittest
from pathlib import Path

from app import agentstore
from app.storage import set_state


class AgentStoreTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.agent_dir = Path(self.tmp.name)
        self._orig_state = None
        self._backup_state_file()
        from app import config
        if config.STATE_FILE.is_file():
            config.STATE_FILE.unlink()

    def _backup_state_file(self):
        from app import config
        state = config.STATE_FILE
        self._orig_state = state.read_text(encoding="utf-8") if state.is_file() else None

    def _reset_state(self):
        from app import config
        state = config.STATE_FILE
        if self._orig_state is None:
            state.unlink(missing_ok=True)
        else:
            state.write_text(self._orig_state, encoding="utf-8")

    def tearDown(self):
        self._reset_state()

    def test_slugify(self):
        self.assertEqual(agentstore.slugify("OmniRoute"), "omniroute")
        self.assertEqual(agentstore.slugify("LiteLLM X"), "litellm-x")
        self.assertEqual(agentstore.slugify("  Hello, World!  "), "hello-world")
        self.assertEqual(agentstore.slugify("!!!"), "")

    def test_create_and_read_provider(self):
        provider = agentstore.write_provider(self.agent_dir, "smoke", "Smoke", "http://localhost:20128/v1", "sk-test")
        self.assertEqual(provider["id"], "smoke")
        self.assertEqual(provider["name"], "Smoke")
        self.assertEqual(provider["baseUrl"], "http://localhost:20128/v1")
        self.assertEqual(provider["apiKey"], "sk-test")
        read = agentstore.read_provider(self.agent_dir, "smoke")
        self.assertEqual(read["baseUrl"], "http://localhost:20128/v1")
        self.assertTrue((self.agent_dir / "providers" / "smoke.json").is_file())

    def test_update_creates_backup(self):
        agentstore.write_provider(self.agent_dir, "smoke", "Smoke", "http://a/v1", "k1")
        agentstore.write_provider(self.agent_dir, "smoke", "Smoke", "http://b/v1", "k2")
        backups = list((self.agent_dir / "backup").glob("smoke_*.json"))
        self.assertEqual(len(backups), 1)
        provider = agentstore.read_provider(self.agent_dir, "smoke")
        self.assertEqual(provider["baseUrl"], "http://b/v1")
        self.assertEqual(provider["apiKey"], "k2")

    def test_write_provider_dual_key_placement(self):
        agentstore.write_provider(self.agent_dir, "tokenrouter", "TokenRouter", "https://api.tokenrouter.com/v1", "sk-dual")
        data = json.loads((self.agent_dir / "providers" / "tokenrouter.json").read_text(encoding="utf-8"))
        inner = data["provider"]["tokenrouter"]
        self.assertEqual(inner["apiKey"], "sk-dual")
        self.assertEqual(inner["options"]["apiKey"], "sk-dual")
        self.assertEqual(inner["options"]["baseURL"], "https://api.tokenrouter.com/v1")
        provider = agentstore.read_provider(self.agent_dir, "tokenrouter")
        self.assertEqual(provider["apiKey"], "sk-dual")

    def test_write_provider_preserves_extra_options(self):
        providers_dir = self.agent_dir / "providers"
        providers_dir.mkdir(parents=True)
        (providers_dir / "smoke.json").write_text(
            json.dumps({"id": "smoke", "provider": {"smoke": {"name": "Smoke", "options": {"baseURL": "http://a/v1", "organization": "acme"}}}}),
            encoding="utf-8",
        )
        agentstore.write_provider(self.agent_dir, "smoke", "Smoke", "http://b/v1", "k")
        data = json.loads((providers_dir / "smoke.json").read_text(encoding="utf-8"))
        options = data["provider"]["smoke"]["options"]
        self.assertEqual(options["baseURL"], "http://b/v1")
        self.assertEqual(options["apiKey"], "k")
        self.assertEqual(options["organization"], "acme")

    def test_update_syncs_dual_keys(self):
        agentstore.write_provider(self.agent_dir, "smoke", "Smoke", "http://a/v1", "old")
        agentstore.write_provider(self.agent_dir, "smoke", "Smoke", "http://b/v1", "new")
        data = json.loads((self.agent_dir / "providers" / "smoke.json").read_text(encoding="utf-8"))
        inner = data["provider"]["smoke"]
        self.assertEqual(inner["apiKey"], "new")
        self.assertEqual(inner["options"]["apiKey"], "new")
        provider = agentstore.read_provider(self.agent_dir, "smoke")
        self.assertEqual(provider["apiKey"], "new")

    def test_delete_removes_file_with_backup(self):
        agentstore.write_provider(self.agent_dir, "smoke", "Smoke", "http://a/v1", "k")
        agentstore.delete_provider(self.agent_dir, "smoke")
        self.assertIsNone(agentstore.read_provider(self.agent_dir, "smoke"))
        self.assertEqual(len(list((self.agent_dir / "backup").glob("smoke_*.json"))), 1)

    def test_settings_merge_preserves_user_keys(self):
        settings_dir = self.agent_dir / "profiles" / "coding"
        settings_dir.mkdir(parents=True)
        (settings_dir / "settings.json").write_text(
            json.dumps({"$schema": "s", "activeProviders": ["omniroute"], "instructions": ["AGENTS.md"]}),
            encoding="utf-8",
        )
        agentstore.set_active_providers(self.agent_dir, ["smoke"])
        data = json.loads((settings_dir / "settings.json").read_text(encoding="utf-8"))
        self.assertEqual(data["activeProviders"], ["smoke"])
        self.assertEqual(data["instructions"], ["AGENTS.md"])
        self.assertEqual(data["$schema"], "s")

    def test_active_provider_returns_first_active_with_file(self):
        agentstore.write_provider(self.agent_dir, "smoke", "Smoke", "http://a/v1", "k")
        self.assertIsNone(agentstore.active_provider(self.agent_dir))
        settings_dir = self.agent_dir / "profiles" / "coding"
        settings_dir.mkdir(parents=True)
        (settings_dir / "settings.json").write_text(json.dumps({"activeProviders": ["smoke"]}), encoding="utf-8")
        self.assertEqual(agentstore.active_provider(self.agent_dir)["id"], "smoke")

    def test_write_preserves_unknown_file_content(self):
        providers_dir = self.agent_dir / "providers"
        providers_dir.mkdir(parents=True)
        (providers_dir / "omniroute.json").write_text(
            json.dumps({"id": "omniroute", "provider": {"omniroute": {"name": "OmniRoute", "apiKey": "{env:X}", "options": {"baseURL": "http://a/v1"}}}}),
            encoding="utf-8",
        )
        agentstore.write_provider(self.agent_dir, "omniroute", "OmniRoute", "http://b/v1", "{env:X}")
        data = json.loads((providers_dir / "omniroute.json").read_text(encoding="utf-8"))
        inner = data["provider"]["omniroute"]
        self.assertEqual(inner["options"]["baseURL"], "http://b/v1")
        self.assertEqual(inner["apiKey"], "{env:X}")

    def test_models_roundtrip(self):
        agentstore.write_models(self.agent_dir, "smoke", [
            {"model": "opencode-zen/deepseek-v4-flash-free", "name": "DeepSeek V4 Flash", "thinking": ["high", "max"]},
            {"model": "zen/mimo", "name": "MiMo", "thinking": ["minimal"]},
        ])
        models = agentstore.read_models(self.agent_dir, "smoke")
        self.assertEqual(len(models), 2)
        self.assertEqual(models[0]["model"], "opencode-zen/deepseek-v4-flash-free")
        self.assertEqual(models[0]["thinking"], ["high", "max"])
        data = json.loads((self.agent_dir / "profiles" / "coding" / "smoke-models.json").read_text(encoding="utf-8"))
        self.assertEqual(data["models"]["zen/mimo"]["variants"]["minimal"], {"reasoningEffort": "minimal"})

    def test_openai_format_writes_gpt_levels(self):
        agentstore.write_models(self.agent_dir, "smoke", [
            {"model": "gpt-5.6-luna", "name": "GPT 5.6 Luna", "thinking": ["low", "medium", "high", "xhigh"]},
        ], format_id="openai")
        data = json.loads((self.agent_dir / "profiles" / "coding" / "smoke-models.json").read_text(encoding="utf-8"))
        variants = data["models"]["gpt-5.6-luna"]["variants"]
        self.assertEqual(variants, {
            "low": {"reasoningEffort": "low"},
            "medium": {"reasoningEffort": "medium"},
            "high": {"reasoningEffort": "high"},
            "xhigh": {"reasoningEffort": "xhigh"},
        })
        self.assertEqual(agentstore.read_models(self.agent_dir, "smoke", format_id="openai")[0]["thinking"], ["high", "low", "medium", "xhigh"])

    def test_openai_format_drops_unsupported_levels(self):
        agentstore.write_models(self.agent_dir, "smoke", [
            {"model": "gpt-5.5", "name": "GPT 5.5", "thinking": ["max", "minimal", "high"]},
        ], format_id="openai")
        data = json.loads((self.agent_dir / "profiles" / "coding" / "smoke-models.json").read_text(encoding="utf-8"))
        variants = data["models"]["gpt-5.5"]["variants"]
        self.assertEqual(variants, {"high": {"reasoningEffort": "high"}})
        self.assertEqual(agentstore.read_models(self.agent_dir, "smoke", format_id="openai")[0]["thinking"], ["high"])

    def test_claude_format_writes_thinking_budget(self):
        agentstore.write_models(self.agent_dir, "smoke", [
            {"model": "claude-sonnet-4", "name": "Claude Sonnet 4", "thinking": ["low", "high", "max"]},
        ], format_id="claude")
        data = json.loads((self.agent_dir / "profiles" / "coding" / "smoke-models.json").read_text(encoding="utf-8"))
        variants = data["models"]["claude-sonnet-4"]["variants"]
        self.assertEqual(variants["low"], {"thinking": {"type": "enabled", "budgetTokens": 8000}})
        self.assertEqual(variants["high"], {"thinking": {"type": "enabled", "budgetTokens": 16000}})
        self.assertEqual(variants["max"], {"thinking": {"type": "enabled", "budgetTokens": 32000}})
        self.assertEqual(agentstore.read_models(self.agent_dir, "smoke", format_id="claude")[0]["thinking"], ["high", "low", "max"])

    def test_gemini_format_writes_thinking_budget(self):
        agentstore.write_models(self.agent_dir, "smoke", [
            {"model": "gemini-3.6-flash", "name": "Gemini 3.6 Flash", "thinking": ["minimal", "low", "medium", "high"]},
        ], format_id="gemini")
        data = json.loads((self.agent_dir / "profiles" / "coding" / "smoke-models.json").read_text(encoding="utf-8"))
        variants = data["models"]["gemini-3.6-flash"]["variants"]
        self.assertEqual(variants["minimal"], {"thinkingConfig": {"thinkingBudget": 4096}})
        self.assertEqual(variants["high"], {"thinkingConfig": {"thinkingBudget": 32768}})

    def test_none_format_writes_no_variants(self):
        agentstore.write_models(self.agent_dir, "smoke", [
            {"model": "plain", "name": "Plain", "thinking": ["high", "max"]},
        ], format_id="none")
        data = json.loads((self.agent_dir / "profiles" / "coding" / "smoke-models.json").read_text(encoding="utf-8"))
        self.assertEqual(data["models"]["plain"]["variants"], {})
        self.assertEqual(agentstore.read_models(self.agent_dir, "smoke", format_id="none")[0]["thinking"], [])

    def test_empty_thinking_fills_all_openai_levels(self):
        agentstore.write_models(self.agent_dir, "smoke", [
            {"model": "gpt-5.6-luna", "name": "GPT 5.6 Luna", "thinking": []},
        ], format_id="openai")
        data = json.loads((self.agent_dir / "profiles" / "coding" / "smoke-models.json").read_text(encoding="utf-8"))
        self.assertEqual(data["models"]["gpt-5.6-luna"]["variants"], {
            "none": {"reasoningEffort": "none"},
            "low": {"reasoningEffort": "low"},
            "medium": {"reasoningEffort": "medium"},
            "high": {"reasoningEffort": "high"},
            "xhigh": {"reasoningEffort": "xhigh"},
        })

    def test_empty_thinking_fills_all_opencode_levels_by_default(self):
        agentstore.write_models(self.agent_dir, "smoke", [
            {"model": "zen/mimo", "name": "MiMo", "thinking": []},
        ])
        data = json.loads((self.agent_dir / "profiles" / "coding" / "smoke-models.json").read_text(encoding="utf-8"))
        self.assertEqual(data["models"]["zen/mimo"]["variants"], {
            "default": {"reasoningEffort": "default"},
            "minimal": {"reasoningEffort": "minimal"},
            "high": {"reasoningEffort": "high"},
            "max": {"reasoningEffort": "max"},
        })

    def test_empty_thinking_no_reasoning_format_stays_empty(self):
        agentstore.write_models(self.agent_dir, "smoke", [
            {"model": "plain", "name": "Plain", "thinking": []},
        ], format_id="none")
        data = json.loads((self.agent_dir / "profiles" / "coding" / "smoke-models.json").read_text(encoding="utf-8"))
        self.assertEqual(data["models"]["plain"]["variants"], {})

    def test_rewrite_preserves_previously_saved_custom_levels(self):
        saved = [{"model": "gemini-3.6-flash", "name": "Gemini 3.6 Flash", "thinking": ["minimal", "high"]}]
        agentstore.write_models(self.agent_dir, "smoke", saved, format_id="gemini")
        agentstore.write_models(self.agent_dir, "smoke", saved, format_id="gemini")
        data = json.loads((self.agent_dir / "profiles" / "coding" / "smoke-models.json").read_text(encoding="utf-8"))
        variants = data["models"]["gemini-3.6-flash"]["variants"]
        self.assertEqual(variants["minimal"], {"thinkingConfig": {"thinkingBudget": 4096}})
        self.assertEqual(variants["high"], {"thinkingConfig": {"thinkingBudget": 32768}})
        self.assertEqual(len(variants), 2)

    def test_read_models_returns_all_stored_variant_levels(self):
        agentstore.write_models(self.agent_dir, "smoke", [
            {"model": "gpt-5.5", "name": "GPT 5.5", "thinking": ["max", "high"]},
        ])
        thinking = agentstore.read_models(self.agent_dir, "smoke", format_id="openai")[0]["thinking"]
        self.assertEqual(thinking, ["high", "max"])

    def test_provider_format_roundtrip_and_default(self):
        provider = agentstore.write_provider(self.agent_dir, "smoke", "Smoke", "http://a/v1", "k", reasoning_format="claude")
        self.assertEqual(provider["reasoningFormat"], "claude")
        read = agentstore.read_provider(self.agent_dir, "smoke")
        self.assertEqual(read["reasoningFormat"], "claude")
        data = json.loads((self.agent_dir / "providers" / "smoke.json").read_text(encoding="utf-8"))
        self.assertEqual(data["provider"]["smoke"]["reasoningFormat"], "claude")
        provider = agentstore.write_provider(self.agent_dir, "plain", "Plain", "http://b/v1", "k")
        self.assertEqual(provider["reasoningFormat"], "opencode")

    def test_resolve_format_falls_back_to_opencode(self):
        self.assertEqual(agentstore.resolve_format(None), "opencode")
        self.assertEqual(agentstore.resolve_format("bogus"), "opencode")
        self.assertEqual(agentstore.resolve_format("gemini"), "gemini")

    def test_models_update_merges_and_preserves_untouched_models(self):
        agentstore.write_models(self.agent_dir, "smoke", [{"model": "a", "name": "A", "thinking": ["high"]}])
        agentstore.write_models(self.agent_dir, "smoke", [{"model": "b", "name": "B", "thinking": ["max"]}])
        models = agentstore.read_models(self.agent_dir, "smoke")
        self.assertEqual([m["model"] for m in models], ["a", "b"])
        self.assertEqual(len(list((self.agent_dir / "backup").glob("smoke-models_*.json"))), 1)

    def test_models_delete_backs_up_and_removes(self):
        agentstore.write_models(self.agent_dir, "smoke", [{"model": "a", "name": "A", "thinking": ["high"]}])
        agentstore.delete_models(self.agent_dir, "smoke")
        self.assertEqual(agentstore.read_models(self.agent_dir, "smoke"), [])
        self.assertFalse((self.agent_dir / "profiles" / "coding" / "smoke-models.json").exists())
        self.assertEqual(len(list((self.agent_dir / "backup").glob("smoke-models_*.json"))), 1)

    def test_activate_moves_to_front_keeping_others(self):
        settings_dir = self.agent_dir / "profiles" / "coding"
        settings_dir.mkdir(parents=True)
        (settings_dir / "settings.json").write_text(
            json.dumps({"activeProviders": ["omniroute", "tokenrouter", "smoke"]}),
            encoding="utf-8",
        )
        agentstore.activate_provider(self.agent_dir, "smoke")
        self.assertEqual(agentstore.get_active_providers(self.agent_dir), ["smoke", "omniroute", "tokenrouter"])
        agentstore.activate_provider(self.agent_dir, "omniroute")
        self.assertEqual(agentstore.get_active_providers(self.agent_dir), ["omniroute", "smoke", "tokenrouter"])

    def test_plugins_roundtrip_and_backup(self):
        self.assertEqual(agentstore.read_plugins(self.agent_dir), [])
        agentstore.write_plugins(self.agent_dir, ["superpowers@git+https://github.com/obra/superpowers.git", "another"])
        self.assertEqual(agentstore.read_plugins(self.agent_dir), ["superpowers@git+https://github.com/obra/superpowers.git", "another"])
        data = json.loads((self.agent_dir / "profiles" / "coding" / "plugins.json").read_text(encoding="utf-8"))
        self.assertEqual(data["plugin"], ["superpowers@git+https://github.com/obra/superpowers.git", "another"])
        agentstore.write_plugins(self.agent_dir, ["another"])
        self.assertEqual(agentstore.read_plugins(self.agent_dir), ["another"])
        self.assertEqual(len(list((self.agent_dir / "backup").glob("plugins_*.json"))), 1)

    def test_active_profile_isolates_providers_models_plugins_and_mcp(self):
        coding_provider = agentstore.write_provider(self.agent_dir, "coding-provider", "Coding", "http://coding/v1", "k")
        agentstore.write_models(self.agent_dir, coding_provider["id"], [{"model": "coding/model", "name": "Coding model"}])
        agentstore.write_plugins(self.agent_dir, ["coding-plugin"])
        agentstore.write_mcp(self.agent_dir, "coding-mcp", {"type": "local", "command": ["coding"]})

        minimal = self.agent_dir / "profiles" / "minimal"
        minimal.mkdir(parents=True)
        set_state(activeProfile="minimal")
        minimal_provider = agentstore.write_provider(self.agent_dir, "minimal-provider", "Minimal", "http://minimal/v1", "k")
        agentstore.write_models(self.agent_dir, minimal_provider["id"], [{"model": "minimal/model", "name": "Minimal model"}])
        agentstore.write_plugins(self.agent_dir, ["minimal-plugin"])
        agentstore.write_mcp(self.agent_dir, "minimal-mcp", {"type": "local", "command": ["minimal"]})

        self.assertEqual([p["id"] for p in agentstore.list_providers(self.agent_dir)], ["minimal-provider"])
        self.assertEqual([m["model"] for m in agentstore.read_models(self.agent_dir, "minimal-provider")], ["minimal/model"])
        self.assertEqual(agentstore.read_plugins(self.agent_dir), ["minimal-plugin"])
        self.assertEqual(list(agentstore.read_mcp(self.agent_dir)), ["minimal-mcp"])

        set_state(activeProfile="coding")
        self.assertEqual([p["id"] for p in agentstore.list_providers(self.agent_dir)], ["coding-provider"])
        self.assertEqual([m["model"] for m in agentstore.read_models(self.agent_dir, "coding-provider")], ["coding/model"])
        self.assertEqual(agentstore.read_plugins(self.agent_dir), ["coding-plugin"])
        self.assertEqual(list(agentstore.read_mcp(self.agent_dir)), ["coding-mcp"])

    def test_find_builder_prefers_versioned(self):
        scripts = self.agent_dir / "scripts"
        scripts.mkdir(parents=True)
        (scripts / "build-kilo.ps1").write_text("stale opencode copy", encoding="utf-8")
        (scripts / "build-kilo-v1.ps1").write_text("real kilo builder", encoding="utf-8")
        found = agentstore.find_builder_script(self.agent_dir, "kilo")
        self.assertEqual(found.name, "build-kilo-v1.ps1")

    def test_find_builder_picks_highest_version(self):
        scripts = self.agent_dir / "scripts"
        scripts.mkdir(parents=True)
        (scripts / "build-opencode-v2.5.ps1").write_text("old", encoding="utf-8")
        (scripts / "build-opencode-v2.7.ps1").write_text("current", encoding="utf-8")
        (scripts / "build-opencode-v2.7.1.ps1").write_text("patch", encoding="utf-8")
        found = agentstore.find_builder_script(self.agent_dir, "opencode")
        self.assertEqual(found.name, "build-opencode-v2.7.1.ps1")

    def test_find_builder_falls_back_to_exact_and_any(self):
        scripts = self.agent_dir / "scripts"
        scripts.mkdir(parents=True)
        (scripts / "build-aider.ps1").write_text("x", encoding="utf-8")
        self.assertEqual(agentstore.find_builder_script(self.agent_dir, "aider").name, "build-aider.ps1")
        (scripts / "build-goose-old.ps1").write_text("x", encoding="utf-8")
        self.assertEqual(agentstore.find_builder_script(self.agent_dir, "goose").name, "build-goose-old.ps1")

    def test_agent_registry_migrates_legacy_and_switches(self):
        set_state(agent="kilo", dir=str(self.agent_dir))
        self.assertEqual(agentstore.get_agents(), [{"name": "kilo", "dir": str(self.agent_dir)}])
        self.assertEqual(agentstore.active_agent_name(), "kilo")
        self.assertEqual(agentstore.current_agent()[0], "kilo")

    def test_malformed_agent_entries_do_not_crash_status(self):
        """Catches a hand-edited or legacy state entry crashing /api/status with a 500."""
        set_state(
            agents=[
                {"name": "broken", "directory": str(self.agent_dir)},
                {"name": ""},
                42,
                {"name": "good", "dir": str(self.agent_dir)},
            ],
            activeAgent="broken",
        )
        agents = agentstore.get_agents()
        self.assertEqual([a["name"] for a in agents], ["good"])
        name, directory = agentstore.current_agent()
        self.assertEqual(name, "good")
        self.assertEqual(directory, Path(str(self.agent_dir)))

    def test_agent_add_remove_switch(self):
        set_state(agent="kilo", dir=str(self.agent_dir))
        other = Path(self.tmp.name) / "other-agent"
        other.mkdir()
        agentstore.add_agent("opencode", str(other))
        names = [a["name"] for a in agentstore.get_agents()]
        self.assertEqual(names, ["kilo", "opencode"])
        self.assertEqual(agentstore.active_agent_name(), "kilo")
        agentstore.switch_agent("opencode")
        self.assertEqual(agentstore.active_agent_name(), "opencode")
        self.assertEqual(agentstore.current_agent()[1], other)
        agentstore.remove_agent("opencode")
        self.assertEqual(agentstore.active_agent_name(), "kilo")
        self.assertEqual([a["name"] for a in agentstore.get_agents()], ["kilo"])

    def test_agent_remove_active_falls_back(self):
        set_state(agent="kilo", dir=str(self.agent_dir))
        agentstore.remove_agent("kilo")
        self.assertIsNone(agentstore.active_agent_name())
        self.assertEqual(agentstore.get_agents(), [])

    def test_upsert_agent(self):
        set_state(agent="kilo", dir=str(self.agent_dir))
        other = Path(self.tmp.name) / "other-agent"
        other.mkdir()
        agentstore.upsert_agent("kilo", str(other))
        self.assertEqual(len(agentstore.get_agents()), 1)
        self.assertEqual(agentstore.get_agents()[0]["dir"], str(other))
        self.assertEqual(agentstore.active_agent_name(), "kilo")

    def test_mcp_roundtrip_remove_and_backup(self):
        self.assertEqual(agentstore.read_mcp(self.agent_dir), {})
        agentstore.write_mcp(self.agent_dir, "context7", {"type": "local", "command": ["npx", "-y", "@upstash/context7-mcp"]})
        agentstore.write_mcp(self.agent_dir, "files", {"type": "local", "command": ["npx", "x"]})
        mcps = agentstore.read_mcp(self.agent_dir)
        self.assertEqual(sorted(mcps.keys()), ["context7", "files"])
        self.assertEqual(mcps["context7"]["command"][2], "@upstash/context7-mcp")
        self.assertTrue(agentstore.remove_mcp(self.agent_dir, "context7"))
        self.assertFalse(agentstore.remove_mcp(self.agent_dir, "context7"))
        self.assertEqual(list(agentstore.read_mcp(self.agent_dir).keys()), ["files"])
        self.assertGreaterEqual(len(list((self.agent_dir / "backup").glob("mcp_*.json"))), 1)

    def test_concurrent_write_json_no_tmp_collision(self):
        target = self.agent_dir / "settings.json"
        errors = []
        barrier = threading.Barrier(2)

        def writer(value):
            try:
                barrier.wait(timeout=5)
                agentstore._write_json(target, {"activeProviders": [value]})
            except BaseException as error:  # noqa: BLE001 - surfaced below
                errors.append(error)

        threads = [threading.Thread(target=writer, args=(name,)) for name in ("tokenrouter", "omniroute")]
        for thread in threads:
            thread.start()
        for thread in threads:
            thread.join(timeout=10)
        self.assertEqual(errors, [], f"concurrent writes must not collide: {errors}")
        self.assertEqual(len(list(self.agent_dir.glob("*.tmp"))), 0, "no tmp files may remain")
        data = agentstore._read_json(target)
        self.assertTrue(data["activeProviders"][0] in ("tokenrouter", "omniroute"))
