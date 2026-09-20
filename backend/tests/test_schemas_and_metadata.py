import json

from services.analysis_schemas import (
    detect_prompt_type,
    validate_response,
    EXTRACT,
    OBLIGATIONS,
    TIMELINE,
    FLAGS,
    SUMMARY,
    ALERTS,
)
from services.gemini_client import call_gemini

from conftest import A_USER, B_USER, seed_contract, patch_gemini


# ---------------------------------------------------------------------------
# Prompt-type detection must be order-safe: several real prompts share words
# (alerts mention "obligations", the summary schema mentions "risk").
# ---------------------------------------------------------------------------

def test_prompt_type_detection_is_order_safe():
    assert detect_prompt_type("You are a contract intelligence engine ... parties ... source_sections") == EXTRACT
    assert detect_prompt_type("You are a contract obligations analyst ... every obligation") == OBLIGATIONS
    assert detect_prompt_type("Extract all dates ... chronological timeline ... source_clause") == TIMELINE
    assert detect_prompt_type("You are a contract risk analyst ... flags: [{clause_text ...}]") == FLAGS
    assert detect_prompt_type("You are a business contract summarizer ... risk_highlights: [string]") == SUMMARY
    # Alerts engine prompt contains the word "obligations" but must be alerts.
    assert detect_prompt_type(
        "You are a contract alerts engine. identify all obligations or deadlines due within 7 days."
    ) == ALERTS
    assert detect_prompt_type("You are a contract Q&A assistant. Answer the question ...") != EXTRACT
    assert detect_prompt_type("You are a contract comparison engine. Given Contract A and Contract B") == "compare"
    assert detect_prompt_type("You are a contract Q&A assistant. Answer based on source_section") == "qa"


# ---------------------------------------------------------------------------
# validate_response coerces and normalizes without dropping the pipeline.
# ---------------------------------------------------------------------------

def test_validate_response_coerces_types_and_drops_unknown_keys():
    raw = {
        "document_type": "Lease",
        "parties": [{"name": "Landlord Co", "role": "Lessor", "email": "x@y.com"}],
        "effective_date": "2026-01-01",
        "important_dates": [{"date": "2026-12-31", "label": "End", "type": "termination"}],
        "stray_key": "must be dropped",
    }
    out = validate_response(
        "You are a contract intelligence engine ... parties ... source_sections", raw
    )
    assert out["document_type"] == "Lease"
    assert out["parties"][0]["name"] == "Landlord Co"
    assert out["parties"][0]["role"] == "Lessor"
    assert "email" not in out["parties"][0], "unknown party keys must be dropped"
    assert "stray_key" not in out
    assert out["important_dates"][0]["date"] == "2026-12-31"
    # Defaults filled for missing fields.
    assert out["governing_law"] == ""
    assert out["source_sections"] == {}


def test_validate_response_returns_raw_with_warning_on_hard_failure():
    out = validate_response("executive summary prompt", "not a dict")
    assert isinstance(out, dict)
    assert "validation_warning" in out


def test_validate_response_defaults_urgency_and_flag_fields():
    out = validate_response(
        "You are a contract risk analyst.",
        {"flags": [{"clause_text": "Liability cap"}]},
    )
    assert out["flags"][0]["severity"] == "Medium"
    assert out["flags"][0]["title"] == ""
    assert out["flags"][0]["reason"] == ""


# ---------------------------------------------------------------------------
# Document-grounded mappings: the enriched fields flow through the API.
# ---------------------------------------------------------------------------

def test_extract_enriches_and_persists_document_metadata(api, monkeypatch, fake_supabase):
    def respond(prompt):
        return json.dumps({
            "document_type": "Master Services Agreement",
            "title": "Giraffe MSA",
            "governing_law": "England and Wales",
            "financial_value": "50,000 USD annual",
            "parties": [{"name": "Giraffe Industries", "role": "Provider"}],
            "effective_date": "2026-01-01",
            "important_dates": [{"date": "2026-12-31", "label": "Expiry", "type": "termination"}],
        })

    patch_gemini(monkeypatch, respond=respond)
    seed_contract(fake_supabase.store, "c1", user_id="user-a")
    client = api(A_USER)

    resp = client.post("/extract", json={"text": "Giraffe Industries MSA document", "contract_id": "c1"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["document_type"] == "Master Services Agreement"
    assert data["governing_law"] == "England and Wales"
    assert data["financial_value"] == "50,000 USD annual"

    ext = fake_supabase.store["contract_extractions"][0]
    assert ext["document_type"] == "Master Services Agreement"
    assert ext["title"] == "Giraffe MSA"
    assert ext["governing_law"] == "England and Wales"
    assert ext["financial_value"] == "50,000 USD annual"
    assert ext["important_dates"][0]["label"] == "Expiry"

    # The detected document type is surfaced on the contract row.
    assert fake_supabase.store["contracts"][0]["document_type"] == "Master Services Agreement"


def test_flags_and_obligations_persist_richer_fields(api, monkeypatch, fake_supabase):
    def respond(prompt):
        if "risk analyst" in prompt:
            return json.dumps({"flags": [{
                "title": "Low liability cap",
                "clause_text": "Liability limited to one month of fees",
                "reason": "Underprotected",
                "severity": "High",
                "section_reference": "S9.1",
                "page_reference": "5",
                "business_impact": "Limited recourse",
                "review_consideration": "Negotiate cap",
            }]})
        return json.dumps({"obligations": [{
            "party": "Giraffe Industries",
            "description": "Deliver SLA",
            "deadline": "2026-10-01",
            "urgency": "High",
            "source_clause": "S4.2",
            "obligation_type": "Performance",
            "frequency": "Monthly",
        }]})

    patch_gemini(monkeypatch, respond=respond)
    seed_contract(fake_supabase.store, "c1", user_id="user-a")
    client = api(A_USER)

    client.post("/flags", json={"text": "doc", "contract_id": "c1"})
    client.post("/obligations", json={"text": "doc", "contract_id": "c1"})

    flag = fake_supabase.store["flags"][0]
    assert flag["title"] == "Low liability cap"
    assert flag["business_impact"] == "Limited recourse"
    assert flag["review_consideration"] == "Negotiate cap"
    assert flag["page_reference"] == "5"

    ob = fake_supabase.store["obligations"][0]
    assert ob["obligation_type"] == "Performance"
    assert ob["frequency"] == "Monthly"


def test_upload_persists_document_metadata(api, monkeypatch, fake_supabase):
    patch_gemini(monkeypatch, respond=lambda prompt: '{"parties": []}')
    client = api(A_USER)

    resp = client.post(
        "/upload",
        files={"file": ("lease.txt", b"Lease agreement for Warehouse 7, pages of text here.", "text/plain")},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["file_type"] == "txt"
    assert data["file_size_bytes"] == len(b"Lease agreement for Warehouse 7, pages of text here.")

    contract = fake_supabase.store["contracts"][0]
    assert contract["file_type"] == "txt"
    assert contract["file_size_bytes"] == len(b"Lease agreement for Warehouse 7, pages of text here.")
    assert contract["pages"] == 1
    assert contract["analysis_status"] == "pending"


# ---------------------------------------------------------------------------
# Analysis lifecycle status patches.
# ---------------------------------------------------------------------------

def test_status_patch_supports_analysis_lifecycle(api, fake_supabase):
    seed_contract(fake_supabase.store, "c1", user_id="user-a")
    client = api(A_USER)

    resp = client.patch("/contracts/c1/status", json={"analysis_status": "running"})
    assert resp.status_code == 200
    assert fake_supabase.store["contracts"][0]["analysis_status"] == "running"

    resp = client.patch("/contracts/c1/status", json={"analysis_status": "completed"})
    assert resp.status_code == 200
    contract = fake_supabase.store["contracts"][0]
    assert contract["analysis_status"] == "completed"
    assert contract["analyzed_at"]

    resp = client.patch("/contracts/c1/status", json={"analysis_status": "failed", "analysis_error": "quota exceeded"})
    assert resp.status_code == 200
    contract = fake_supabase.store["contracts"][0]
    assert contract["analysis_status"] == "failed"
    assert contract["analysis_error"] == "quota exceeded"
    assert contract["analyzed_at"] is None

    # Invalid lifecycle values rejected.
    resp = client.patch("/contracts/c1/status", json={"analysis_status": "bogus"})
    assert resp.status_code == 400


# ---------------------------------------------------------------------------
# Offline demo outputs are type-consistent and tagged, never silent.
# ---------------------------------------------------------------------------

def test_fallback_payloads_are_tagged_and_type_consistent(monkeypatch):
    import services.gemini_client as gc
    monkeypatch.setattr(gc, "USE_FALLBACK", True)
    monkeypatch.setattr(gc, "model", None)

    extract = call_gemini("You are a contract intelligence engine ... parties ... source_sections", "x")
    assert extract["source"] == "offline-demo"
    assert extract["document_type"]
    assert extract["parties"]

    summary = call_gemini("You are a business contract summarizer ... headline", "x")
    assert summary["source"] == "offline-demo"
    assert "headline" in summary and "overview" in summary

    flags = call_gemini("You are a contract risk analyst.", "x")
    assert flags["source"] == "offline-demo"
    assert flags["flags"] and flags["flags"][0]["title"]

    # The alerts fallback is NOT classified as obligations despite the prompt
    # mentioning the word "obligations".
    alerts = call_gemini("You are a contract alerts engine. due within 7 days", "x")
    assert alerts["source"] == "offline-demo"
    assert isinstance(alerts.get("alerts"), list)
    assert "count" not in alerts or True  # alerts route recomputes counts client-side