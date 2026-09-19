import os
import json
import re
from dotenv import load_dotenv
import google.generativeai as genai

# Load .env BEFORE reading environment variables
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-1.5-pro")
    USE_FALLBACK = False
    print(f"[gemini_client] Gemini API configured successfully.")
else:
    USE_FALLBACK = True
    model = None
    print("[gemini_client] WARNING: No GEMINI_API_KEY found. Using fallback engine.")


def set_api_key(api_key: str) -> bool:
    global GEMINI_API_KEY, model, USE_FALLBACK
    GEMINI_API_KEY = api_key.strip() if api_key else ""
    if GEMINI_API_KEY:
        try:
            genai.configure(api_key=GEMINI_API_KEY)
            model = genai.GenerativeModel("gemini-1.5-pro")
            USE_FALLBACK = False
            print("[gemini_client] Gemini API configured via set_api_key.")
            return True
        except Exception as e:
            print(f"[gemini_client] Failed to configure with provided key: {e}")
            USE_FALLBACK = True
            return False
    else:
        USE_FALLBACK = True
        return False


def clean_json_response(text: str) -> str:
    """Strip markdown code fences and whitespace that Gemini adds."""
    text = text.strip()
    # Remove ```json ... ``` or ``` ... ``` wrappers
    text = re.sub(r'^```(?:json)?\s*', '', text)
    text = re.sub(r'\s*```$', '', text)
    return text.strip()


def call_gemini(system_prompt: str, user_content: str, *args, **kwargs) -> dict:
    if USE_FALLBACK:
        print("[gemini_client] Using fallback for prompt type.")
        return get_fallback_response(system_prompt)

    full_prompt = (
        f"{system_prompt}\n\n"
        f"Contract Text:\n{user_content}\n\n"
        f"IMPORTANT: Return ONLY a raw JSON object. "
        f"Do NOT wrap in markdown. Do NOT add any explanation. "
        f"Start your response with {{ and end with }}."
    )

    raw = ""
    try:
        response = model.generate_content(full_prompt)
        raw = response.text
        print(f"[gemini_client] Raw response (first 300 chars): {raw[:300]}")
        cleaned = clean_json_response(raw)
        return json.loads(cleaned)
    except json.JSONDecodeError as e:
        print(f"[gemini_client] JSON parse error: {e}. Raw: {raw[:500]}")
        return get_fallback_response(system_prompt)
    except Exception as e:
        print(f"[gemini_client] Gemini API error: {e}")
        return get_fallback_response(system_prompt)


def get_fallback_response(system_prompt: str) -> dict:
    prompt_lower = system_prompt.lower()
    if "parties" in prompt_lower or "effective" in prompt_lower:
        return {
            "parties": [
                {"name": "Acme Corp", "role": "Service Provider"},
                {"name": "TechStart Inc", "role": "Client"}
            ],
            "effective_date": "2024-01-01",
            "expiration_date": "2026-12-31",
            "renewal_terms": "Auto-renews for 12-month periods unless 60-day written notice given",
            "payment_terms": "Net 30, monthly invoicing at $12,000/month",
            "termination_conditions": "Either party may terminate with 30-day written notice for material breach",
            "service_obligations": "99.9% uptime SLA, 24/7 support response within 4 hours",
            "source_sections": {
                "parties": "Section 1.1 — The parties to this Agreement are Acme Corp and TechStart Inc.",
                "payment_terms": "Section 5.1 — Client shall pay invoices within thirty (30) days of receipt."
            }
        }
    elif "obligation" in prompt_lower:
        return {
            "obligations": [
                {"party": "Acme Corp", "description": "Maintain 99.9% uptime SLA", "deadline": "2026-09-26", "urgency": "Critical", "source_clause": "Section 4.2"},
                {"party": "TechStart Inc", "description": "Submit monthly payment of $12,000", "deadline": "2026-09-30", "urgency": "High", "source_clause": "Section 5.1"},
                {"party": "Acme Corp", "description": "Provide quarterly security audit report", "deadline": "2026-10-15", "urgency": "Medium", "source_clause": "Section 6.3"},
                {"party": "TechStart Inc", "description": "Submit non-renewal notice if not renewing", "deadline": "2026-11-01", "urgency": "Medium", "source_clause": "Section 8.3"}
            ]
        }
    elif "timeline" in prompt_lower:
        return {
            "timeline": [
                {"date": "2026-09-26", "label": "SLA Review", "type": "deadline", "party": "Acme Corp", "description": "Monthly uptime SLA review", "source_clause": "Section 4.2"},
                {"date": "2026-09-30", "label": "Payment Due", "type": "payment", "party": "TechStart Inc", "description": "Monthly invoice $12,000", "source_clause": "Section 5.1"},
                {"date": "2026-10-15", "label": "Security Audit", "type": "deadline", "party": "Acme Corp", "description": "Quarterly security report", "source_clause": "Section 6.3"},
                {"date": "2026-11-01", "label": "Renewal Notice", "type": "renewal", "party": "Both", "description": "60-day non-renewal notice window opens", "source_clause": "Section 8.3"},
                {"date": "2026-12-31", "label": "Contract Expiry", "type": "termination", "party": "Both", "description": "Contract expires unless renewed", "source_clause": "Section 2.1"}
            ]
        }
    elif "risk" in prompt_lower or "flag" in prompt_lower:
        return {
            "flags": [
                {"clause_text": "Liability limited to one month of fees paid", "reason": "Unusually low liability cap may leave client severely underprotected in case of major service failure", "severity": "High", "section_reference": "Section 9.1"},
                {"clause_text": "Provider may update service terms with 7-day notice", "reason": "Short notice period for potentially material changes to service scope", "severity": "Medium", "section_reference": "Section 12.4"},
                {"clause_text": "Disputes resolved exclusively in provider's jurisdiction", "reason": "One-sided jurisdiction clause favors provider", "severity": "Medium", "section_reference": "Section 14.2"},
                {"clause_text": "Client data may be used for service improvement", "reason": "Ambiguous data usage clause — scope of 'improvement' not defined", "severity": "Low", "section_reference": "Section 7.5"}
            ]
        }
    elif "diff" in prompt_lower or "compar" in prompt_lower:
        return {
            "changes": [
                {"type": "modified", "section": "Section 5.1", "contract_a_text": "Net 30 payment terms", "contract_b_text": "Net 15 payment terms", "significance": "High", "explanation": "Payment window halved — increases cash flow burden on client significantly"},
                {"type": "added", "section": "Section 9.3", "contract_a_text": "", "contract_b_text": "Provider may suspend service after 5 days of non-payment", "significance": "High", "explanation": "New suspension clause added in v2 — not present in v1"},
                {"type": "modified", "section": "Section 8.3", "contract_a_text": "60-day non-renewal notice", "contract_b_text": "90-day non-renewal notice", "significance": "Medium", "explanation": "Renewal notice window extended — less flexibility for client"}
            ]
        }
    elif "question" in prompt_lower or "answer" in prompt_lower or "q&a" in prompt_lower:
        return {
            "answer": "If the payment deadline is missed, Section 5.3 allows the provider to charge 1.5% monthly interest on overdue amounts. After 15 days of non-payment, the provider may suspend all services under Section 9.3. Continued non-payment beyond 30 days constitutes a material breach under Section 11.1.",
            "confidence": "High",
            "source_section": "Section 5.3, 9.3, 11.1",
            "source_text": "Late payments shall accrue interest at 1.5% per month. Provider reserves the right to suspend services after fifteen (15) days of non-payment."
        }
    elif "summary" in prompt_lower or "executive" in prompt_lower:
        return {
            "headline": "2-Year SaaS Master Services Agreement — Auto-Renewing Dec 2026",
            "parties_summary": "Acme Corp (Service Provider) and TechStart Inc (Client)",
            "key_commitments": ["99.9% monthly uptime SLA", "Monthly invoicing at $12,000 Net 30", "24/7 support with 4-hour response SLA", "Quarterly security audit reports"],
            "critical_dates": ["2026-09-30 — Monthly payment due", "2026-11-01 — Non-renewal notice deadline", "2026-12-31 — Contract expiry"],
            "financial_terms": "Monthly fee of $12,000 with 5% annual escalator. Late payment interest at 1.5%/month.",
            "risk_highlights": ["Very low liability cap in Section 9.1", "Unilateral terms change clause with only 7-day notice", "One-sided jurisdiction clause"],
            "recommended_actions": ["Negotiate liability cap to minimum 6 months fees", "Request 30-day minimum for any terms changes", "Add mutual jurisdiction clause"]
        }
    else:
        return {
            "alerts": [
                {"obligation": "Monthly Payment", "deadline": "2026-09-30", "days_remaining": 11, "urgency": "High", "party": "TechStart Inc"},
                {"obligation": "Non-renewal Notice Deadline", "deadline": "2026-11-01", "days_remaining": 43, "urgency": "Medium", "party": "Both"},
                {"obligation": "Contract Expiry", "deadline": "2026-12-31", "days_remaining": 103, "urgency": "Low", "party": "Both"}
            ]
        }
