import json

from services.gemini_client import call_gemini, GeminiRequestError

from conftest import A_USER, B_USER, seed_contract, patch_gemini


# ---------------------------------------------------------------------------
# Bug 2: distinct documents must produce document-specific results, and a real
# Gemini error must never be turned into the canned fallback dataset.
# ---------------------------------------------------------------------------

def test_call_gemini_raises_on_api_error_not_fallback(monkeypatch):
    patch_gemini(monkeypatch, respond=lambda prompt: '{"ok": true}', fail=True)
    try:
        call_gemini("executive summary", "Some contract text")
        raise AssertionError("Expected GeminiRequestError")
    except GeminiRequestError as e:
        assert "Gemini API request failed" in str(e)


def test_call_gemini_raises_on_empty_response_not_fallback(monkeypatch):
    patch_gemini(monkeypatch, respond=lambda prompt: "")
    try:
        call_gemini("executive summary", "Some contract text")
        raise AssertionError("Expected GeminiRequestError")
    except GeminiRequestError:
        pass


def test_analysis_prefers_request_specific_text(api, monkeypatch):
    """Two different documents posted to the same endpoint return two distinct
    results, and the request text is what reaches the mocked AI client."""
    seen = []

    def respond(prompt):
        seen.append(prompt)
        if "UNIQUE-EMERALD" in prompt:
            return '{"timeline": [{"date": "2026-01-01", "label": "EMERALD DEADLINE"}]}'
        return '{"timeline": [{"date": "2026-02-02", "label": "RUBY DEADLINE"}]}'

    patch_gemini(monkeypatch, respond=respond)
    client = api(A_USER)

    r1 = client.post("/timeline", json={"text": "Alpha contract UNIQUE-EMERALD terms, 24 months."})
    r2 = client.post("/timeline", json={"text": "Beta contract UNIQUE-RUBY terms, renewal."})

    assert r1.status_code == 200
    assert r2.status_code == 200
    assert r1.json()["timeline"][0]["label"] == "EMERALD DEADLINE"
    assert r2.json()["timeline"][0]["label"] == "RUBY DEADLINE"

    # The actual submitted document text must reach the AI client.
    assert len(seen) == 2
    assert "Alpha contract UNIQUE-EMERALD terms, 24 months." in seen[0]
    assert "Beta contract UNIQUE-RUBY terms, renewal." in seen[1]


def test_all_analysis_routes_error_clearly_when_gemini_fails(api, monkeypatch):
    patch_gemini(monkeypatch, fail=True)
    client = api(A_USER)
    body = {"text": "Giraffe Industries MSA"}

    for endpoint in ("/extract", "/flags", "/obligations", "/timeline", "/summary", "/compare", "/qa"):
        resp = client.post(endpoint, json=body if endpoint not in ("/compare", "/qa") else (
            {"contract_a": "v1", "contract_b": "v2"} if endpoint == "/compare" else
            {"contract_text": "Giraffe Industries MSA", "question": "What is the term?"}
        ))
        assert resp.status_code == 502, f"{endpoint} should return 502, got {resp.status_code}: {resp.text}"
        assert "Gemini" in resp.json()["detail"]


def test_alerts_route_errors_clearly_when_gemini_fails(api, monkeypatch):
    patch_gemini(monkeypatch, fail=True)
    client = api(A_USER)
    resp = client.post("/alerts?today=2026-09-19", json={"text": "Giraffe Industries MSA"})
    assert resp.status_code == 502
    assert "Gemini" in resp.json()["detail"]


def test_stream_error_emits_sse_error_not_fabricated_complete(api, monkeypatch):
    patch_gemini(monkeypatch, fail=True)
    client = api(A_USER)
    resp = client.post("/extract/stream", json={
        "text": "Giraffe Industries MSA", "filename": "g.pdf", "contract_id": "c1", "ref_date": "2026-09-19",
    })
    assert resp.status_code == 200
    body = resp.text
    assert '"type": "error"' in body
    assert '"type": "complete"' not in body
    assert "Acme Corp" not in body


def test_offline_demo_fallback_is_tagged(api, monkeypatch):
    """When no Gemini key is configured the canned dataset survives for local
    dev but carries a `source: offline-demo` marker so the UI cannot present it
    as a real analysis."""
    import services.gemini_client as gc
    monkeypatch.setattr(gc, "USE_FALLBACK", True)
    monkeypatch.setattr(gc, "model", None)
    client = api(A_USER)

    resp = client.post("/extract", json={"text": "whatever document"})
    assert resp.status_code == 200
    assert resp.json().get("source") == "offline-demo"


# ---------------------------------------------------------------------------
# Bug 1: analysis persistence and restoration for the owning user.
# ---------------------------------------------------------------------------

def test_analysis_persists_and_restores_to_owner(api, monkeypatch, fake_supabase):
    def respond(prompt):
        if "contract intelligence engine" in prompt:
            return '{"parties": [{"name": "Acme", "role": "Provider"}, {"name": "TechInc", "role": "Client"}], "effective_date": "2026-01-01"}'
        if "timeline" in prompt:
            return '{"timeline": [{"date": "2026-10-01", "label": "Renewal", "type": "renewal", "party": "Both", "description": "Renewal window", "source_clause": "S8.3"}]}'
        if "risk analyst" in prompt:
            return '{"flags": [{"clause_text": "Liability cap", "reason": "Low cap", "severity": "High", "section_reference": "S9.1"}]}'
        if "alerts engine" in prompt:
            return '{"alerts": [{"obligation": "Pay", "deadline": "2026-10-02", "days_remaining": 13, "urgency": "High", "party": "Acme", "source_clause": "S5.1"}]}'
        if "obligation" in prompt:
            return '{"obligations": [{"party": "Acme", "description": "Deliver SLA", "deadline": "2026-10-02", "urgency": "High", "source_clause": "S4.2"}]}'
        if "summary" in prompt or "summariz" in prompt:
            return '{"headline": "Saved headline", "parties_summary": "Acme + TechInc"}'
        raise AssertionError(f"unmatched prompt: {prompt[:80]}")

    patch_gemini(monkeypatch, respond=respond)
    seed_contract(fake_supabase.store, "c1", user_id="user-a")
    client = api(A_USER)

    resp = client.post("/extract", json={"text": "Giraffe Industries MSA", "contract_id": "c1"})
    assert resp.status_code == 200
    client.post("/obligations", json={"text": "Giraffe Industries MSA", "contract_id": "c1"})
    client.post("/flags", json={"text": "Giraffe Industries MSA", "contract_id": "c1"})
    client.post("/timeline", json={"text": "Giraffe Industries MSA", "ref_date": "2026-09-19", "contract_id": "c1"})
    client.post("/summary", json={"text": "Giraffe Industries MSA", "ref_date": "2026-09-19", "contract_id": "c1"})
    client.post("/alerts?today=2026-09-19", json={"text": "Giraffe Industries MSA", "contract_id": "c1"})

    contract = fake_supabase.store["contracts"][0]
    assert contract["timeline"][0]["label"] == "Renewal"
    assert contract["summary"]["headline"] == "Saved headline"
    assert contract["alerts"]["count"] == 1
    assert len(fake_supabase.store["contract_extractions"]) == 1
    assert len(fake_supabase.store["obligations"]) == 1
    assert len(fake_supabase.store["flags"]) == 1

    # Restore flow: list returns raw_text + analysis columns; detail returns all.
    lst = client.get("/contracts")
    assert lst.status_code == 200
    item = lst.json()[0]
    assert item["id"] == "c1"
    assert item["raw_text"] == "Giraffe Industries MSA"
    assert item["summary"]["headline"] == "Saved headline"
    assert item["timeline"][0]["label"] == "Renewal"
    assert item["alerts"]["count"] == 1

    detail = client.get("/contracts/c1")
    assert detail.status_code == 200
    d = detail.json()
    assert d["extractedData"]["parties"][0]["name"] == "Acme"
    assert d["obligations"][0]["description"] == "Deliver SLA"
    assert d["flags"][0]["severity"] == "High"
    assert d["timeline"][0]["label"] == "Renewal"
    assert d["summary"]["headline"] == "Saved headline"
    assert d["alerts"]["count"] == 1
    assert d["summary"]["headline"] == "Saved headline"
    assert d["alerts"]["count"] == 1


def test_reanalysis_replaces_stale_rows(api, monkeypatch, fake_supabase):
    def respond(prompt):
        if "UNIQUE-NEW" in prompt:
            return '{"obligations": [{"party": "NewCo", "description": "Fresh obligation", "deadline": "2026-11-01", "urgency": "Medium", "source_clause": "S1.1"}]}'
        return '{"obligations": [{"party": "OldCo", "description": "Stale obligation", "deadline": "2026-10-01", "urgency": "Low", "source_clause": "S1.0"}]}'

    patch_gemini(monkeypatch, respond=respond)
    seed_contract(fake_supabase.store, "c1", user_id="user-a")
    client = api(A_USER)

    client.post("/obligations", json={"text": "old UNIQUE-OLD doc", "contract_id": "c1"})
    client.post("/obligations", json={"text": "new UNIQUE-NEW doc", "contract_id": "c1"})

    rows = fake_supabase.store["obligations"]
    assert len(rows) == 1, "re-analysis must replace previous rows, not accumulate"
    assert rows[0]["party"] == "NewCo"


def test_upload_persists_and_lists_for_owner(api, monkeypatch, fake_supabase):
    patch_gemini(monkeypatch, respond=lambda prompt: '{"parties": []}')
    client = api(A_USER)

    resp = client.post(
        "/upload",
        files={"file": ("lease.txt", b"Lease agreement for Warehouse 7", "text/plain")},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert data["contract_id"]

    contract = fake_supabase.store["contracts"][0]
    assert contract["user_id"] == "user-a"
    assert contract["raw_text"] == "Lease agreement for Warehouse 7"

    lst = client.get("/contracts").json()
    assert lst[0]["name"] == "lease.txt"
    assert lst[0]["raw_text"] == "Lease agreement for Warehouse 7"


# ---------------------------------------------------------------------------
# Cross-user isolation: no write or read across owners.
# ---------------------------------------------------------------------------

def test_cross_user_cannot_read_or_write_analysis(api, monkeypatch, fake_supabase):
    def respond(prompt):
        return '{"timeline": [{"date": "2026-12-01", "label": "Sneaky", "type": "deadline", "party": "Attacker", "description": "x", "source_clause": "S1"}]}'

    patch_gemini(monkeypatch, respond=respond)
    seed_contract(fake_supabase.store, "c1", user_id="user-a", raw="SECRET contract text")
    client_a = api(A_USER)
    client_b = api(B_USER)

    # User B cannot read user A's contract (404, no existence leak).
    assert client_b.get("/contracts/c1").status_code == 404

    # User B's analysis call against user A's contract_id still returns a
    # result BUT must never write to user A's contract or child tables.
    resp = client_b.post("/timeline", json={"text": "SECRET contract text", "contract_id": "c1"})
    assert resp.status_code == 200

    contract = fake_supabase.store["contracts"][0]
    assert "timeline" not in contract, "cross-user analysis must not persist"

    client_b.post("/obligations", json={"text": "SECRET contract text", "contract_id": "c1"})
    assert len(fake_supabase.store.get("obligations", [])) == 0

    # User B's contract list only ever shows their own contracts.
    assert client_b.get("/contracts").json() == []