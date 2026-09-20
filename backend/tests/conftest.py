import os
import sys
from pathlib import Path

# Make `backend/` importable and neutralise any real .env*.local credentials so
# tests never touch live Supabase/Gemini. python-dotenv does NOT override
# variables that already exist in the environment (override=False by default).
_BACKEND_DIR = str(Path(__file__).resolve().parent.parent)
sys.path.insert(0, _BACKEND_DIR)
os.environ.setdefault("SUPABASE_URL", "")
os.environ.setdefault("SUPABASE_ANON_KEY", "")
os.environ.setdefault("SUPABASE_JWT_SECRET", "")
os.environ.setdefault("GEMINI_API_KEY", "")

import pytest
from fastapi.testclient import TestClient

import main as main_mod
from main import app
from services.security import get_current_user


# ---------------------------------------------------------------------------
# In-memory fake Supabase client (chainable postgrest-style query builder).
# ---------------------------------------------------------------------------

class FakeSingleError(Exception):
    pass


class Result:
    def __init__(self, data):
        self.data = data


class QueryBuilder:
    def __init__(self, store, table):
        self._store = store
        self._table = table
        self._filters = []
        self._cols = None
        self._single = False
        self._limit = None
        self._order = None
        self._insert_payload = None
        self._update_payload = None
        self._delete = False
        self._counter = store.setdefault("_seq", {"n": 0})["n"]

    def select(self, cols="*"):
        self._cols = cols
        return self

    def eq(self, key, value):
        self._filters.append((key, value))
        return self

    def single(self):
        self._single = True
        return self

    def limit(self, n):
        self._limit = n
        return self

    def order(self, col, desc=False):
        self._order = (col, desc)
        return self

    def insert(self, payload):
        self._insert_payload = payload
        return self

    def update(self, payload):
        self._update_payload = payload
        return self

    def delete(self):
        self._delete = True
        return self

    def execute(self):
        rows = self._store.setdefault(self._table, [])

        if self._insert_payload is not None:
            payload = self._insert_payload
            if isinstance(payload, dict):
                payload = [payload]
            for row in payload:
                if "id" not in row:
                    self._counter += 1
                    row["id"] = f"fake_{self._table}_{self._counter}"
            rows.extend(payload)
            return Result(payload)

        if self._delete:
            removed = [r for r in rows if all(r.get(k) == v for k, v in self._filters)]
            self._store[self._table] = [r for r in rows if r not in removed]
            return Result(removed)

        matched = [r for r in rows if all(r.get(k) == v for k, v in self._filters)]

        if self._update_payload is not None:
            for r in matched:
                r.update(self._update_payload)
            return Result(matched)

        out = matched
        if self._cols and self._cols != "*":
            cols = [c.strip() for c in self._cols.split(",")]
            out = [{c: r.get(c) for c in cols} for r in out]
        if self._order:
            col, desc = self._order
            out = sorted(out, key=lambda r: r.get(col) or "", reverse=desc)
        if self._limit:
            out = out[: self._limit]
        if self._single:
            if out:
                return Result(out[0])
            raise FakeSingleError("no rows for single()")
        return Result(out)


class FakeClient:
    def __init__(self):
        self.store = {"_seq": {"n": 0}}

    def table(self, name):
        return QueryBuilder(self.store, name)


# ---------------------------------------------------------------------------
# Fake Gemini models.
# ---------------------------------------------------------------------------

class FakeText:
    def __init__(self, text):
        self.text = text


class FakeGemModel:
    def __init__(self, model_name="gemini-3.6-flash", respond=None, fail=False):
        self.model_name = model_name
        self._respond = respond or (lambda prompt: '{"ok": true}')
        self._fail = fail

    def generate_content(self, prompt, stream=False, **kwargs):
        if self._fail:
            raise RuntimeError("Gemini API unavailable")
        out = self._respond(prompt)

        class Chunk:
            def __init__(self, text):
                self.text = text

        if stream:
            step = 24
            return [Chunk(out[i : i + step]) for i in range(0, len(out), step)]
        return FakeText(out)


def patch_gemini(monkeypatch, respond=None, fail=False):
    """Switch gemini_client into a fully-configured state with fake models."""
    import services.gemini_client as gc

    monkeypatch.setattr(gc, "USE_FALLBACK", False)

    def build(name=None, **kw):
        if "model_name" not in kw:
            kw["model_name"] = name or "gemini-3.6-flash"
        return FakeGemModel(respond=respond, fail=fail, **kw)

    monkeypatch.setattr(gc, "model", build())
    monkeypatch.setattr(gc.genai, "GenerativeModel", build)
    return gc


# ---------------------------------------------------------------------------
# Fixtures.
# ---------------------------------------------------------------------------

@pytest.fixture
def fake_supabase(monkeypatch):
    """Patch data_client in every module that uses it to one shared FakeClient."""
    import routes.extract, routes.flags, routes.obligations
    import routes.timeline, routes.summary, routes.alerts, routes.contracts, routes.upload
    from services import ownership

    client = FakeClient()
    targets = [
        routes.extract,
        routes.flags,
        routes.obligations,
        routes.timeline,
        routes.summary,
        routes.alerts,
        routes.contracts,
        routes.upload,
        ownership,
        main_mod,
    ]
    for mod in targets:
        monkeypatch.setattr(mod, "data_client", lambda user, _c=client: _c)
    return client


@pytest.fixture
def api(fake_supabase):
    """Return a TestClient whose get_current_user dependency is overridden."""
    created = []

    def _make(user):
        app.dependency_overrides[get_current_user] = (lambda u=user: u)
        client = TestClient(app)
        created.append(client)
        return client

    yield _make
    app.dependency_overrides.clear()


A_USER = {"sub": "user-a", "id": "user-a", "email": "a@example.com", "role": "authenticated", "token": "tok-a"}
B_USER = {"sub": "user-b", "id": "user-b", "email": "b@example.com", "role": "authenticated", "token": "tok-b"}


def seed_contract(store, contract_id, name="master.pdf", user_id="user-a", raw="Giraffe Industries MSA"):
    store.setdefault("contracts", []).append({
        "id": contract_id,
        "name": name,
        "raw_text": raw,
        "status": "active",
        "user_id": user_id,
        "uploaded_at": "2026-09-01T00:00:00+00:00",
    })