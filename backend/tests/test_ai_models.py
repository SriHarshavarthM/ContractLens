"""Model configuration guardrails for the Gemini integration.

The Gemini API retired `gemini-2.5-pro` / `gemini-2.5-flash` for new accounts
(404 "no longer available"). These tests keep the default/fallback model chain
pointing at a current model and prevent a `models/` path prefix from leaking
into the model id the SDK receives.
"""

from services.gemini_client import (
    DEFAULT_MODEL,
    ALTERNATE_MODELS,
    FALLBACK_MODEL,
    PRIMARY_MODEL,
    _normalize_model_id,
)


def test_default_model_is_the_current_one():
    # The shipped default must be a current, deployable model id.
    assert DEFAULT_MODEL == "gemini-3.6-flash"


def test_configured_models_are_never_obsolete_or_prefixed():
    """Primary/fallback/alternates must never select a retired id, and must
    never carry a doubled `models/` prefix."""
    retired = {"gemini-1.5-pro", "gemini-2.5-pro", "gemini-2.5-flash", "gemini-flash-latest"}
    ids = [PRIMARY_MODEL, FALLBACK_MODEL] + ALTERNATE_MODELS
    assert ids, "model chain must not be empty"
    for mid in ids:
        assert mid, "empty model id in chain"
        assert mid not in retired, f"retired model id selected: {mid}"
        assert not mid.startswith("models/"), f"prefix leaked into model id: {mid}"
        assert not mid.startswith("models/models/"), f"doubled prefix in model id: {mid}"
    assert "gemini-3.6-flash" in set(ids), "current default must be present in the chain"


def test_normalize_model_id_strips_path_prefix_once():
    # The API error string echoes `models/gemini-3.6-flash`; operators may copy
    # that verbatim into GEMINI_MODEL. The normalizer must strip it exactly once.
    assert _normalize_model_id("gemini-3.6-flash") == "gemini-3.6-flash"
    assert _normalize_model_id("models/gemini-3.6-flash") == "gemini-3.6-flash"
    assert "models/" not in _normalize_model_id("models/gemini-3.6-flash")
    assert _normalize_model_id("  gemini-3.6-flash  ") == "gemini-3.6-flash"
    assert _normalize_model_id("") == ""
    assert _normalize_model_id(None) == ""


def test_model_chain_is_deduplicated():
    # With identical defaults the fallback list must not retry the same model.
    assert "gemini-3.6-flash" in ALTERNATE_MODELS
    assert len([m for m in ALTERNATE_MODELS if m == "gemini-3.6-flash"]) <= 1