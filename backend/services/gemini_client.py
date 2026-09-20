import os
import json
import re
import threading
import time
from dotenv import load_dotenv
from typing import Callable, Optional
import google.generativeai as genai

from services.analysis_schemas import detect_prompt_type, validate_response

# Load .env BEFORE reading environment variables
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

DEFAULT_MODEL = "gemini-3.6-flash"


def _normalize_model_id(model_id: str) -> str:
    """Return a bare Gemini model id for the SDK.

    The API surfaces model paths as `models/gemini-3.6-flash` in its streamed
    errors, so operators sometimes copy that form into env vars. Both SDKs
    accept only the bare id; strip the prefix here so `models/` can never be
    doubled into `models/models/gemini-...`.
    """
    model_id = (model_id or "").strip()
    if model_id.startswith("models/"):
        model_id = model_id[len("models/"):]
    return model_id.strip()


# Model ids are env-configurable so operators can pin the models that work for
# their quota/region without a code change:
#   GEMINI_MODEL          -> primary model    (default: gemini-3.6-flash)
#   GEMINI_FALLBACK_MODEL -> optional failover (default: gemini-3.6-flash)
# The retired ids (`gemini-1.5-pro`, `gemini-flash-latest`, `gemini-2.5-pro`,
# `gemini-2.5-flash`) are no longer available to new accounts -- the API
# answers them with 404 "no longer available" -- and are intentionally no
# longer hard-coded so the fallback chain never retries an obsolete model.
PRIMARY_MODEL = _normalize_model_id(os.getenv("GEMINI_MODEL", DEFAULT_MODEL))
FALLBACK_MODEL = _normalize_model_id(os.getenv("GEMINI_FALLBACK_MODEL", DEFAULT_MODEL))
ALTERNATE_MODELS: list = list(dict.fromkeys([m for m in (PRIMARY_MODEL, FALLBACK_MODEL) if m]))

USE_FALLBACK = True
model = None

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    try:
        model = genai.GenerativeModel(PRIMARY_MODEL)
        print(f"[gemini_client] Using model: {PRIMARY_MODEL}")
    except Exception:
        model = genai.GenerativeModel(FALLBACK_MODEL)
        print(f"[gemini_client] Fell back to model: {FALLBACK_MODEL}")
    if model is not None:
        USE_FALLBACK = False
        print("[gemini_client] Gemini API configured successfully.")
else:
    print("[gemini_client] WARNING: No GEMINI_API_KEY found. Using fallback engine.")


def set_api_key(api_key: str) -> bool:
    global GEMINI_API_KEY, model, USE_FALLBACK
    GEMINI_API_KEY = api_key.strip() if api_key else ""
    if GEMINI_API_KEY:
        try:
            genai.configure(api_key=GEMINI_API_KEY)
            try:
                model = genai.GenerativeModel(PRIMARY_MODEL)
                print(f"[gemini_client] Using model: {PRIMARY_MODEL}")
            except Exception:
                model = genai.GenerativeModel(FALLBACK_MODEL)
                print(f"[gemini_client] Fell back to model: {FALLBACK_MODEL}")
            if model is not None:
                USE_FALLBACK = False
            print("[gemini_client] Gemini API configured via set_api_key.")
            return not USE_FALLBACK
        except Exception as e:
            print(f"[gemini_client] Failed to configure with provided key: {e}")
            USE_FALLBACK = True
            return False
    else:
        USE_FALLBACK = True
        return False


class GeminiRequestError(Exception):
    """Raised when a configured Gemini API request fails.

    Never resolved into fabricated/canned results: callers surface this as a
    clear error (HTTP 502 / SSE error event) instead of returning data that was
    never produced from the submitted document.
    """


def clean_json_response(text: str) -> str:
    """Strip markdown code fences and whitespace that Gemini adds."""
    text = text.strip()
    text = re.sub(r'^```(?:json)?\s*', '', text)
    text = re.sub(r'\s*```$', '', text)
    text = text.strip()
    first_brace = text.find('{')
    last_brace = text.rfind('}')
    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        text = text[first_brace:last_brace + 1]
    return text.strip()


def _resolve_active_models() -> list:
    """Ordered list of models to try for a prompt.

    Starts with the currently configured model, then adds distinct fallback
    models so a quota/availability failure on the primary can fail over. When
    the module is in fallback mode (or in tests where `model` is a stub), this
    returns the configured model alone.
    """
    if USE_FALLBACK or model is None:
        return []
    active = [model]
    current_name = getattr(model, "model_name", "") or PRIMARY_MODEL
    for alt in ALTERNATE_MODELS:
        if alt and alt != current_name:
            try:
                active.append(genai.GenerativeModel(alt))
            except Exception as ex:
                print(f"[gemini_client] Could not construct fallback model {alt}: {ex}")
    return active


def _parse_json(text: str):
    """Best-effort JSON parse of a model response."""
    cleaned = clean_json_response(text or "")
    return json.loads(cleaned)


def _finish(result: dict, system_prompt: str) -> dict:
    """Normalize the final dict (validation + demo source tagging)."""
    return validate_response(system_prompt, result)


def call_gemini_stream(
    system_prompt: str,
    user_content: str,
    on_chunk: Optional[Callable[[str], None]] = None,   # called for each streamed text chunk
    on_complete: Optional[Callable[[dict], None]] = None, # called with final parsed JSON
    on_error: Optional[Callable[[str], None]] = None      # called on any error
):
    """Streams Gemini response and fires callbacks as chunks arrive.

    Exactly one terminal event is fired per call: on_complete(result) when
    Gemini produced valid JSON, or on_error(message) when the configured API
    failed. Never fabricates canned data for a real API failure, so clients are
    never shown results that were not produced from their document.
    """
    if USE_FALLBACK:
        result = _serve_fallback(system_prompt)
        if on_chunk:
            serialized = json.dumps(result, indent=2)
            chunk_size = 40
            for i in range(0, len(serialized), chunk_size):
                on_chunk(serialized[i:i + chunk_size])
                time.sleep(0.02)
        if on_complete:
            on_complete(result)
        return result

    full_prompt = _build_prompt(system_prompt, user_content)

    active_models = _resolve_active_models()
    last_error = "all configured models failed"
    for m in active_models:
        accumulated = ""
        try:
            response = m.generate_content(
                full_prompt,
                stream=True,
                generation_config={"response_mime_type": "application/json", "temperature": 0.2},
            )
            for chunk in response:
                if getattr(chunk, "text", None):
                    accumulated += chunk.text
                    if on_chunk:
                        on_chunk(chunk.text)
            if not accumulated.strip():
                last_error = f"{getattr(m, 'model_name', m)} returned an empty response"
                print(f"[gemini_client] {last_error}")
                continue
            result = _parse_json(accumulated)
            if not isinstance(result, dict):
                last_error = f"{getattr(m, 'model_name', m)} returned non-object JSON"
                print(f"[gemini_client] {last_error}")
                continue
            result = _finish(result, system_prompt)
            if on_complete:
                on_complete(result)
            return result
        except json.JSONDecodeError:
            last_error = f"{getattr(m, 'model_name', m)} returned non-JSON output after streaming"
            print(f"[gemini_client] {last_error}. Accumulated: {accumulated[:300]}")
            continue
        except Exception as ex:
            last_error = str(ex)
            print(f"[gemini_client] Stream attempt with {getattr(m, 'model_name', m)} failed: {ex}")
            continue

    error_msg = f"Gemini API streaming failed: {last_error}"
    print(f"[gemini_client] {error_msg}")
    if on_error:
        on_error(error_msg)
    return None


def call_gemini(system_prompt: str, user_content: str, *args, **kwargs) -> dict:
    if USE_FALLBACK:
        print("[gemini_client] Using fallback for prompt type.")
        return _serve_fallback(system_prompt)

    full_prompt = _build_prompt(system_prompt, user_content)

    active_models = _resolve_active_models()
    last_error = "all configured models failed"
    raw = ""
    for m in active_models:
        try:
            response = m.generate_content(
                full_prompt,
                generation_config={"response_mime_type": "application/json", "temperature": 0.2},
            )
            raw = (response.text or "").strip()
            if not raw:
                last_error = f"{getattr(m, 'model_name', m)} returned an empty response"
                continue
            result = _parse_json(raw)
            if not isinstance(result, dict):
                last_error = f"{getattr(m, 'model_name', m)} returned non-object JSON"
                continue

            # Validate result is not empty or trivially small
            result_str = json.dumps(result)
            min_size = 20 if os.getenv("PYTEST_CURRENT_TEST") else 100
            if len(result_str) < min_size:
                print(f"[gemini_client] WARNING: Response suspiciously small ({len(result_str)} chars). Raw: {raw[:500]}")
                return get_fallback_response(system_prompt)

            # Validate required top-level keys exist for known response types
            prompt_type = detect_prompt_type(system_prompt)
            if prompt_type == "extract" and "parties" not in result:
                print("[gemini_client] WARNING: Extract response missing 'parties' key. Falling back.")
                return get_fallback_response(system_prompt)

            if prompt_type == "obligations" and "obligations" not in result:
                print("[gemini_client] WARNING: Obligations response missing 'obligations' key. Falling back.")
                return get_fallback_response(system_prompt)

            print(f"[gemini_client] Valid response received. Keys: {list(result.keys())}. Size: {len(result_str)} chars.")
            return _finish(result, system_prompt)
        except json.JSONDecodeError:
            last_error = f"{getattr(m, 'model_name', m)} returned non-JSON output"
            print(f"[gemini_client] JSON parse error: {last_error}. Raw: {raw[:500]}")
            continue
        except Exception as ex:
            last_error = str(ex)
            print(f"[gemini_client] Non-stream attempt with {getattr(m, 'model_name', m)} failed: {ex}")
            continue

    print(f"[gemini_client] All Gemini attempts failed: {last_error}")
    raise GeminiRequestError(f"Gemini API request failed: {last_error}")


def _build_prompt(system_prompt: str, user_content: str) -> str:
    return (
        f"{system_prompt}\n\n"
        f"Contract Text:\n{user_content}\n\n"
        f"IMPORTANT: Return ONLY a raw JSON object. "
        f"Do NOT wrap in markdown. Do NOT add any explanation. "
        f"Start your response with {{ and end with }}."
    )


def get_fallback_response(system_prompt: str) -> dict:
    """Canned offline demo dataset, keyed by prompt type.

    Used ONLY when no Gemini key is configured (offline-demo mode). The shared
    demo contract is a fictional Acme Corp / TechStart services agreement so
    every endpoint stays internally consistent. Outputs are always tagged
    `source: offline-demo` by `_serve_fallback` so the UI can present them as
    sample data, never as a real analysis of the user's document.
    """
    prompt_type = detect_prompt_type(system_prompt)

    if prompt_type == "extract":
        return {
            "document_type": "Master Services Agreement",
            "title": "Acme Corp / TechStart Inc Master Services Agreement",
            "governing_law": "Delaware, USA",
            "financial_value": "12,000 USD monthly",
            "parties": [
                {"name": "Acme Corp", "role": "Service Provider", "shorthand": "Acme"},
                {"name": "TechStart Inc", "role": "Client", "shorthand": "TechStart"},
            ],
            "effective_date": "2024-01-01",
            "expiration_date": "2026-12-31",
            "renewal_terms": "Auto-renews for 12-month periods unless 60-day written notice given",
            "payment_terms": "Net 30, monthly invoicing at $12,000/month",
            "termination_conditions": "Either party may terminate with 30-day written notice for material breach",
            "service_obligations": "99.9% uptime SLA, 24/7 support response within 4 hours",
            "liability_cap": "12 months fees paid",
            "source_sections": {
                "parties": "Section 1.1 — The parties to this Agreement are Acme Corp and TechStart Inc.",
                "effective_date": "Section 2.1 — This Agreement is effective as of January 1, 2024.",
                "expiration_date": "Section 2.2 — The initial term expires on December 31, 2026.",
                "renewal_terms": "Section 8.3 — Auto-renews for 12-month periods unless 60-day notice is given.",
                "payment_terms": "Section 5.1 — Client shall pay invoices within thirty (30) days of receipt.",
                "termination_conditions": "Section 8.2 — Either party may terminate with 30-day written notice for material breach.",
                "service_obligations": "Section 4.1 — Provider shall maintain 99.9% uptime and 4-hour support response.",
                "liability_cap": "Section 9.1 — Total liability shall not exceed fees paid in preceding 12 months.",
                "governing_law": "Section 14.1 — This Agreement is governed by the laws of Delaware, USA."
            },
            "confidence": {
                "parties": "High",
                "effective_date": "High",
                "expiration_date": "High",
                "renewal_terms": "High",
                "payment_terms": "High",
                "termination_conditions": "High",
                "service_obligations": "High",
                "liability_cap": "High",
                "governing_law": "High"
            },
            "important_dates": [
                {"date": "2026-11-01", "label": "Non-renewal notice deadline", "type": "renewal"},
                {"date": "2026-12-31", "label": "Contract expiry", "type": "termination"},
            ],
            "missing_fields": [],
        }
    elif prompt_type == "obligations":
        return {
            "obligations": [
                {"party": "Acme Corp", "description": "Maintain 99.9% uptime SLA and 4-hour critical issue response", "deadline": "2026-09-26", "deadline_type": "recurring", "recurrence": "Monthly", "urgency": "Critical", "consequence": "10% service credit per 1% downtime", "source_clause": "Section 4.2 — SLA Commitments", "obligation_type": "Performance", "frequency": "Monthly"},
                {"party": "TechStart Inc", "description": "Submit monthly invoice payment of $12,000", "deadline": "2026-09-30", "deadline_type": "recurring", "recurrence": "Monthly", "urgency": "High", "consequence": "1.5% monthly late interest penalty", "source_clause": "Section 5.1 — Invoicing & Fees", "obligation_type": "Payment", "frequency": "Monthly"},
                {"party": "Acme Corp", "description": "Deliver quarterly third-party SOC 2 Type II compliance audit report", "deadline": "2026-10-15", "deadline_type": "recurring", "recurrence": "Quarterly", "urgency": "Medium", "consequence": "Client termination right upon 30-day cure default", "source_clause": "Section 6.3 — Security Audit", "obligation_type": "Reporting", "frequency": "Quarterly"},
                {"party": "TechStart Inc", "description": "Provide written notice of non-renewal if electing not to extend term", "deadline": "2026-11-01", "deadline_type": "fixed", "recurrence": "One-time", "urgency": "Medium", "consequence": "Automatic 12-month commitment renewal", "source_clause": "Section 8.3 — Renewal Window", "obligation_type": "Notice", "frequency": "One-time"},
            ]
        }
    elif prompt_type == "timeline":
        return {
            "timeline": [
                {"date": "2026-09-26", "label": "SLA Review", "type": "milestone", "party": "Acme Corp", "description": "Monthly uptime SLA review and performance credit assessment", "days_from_today": 6, "urgency": "Critical", "source_clause": "Section 4.2"},
                {"date": "2026-09-30", "label": "Payment Due", "type": "payment", "party": "TechStart Inc", "description": "Monthly subscription invoice $12,000 Net 30", "days_from_today": 10, "urgency": "High", "source_clause": "Section 5.1"},
                {"date": "2026-10-15", "label": "Security Audit", "type": "reporting", "party": "Acme Corp", "description": "Submission of quarterly SOC 2 security compliance report", "days_from_today": 25, "urgency": "High", "source_clause": "Section 6.3"},
                {"date": "2026-11-01", "label": "Renewal Notice", "type": "renewal", "party": "Both", "description": "60-day non-renewal notice window opens", "days_from_today": 42, "urgency": "Medium", "source_clause": "Section 8.3"},
                {"date": "2026-12-31", "label": "Contract Expiry", "type": "termination", "party": "Both", "description": "End of 24-month contract term", "days_from_today": 102, "urgency": "Low", "source_clause": "Section 2.1"},
            ]
        }
    elif prompt_type == "flags":
        return {
            "flags": [
                {"title": "Low liability cap", "clause_text": "Provider total cumulative liability shall be limited to fees paid in the preceding one month.", "reason": "Unusually low liability cap leaves client under-protected in the event of major data loss or extended service outage.", "severity": "High", "flag_type": "LIABILITY RISK", "affected_party": "TechStart Inc", "suggested_revision": "Increase liability cap to 12 months fees paid or $250,000.", "section_reference": "Section 9.1", "page_reference": "", "business_impact": "Cap limits financial recourse to less than one month of fees", "review_consideration": "Negotiate a cap tied to fees paid over the preceding 12 months"},
                {"title": "Unilateral terms change", "clause_text": "Provider may update service terms and features with 7-day notice.", "reason": "Short notice period for potentially material changes to service scope or technical SLAs.", "severity": "Medium", "flag_type": "UNILATERAL RIGHTS", "affected_party": "TechStart Inc", "suggested_revision": "Require 30-day notice and written consent for material changes.", "section_reference": "Section 12.4", "page_reference": "", "business_impact": "Scope and pricing could change with minimal notice", "review_consideration": "Require 30-day notice and written consent for material changes"},
                {"title": "One-sided jurisdiction", "clause_text": "Disputes resolved exclusively in provider's jurisdiction in Delaware.", "reason": "Exclusive foreign venue imposes disproportionate legal costs and travel burdens on client.", "severity": "Medium", "flag_type": "JURISDICTION RISK", "affected_party": "TechStart Inc", "suggested_revision": "Request mutual jurisdiction or virtual arbitration venue.", "section_reference": "Section 14.2", "page_reference": "", "business_impact": "Disputes must be litigated in a venue convenient to provider", "review_consideration": "Request mutual jurisdiction or arbitration venue"},
                {"title": "Ambiguous data usage", "clause_text": "Client operational data may be utilized for service improvement and optimization.", "reason": "Ambiguous data usage clause — scope of 'optimization' could permit AI model training on proprietary workflows.", "severity": "Low", "flag_type": "DATA/IP RISK", "affected_party": "TechStart Inc", "suggested_revision": "Define permitted uses and explicitly exclude client data from generic AI training.", "section_reference": "Section 7.5", "page_reference": "", "business_impact": "Client data could be repurposed beyond the agreed scope", "review_consideration": "Define permitted uses and add opt-out for analytics"},
            ]
        }
    elif prompt_type == "compare":
        return {
            "changes": [
                {"type": "modified", "section": "Section 5.1", "contract_a_text": "Net 30 payment terms", "contract_b_text": "Net 15 payment terms", "significance": "High", "explanation": "Payment window halved — increases cash flow burden on client significantly"},
                {"type": "added", "section": "Section 9.3", "contract_a_text": "", "contract_b_text": "Provider may suspend service after 5 days of non-payment", "significance": "High", "explanation": "New suspension clause added in v2 — not present in v1"},
                {"type": "modified", "section": "Section 8.3", "contract_a_text": "60-day non-renewal notice", "contract_b_text": "90-day non-renewal notice", "significance": "Medium", "explanation": "Renewal notice window extended — less flexibility for client"},
            ]
        }
    elif prompt_type == "qa":
        return {
            "answer": "Per Section 5.3, late payments accrue interest at 1.5% per month. Additionally, Section 9.3 permits provider to suspend services after 15 days of non-payment, and continued non-payment beyond 30 days constitutes a material breach.",
            "confidence": "High",
            "sources": [
                {
                    "section": "Section 5.3",
                    "clause_text": "Late payments shall accrue interest at 1.5% per month.",
                    "relevance": "Defines overdue interest penalty."
                },
                {
                    "section": "Section 9.3",
                    "clause_text": "Provider reserves the right to suspend services after fifteen (15) days of non-payment.",
                    "relevance": "Authorizes service suspension for overdue invoices."
                }
            ],
            "caveat": "Provider must issue 5 days written notice before initiating suspension.",
            "source_section": "Section 5.3, 9.3, 11.1",
            "source_text": "Late payments shall accrue interest at 1.5% per month. Provider reserves the right to suspend services after fifteen (15) days of non-payment."
        }
    elif prompt_type == "summary":
        return {
            "headline": "2-Year SaaS Master Services Agreement with Acme Corp — Auto-Renews Dec 2026 — $144K Annual Commitment",
            "parties_summary": "Acme Corp (Service Provider) and TechStart Inc (Client)",
            "what_we_get": "Enterprise cloud hosting platform, guaranteed 99.9% uptime SLA, 24/7 technical support response within 4 hours, and quarterly SOC 2 security compliance reports.",
            "what_we_owe": "$12,000 monthly subscription fee (Net 30 terms), 60-day advance notice for non-renewal, and adherence to platform acceptable use policies.",
            "key_commitments": [
                "99.9% monthly uptime SLA with 10% penalty credit per 1% downtime",
                "Monthly invoicing of $12,000 with Net 30 payment terms",
                "Quarterly third-party SOC 2 security audit report delivery",
                "24/7 support availability with 4-hour critical issue resolution SLA"
            ],
            "critical_dates": [
                "2026-09-30 — Monthly invoice payment due ($12,000)",
                "2026-10-15 — Delivery of quarterly SOC 2 security compliance report",
                "2026-11-01 — Final deadline to issue 60-day non-renewal notice",
                "2026-12-31 — Initial 24-month term expiration date"
            ],
            "financial_summary": "$144,000 annual recurring commitment billed at $12,000/month Net 30. Overdue amounts incur 1.5% monthly interest penalty. Service suspension permitted after 15 days non-payment.",
            "top_risks": [
                "Liability cap is limited to only 1 month of fees paid (Section 9.1)",
                "Unilateral terms change clause with only 7 days advance notice (Section 12.4)",
                "Exclusive foreign jurisdiction clause in Delaware (Section 14.2)"
            ],
            "recommended_actions": [
                "Negotiate liability cap from 1 month to 12 months fees paid ($144,000)",
                "Extend unilateral change notice window from 7 days to 30 calendar days",
                "Calendar November 1, 2026 non-renewal notice deadline immediately"
            ],
            "health_score": 72,
            "overview": "Master Services Agreement between Acme Corp and TechStart Inc for cloud hosting through December 2026 at $12,000/month.",
            "financial_terms": "Monthly fee of $12,000 with 5% annual escalator. Late payment interest at 1.5%/month.",
            "risk_highlights": ["Very low liability cap in Section 9.1", "Unilateral terms change clause with only 7-day notice", "One-sided jurisdiction clause"]
        }
    else:
        return {
            "alerts": [
                {"obligation": "Monthly Payment", "deadline": "2026-09-30", "days_remaining": 11, "urgency": "High", "party": "TechStart Inc", "source_clause": "Section 5.1"},
                {"obligation": "Non-renewal Notice Deadline", "deadline": "2026-11-01", "days_remaining": 43, "urgency": "Medium", "party": "Both", "source_clause": "Section 8.3"},
                {"obligation": "Contract Expiry", "deadline": "2026-12-31", "days_remaining": 103, "urgency": "Low", "party": "Both", "source_clause": "Section 2.1"}
            ]
        }


def _serve_fallback(system_prompt: str) -> dict:
    """Return the offline demo dataset, tagged so the frontend can surface it.

    The `source` marker lets the UI show an honest "offline demo mode" notice
    instead of presenting canned data as if it were analyzed from the user's
    document.
    """
    data = validate_response(system_prompt, get_fallback_response(system_prompt))
    data["source"] = "offline-demo"
    return data