import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi import HTTPException

from app import agentstore, providers


class ProviderActivationTests(unittest.TestCase):
    def test_create_provider_can_remain_inactive(self):
        with tempfile.TemporaryDirectory() as folder, patch.object(agentstore, "require_agent_dir", return_value=Path(folder)):
            result = providers.create_provider(providers.ProviderBody(name="Review", baseUrl="https://example.test/v1", activate=False))
            self.assertFalse(result["active"])
            self.assertEqual(agentstore.get_active_providers(Path(folder)), [])

    def test_activate_then_deactivate_toggles_settings_list(self):
        with tempfile.TemporaryDirectory() as folder, patch.object(agentstore, "require_agent_dir", return_value=Path(folder)):
            agentstore.write_provider(Path(folder), "alpha", "Alpha", "https://example.test/v1", "k")
            agentstore.write_provider(Path(folder), "beta", "Beta", "https://example.test/v1", "k")
            self.assertEqual(providers.activate("alpha")["active"], True)
            self.assertEqual(agentstore.get_active_providers(Path(folder)), ["alpha"])
            self.assertEqual(providers.activate("beta")["active"], True)
            self.assertEqual(agentstore.get_active_providers(Path(folder)), ["beta", "alpha"])
            self.assertEqual(providers.deactivate("alpha")["active"], False)
            self.assertEqual(agentstore.get_active_providers(Path(folder)), ["beta"])
            self.assertEqual(providers.deactivate("beta")["active"], False)
            self.assertEqual(agentstore.get_active_providers(Path(folder)), [])

    def test_activate_missing_provider_raises(self):
        with tempfile.TemporaryDirectory() as folder, patch.object(agentstore, "require_agent_dir", return_value=Path(folder)):
            with self.assertRaises(HTTPException):
                providers.activate("nope")
            with self.assertRaises(HTTPException):
                providers.deactivate("nope")

    def test_edit_provider_replaces_models_removed_from_the_form(self):
        with tempfile.TemporaryDirectory() as folder, patch.object(agentstore, "require_agent_dir", return_value=Path(folder)):
            provider = providers.create_provider(providers.ProviderBody(
                name="LiteLLM",
                baseUrl="http://localhost:4000/v1",
                models=[
                    providers.ModelItem(model="deepseek-v4-flash-0731", name="DeepSeek V4 Flash"),
                    providers.ModelItem(model="deepseek-v4-flash-free", name="DeepSeek V4 Flash Free"),
                    providers.ModelItem(model="gemini-3.5-flash-lite", name="Gemini 3.5 Flash Lite"),
                ],
                activate=True,
            ))

            updated = providers.update_provider(provider["id"], providers.ProviderBody(
                name="LiteLLM",
                baseUrl="http://localhost:4000/v1",
                models=[providers.ModelItem(model="deepseek-v4-flash-0731", name="DeepSeek V4 Flash")],
            ))

            self.assertEqual([model["model"] for model in updated["models"]], ["deepseek-v4-flash-0731"])
            saved = json.loads(agentstore.models_file(Path(folder), provider["id"]).read_text(encoding="utf-8"))
            self.assertEqual(set(saved["models"]), {"deepseek-v4-flash-0731"})

    def test_edit_provider_preserves_legacy_per_model_openai_reasoning(self):
        with tempfile.TemporaryDirectory() as folder, patch.object(agentstore, "require_agent_dir", return_value=Path(folder)):
            root = Path(folder)
            provider = providers.create_provider(providers.ProviderBody(
                name="LiteLLM",
                baseUrl="http://localhost:4000/v1",
                reasoningFormat="opencode",
                activate=True,
            ))
            openai_levels = ["none", "low", "medium", "high", "xhigh"]
            agentstore.write_models(root, provider["id"], [
                {"model": "deepseek-v4-flash-0731", "name": "DeepSeek V4 Flash", "thinking": openai_levels},
                {"model": "gemini-3.5-flash-lite", "name": "Gemini 3.5 Flash Lite", "thinking": openai_levels},
                {"model": "deepseek-v4-flash-free", "name": "DeepSeek V4 Flash Free", "thinking": openai_levels},
            ], format_id="openai")

            updated = providers.update_provider(provider["id"], providers.ProviderBody(
                name="LiteLLM",
                baseUrl="http://localhost:4000/v1",
                models=[
                    providers.ModelItem(model="deepseek-v4-flash-0731", name="DeepSeek V4 Flash", thinking=openai_levels),
                    providers.ModelItem(model="gemini-3.5-flash-lite", name="Gemini 3.5 Flash Lite", thinking=openai_levels),
                ],
            ))

            saved = json.loads(agentstore.models_file(root, provider["id"]).read_text(encoding="utf-8"))
            self.assertEqual(set(saved["models"]), {"deepseek-v4-flash-0731", "gemini-3.5-flash-lite"})
            for model_id in saved["models"]:
                self.assertEqual(set(saved["models"][model_id]["variants"]), set(openai_levels))
                self.assertEqual(saved["models"][model_id]["reasoningFormat"], "openai")
            self.assertEqual({model["reasoningFormat"] for model in updated["models"]}, {"openai"})
