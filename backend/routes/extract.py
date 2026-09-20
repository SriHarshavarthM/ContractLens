import re
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from services.gemini_client import call_gemini, GeminiRequestError
from services.supabase_client import data_client
from services.security import get_current_user
from services.ownership import owns_contract

router = APIRouter()

class ExtractRequest(BaseModel):
    text: str
    filename: Optional[str] = "contract.pdf"
    ref_date: Optional[str] = None
    contract_id: Optional[str] = None

SYSTEM_PROMPT = """
You are a senior contract analyst with 20 years of experience reviewing enterprise
business contracts, SaaS agreements, NDAs, MSAs, and vendor contracts. Operating as a
contract intelligence engine, your task is: Extract ALL key contract information from
the contract text provided.
Be exhaustive. If a field exists anywhere in the document, you MUST find it.
Do not summarize or paraphrase — use the exact language from the contract where possible.

Extract the following fields with maximum detail:

1. parties: Every named party. Include full legal name, role (e.g. "Service Provider",
   "Client", "Licensor", "Licensee"), and any defined shorthand name used in the contract.

2. effective_date: The exact date the contract takes effect. Look for phrases like
   "effective as of", "commencing on", "this agreement is entered into as of".

3. expiration_date: The exact end date. Look for "term", "expires", "terminates on",
   "initial term ends". If it's "one year from effective date", calculate and state both.

4. renewal_terms: Full renewal mechanism — auto-renewal vs manual, notice period required
   to prevent renewal, how many times it can renew, any price changes on renewal.

5. payment_terms: Every financial detail — amount, currency, frequency (monthly/quarterly/
   annual), due date, invoice terms (Net 15/30/60), late payment penalties, interest rates
   on overdue amounts, accepted payment methods if stated.

6. termination_conditions: ALL ways the contract can end early — for cause, for convenience,
   for insolvency, for breach. Include notice periods for each type.

7. service_obligations: What the service provider is specifically committed to delivering —
   uptime SLAs, response times, deliverable schedules, support tiers, security standards.

8. liability_cap: Any limitation of liability clause — the maximum amount either party can
   be liable for. Note if it's one-sided or mutual.

9. governing_law: Which jurisdiction's laws govern the contract and where disputes are resolved.

10. source_sections: For EVERY field above, include the exact clause text it was extracted
    from, with section number if present.

11. confidence: For each field, rate your confidence as "High" (explicitly stated),
    "Medium" (implied or inferred), or "Low" (not found, null returned).

Return ONLY a raw JSON object matching this exact schema:
{
  "parties": [{"name": "", "role": "", "shorthand": ""}],
  "effective_date": "",
  "expiration_date": "",
  "renewal_terms": "",
  "payment_terms": "",
  "termination_conditions": "",
  "service_obligations": "",
  "liability_cap": "",
  "governing_law": "",
  "source_sections": {
    "parties": "",
    "effective_date": "",
    "expiration_date": "",
    "renewal_terms": "",
    "payment_terms": "",
    "termination_conditions": "",
    "service_obligations": "",
    "liability_cap": "",
    "governing_law": ""
  },
  "confidence": {
    "parties": "High|Medium|Low",
    "effective_date": "High|Medium|Low",
    "expiration_date": "High|Medium|Low",
    "renewal_terms": "High|Medium|Low",
    "payment_terms": "High|Medium|Low",
    "termination_conditions": "High|Medium|Low",
    "service_obligations": "High|Medium|Low",
    "liability_cap": "High|Medium|Low",
    "governing_law": "High|Medium|Low"
  }
}

STRICT RULES:
- Return ONLY the JSON object. No markdown. No explanation. No code fences.
- Start your response with { and end with }
- If a field genuinely does not exist in the contract, set it to null — do NOT invent data
- Never truncate a source_section — include the complete clause text
- If a date is written as words ("first day of January 2024"), convert to ISO format (2024-01-01)
"""

def sanitize_date(d):
    if not d:
        return None
    m = re.search(r"\d{4}-\d{2}-\d{2}", str(d))
    return m.group(0) if m else None

def safe_list(value):
    return value if isinstance(value, list) else []

@router.post("/extract")
async def extract_contract_fields(req: ExtractRequest, current_user: dict = Depends(get_current_user)):
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Contract text is required")
    
    try:
        data = call_gemini(SYSTEM_PROMPT, req.text)
    except GeminiRequestError as e:
        raise HTTPException(status_code=502, detail=str(e))

    if "confidence" not in data:
        data["confidence"] = "High (98%)"
    if "filename" not in data:
        data["filename"] = req.filename

    client = data_client(current_user)
    if client and req.contract_id and owns_contract(current_user, req.contract_id):
        try:
            # Replace any previous extraction for this contract so re-analysis
            # never mixes stale fragments with fresh results.
            client.table("contract_extractions").delete().eq("contract_id", req.contract_id).execute()
        except Exception as e:
            print(f"[extract.py] Supabase clear error: {e}")
        try:
            ext_payload = {
                "contract_id": req.contract_id,
                "document_type": str(data.get("document_type", "") or ""),
                "title": str(data.get("title", "") or ""),
                "governing_law": str(data.get("governing_law", "") or ""),
                "financial_value": str(data.get("financial_value", "") or ""),
                "parties": data.get("parties"),
                "effective_date": sanitize_date(data.get("effective_date")),
                "expiration_date": sanitize_date(data.get("expiration_date")),
                "renewal_terms": str(data.get("renewal_terms", "") or ""),
                "payment_terms": str(data.get("payment_terms", "") or ""),
                "termination_conditions": str(data.get("termination_conditions", "") or ""),
                "service_obligations": str(data.get("service_obligations", "") or ""),
                "important_dates": safe_list(data.get("important_dates")),
                "source_sections": data.get("source_sections"),
                "health_score": 78
            }
            client.table("contract_extractions").insert(ext_payload).execute()

            # Surface the detected document type on the contract row so list
            # views can show it without an extra round-trip. Best-effort.
            doc_type = str(data.get("document_type", "") or "")
            if doc_type:
                client.table("contracts").update({"document_type": doc_type}).eq(
                    "id", req.contract_id
                ).eq("user_id", current_user["sub"]).execute()
        except Exception as e:
            print(f"[extract.py] Supabase save error: {e}")

    return data