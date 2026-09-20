import json

from conftest import A_USER, seed_contract, patch_gemini


# ---------------------------------------------------------------------------
# Field contracts: every analysis category MUST return the envelopes and item
# keys the frontend consumes. These names are a contract between backend and
# frontend and must not drift silently into "empty success".
# ---------------------------------------------------------------------------

def test_every_category_returns_documented_envelope_and_fields(api, monkeypatch, fake_supabase):
    def respond(prompt):
        p = prompt.lower()
        if "contract intelligence engine" in p:
            return json.dumps({
                "title": "Master Agreement",
                "parties": [{"name": "Acme", "role": "Provider"}],
                "effective_date": "2026-01-01",
                "expiration_date": "2027-01-01",
                "important_dates": [{"date": "2026-01-01", "label": "Commencement"}],
                "governing_law": "Delaware",
                "financial_value": "$100,000",
                "service_obligations": "Provide support",
                "validation_warning": None,
            })
        if "alerts engine" in p:
            return json.dumps({"alerts": [{
                "obligation": "Pay", "deadline": "2026-10-02", "days_remaining": 13,
                "urgency": "High", "party": "Acme", "source_clause": "S5.1",
            }]})
        if "timeline" in p:
            return json.dumps({"timeline": [{
                "date": "2026-10-01", "label": "Renewal", "type": "renewal",
                "party": "Both", "description": "Renewal window",
                "source_clause": "S8.3", "page_reference": "4",
            }]})
        if "risk analyst" in p:
            return json.dumps({"flags": [{
                "title": "Liability cap", "clause_text": "Cap at $1",
                "reason": "Low cap", "severity": "High", "section_reference": "S9.1",
                "page_reference": "5", "business_impact": "Exposes Acme",
                "review_consideration": "Negotiate cap up",
            }]})
        if "summariz" in p or "summary" in p:
            return json.dumps({
                "headline": "Headline", "overview": "A deal",
                "parties_summary": "Acme + TechInc",
                "key_commitments": ["Deliver"], "critical_dates": ["2026-10-01"],
                "financial_terms": "$100,000", "risk_highlights": ["Liability cap"],
                "recommended_actions": ["Negotiate"],
            })
        if "obligation" in p:
            return json.dumps({"obligations": [{
                "party": "Acme", "description": "Deliver SLA", "deadline": "2026-10-01",
                "frequency": "Monthly", "obligation_type": "Performance",
                "urgency": "High", "source_clause": "S4.2",
            }]})
        raise AssertionError(f"unmatched prompt: {prompt[:80]}")

    patch_gemini(monkeypatch, respond=respond)
    seed_contract(fake_supabase.store, "c1", user_id="user-a")
    client = api(A_USER)
    body = {"text": "Giraffe Industries MSA", "contract_id": "c1", "ref_date": "2026-09-19"}

    ex = client.post("/extract", json=body).json()
    assert ex["parties"][0]["name"] == "Acme"
    assert ex["financial_value"] == "$100,000"

    ob = client.post("/obligations", json=body).json()
    assert "obligations" in ob and len(ob["obligations"]) == 1
    for key in ("party", "description", "deadline", "frequency", "obligation_type", "urgency", "source_clause"):
        assert key in ob["obligations"][0], f"obligations missing key: {key}"

    tl = client.post("/timeline", json=body).json()
    assert "timeline" in tl and len(tl["timeline"]) == 1
    for key in ("date", "label", "type", "party", "description", "source_clause", "page_reference"):
        assert key in tl["timeline"][0], f"timeline missing key: {key}"

    fl = client.post("/flags", json=body).json()
    assert "flags" in fl and len(fl["flags"]) == 1
    for key in ("title", "clause_text", "reason", "severity", "section_reference", "page_reference", "business_impact", "review_consideration"):
        assert key in fl["flags"][0], f"flags missing key: {key}"

    sm = client.post("/summary", json=body).json()
    for key in ("headline", "overview", "parties_summary", "key_commitments", "critical_dates", "financial_terms", "risk_highlights", "recommended_actions"):
        assert key in sm, f"summary missing key: {key}"

    al = client.post("/alerts?today=2026-09-19", json=body).json()
    assert "alerts" in al and "count" in al and len(al["alerts"]) == 1
    for key in ("obligation", "deadline", "days_remaining", "urgency", "party", "source_clause"):
        assert key in al["alerts"][0], f"alerts missing key: {key}"


# ---------------------------------------------------------------------------
# A failed category must NEVER be persisted or restorable as an empty success.
# ---------------------------------------------------------------------------

def test_failed_category_is_never_persisted_as_empty_success(api, monkeypatch, fake_supabase):
    patch_gemini(monkeypatch, fail=True)
    seed_contract(fake_supabase.store, "c1", user_id="user-a")
    client = api(A_USER)
    body = {"text": "Giraffe Industries MSA", "contract_id": "c1", "ref_date": "2026-09-19"}

    for endpoint in ("/extract", "/obligations", "/flags", "/timeline", "/summary"):
        resp = client.post(endpoint, json=body)
        assert resp.status_code == 502, f"{endpoint} should fail with 502, got {resp.status_code}: {resp.text}"
    resp = client.post("/alerts?today=2026-09-19", json=body)
    assert resp.status_code == 502

    # Nothing was written that a later refresh could restore as fake success.
    contract = fake_supabase.store["contracts"][0]
    assert "summary" not in contract
    assert "timeline" not in contract
    assert "alerts" not in contract
    assert fake_supabase.store.get("obligations", []) == []
    assert fake_supabase.store.get("flags", []) == []
    assert fake_supabase.store.get("contract_extractions", []) == []

    # The lifecycle latch honestly persists 'failed' with the error text.
    patch = client.patch("/contracts/c1/status",
                         json={"analysis_status": "failed", "analysis_error": "Analysis incomplete: Summary failed."})
    assert patch.status_code == 200
    assert fake_supabase.store["contracts"][0]["analysis_status"] == "failed"
    assert fake_supabase.store["contracts"][0]["analysis_error"] == "Analysis incomplete: Summary failed."


# ---------------------------------------------------------------------------
# Partial failure: a failing category must not wipe out the categories that
# succeeded (honest partial success at the persistence layer).
# ---------------------------------------------------------------------------

def test_partial_failure_keeps_successful_categories_persisted(api, monkeypatch, fake_supabase):
    def respond(prompt):
        if "timeline" in prompt:
            raise RuntimeError("quota exceeded")
        if "obligation" in prompt:
            return '{"obligations": [{"party": "Acme", "description": "Deliver SLA", "deadline": "2026-10-02", "urgency": "High", "source_clause": "S4.2"}]}'
        raise AssertionError(f"unmatched prompt: {prompt[:80]}")

    patch_gemini(monkeypatch, respond=respond)
    seed_contract(fake_supabase.store, "c1", user_id="user-a")
    client = api(A_USER)
    body = {"text": "Giraffe Industries MSA", "contract_id": "c1", "ref_date": "2026-09-19"}

    ob = client.post("/obligations", json=body)
    assert ob.status_code == 200
    tl = client.post("/timeline", json=body)
    assert tl.status_code == 502

    rows = fake_supabase.store["obligations"]
    assert len(rows) == 1 and rows[0]["description"] == "Deliver SLA"
    assert "timeline" not in fake_supabase.store["contracts"][0]


# ---------------------------------------------------------------------------
# Distinct documents produce distinct results for every analysis category.
# ---------------------------------------------------------------------------

def test_all_categories_are_document_specific(api, monkeypatch, fake_supabase):
    def respond(prompt):
        p = prompt.lower()
        giraffe = "UNIQUE-GIRAFFE" in prompt
        if "risk analyst" in p:
            return json.dumps({"flags": [{"title": "Giraffe risk" if giraffe else "Zebra risk",
                                          "reason": "r", "severity": "Low", "section_reference": "S2"}]})
        if "summariz" in p or "summary" in p:
            return json.dumps({"headline": "Giraffe summary" if giraffe else "Zebra summary"})
        if "obligation" in p:
            return json.dumps({"obligations": [{
                "party": "GiraffeCo" if giraffe else "ZebraCo",
                "description": "Giraffe obligation" if giraffe else "Zebra obligation",
                "deadline": "2026-10-01", "urgency": "High", "source_clause": "S1",
            }]})
        raise AssertionError(f"unmatched prompt: {prompt[:80]}")

    patch_gemini(monkeypatch, respond=respond)
    seed_contract(fake_supabase.store, "c1", user_id="user-a")
    seed_contract(fake_supabase.store, "c2", user_id="user-a")
    client = api(A_USER)

    b1 = {"text": "Alpha UNIQUE-GIRAFFE doc", "contract_id": "c1"}
    b2 = {"text": "Beta UNIQUE-ZEBRA doc", "contract_id": "c2"}

    assert client.post("/obligations", json=b1).json()["obligations"][0]["party"] == "GiraffeCo"
    assert client.post("/obligations", json=b2).json()["obligations"][0]["party"] == "ZebraCo"
    assert client.post("/flags", json=b1).json()["flags"][0]["title"] == "Giraffe risk"
    assert client.post("/flags", json=b2).json()["flags"][0]["title"] == "Zebra risk"
    assert client.post("/summary", json=b1).json()["headline"] == "Giraffe summary"
    assert client.post("/summary", json=b2).json()["headline"] == "Zebra summary"