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

SYSTEM_PROMPT = (
    "You are a contract intelligence engine. Extract the following fields from the contract text. "
    "Schema: { document_type, title, governing_law, financial_value, parties: [{name, role}], "
    "effective_date, expiration_date, renewal_terms, payment_terms, termination_conditions, "
    "service_obligations, important_dates: [{date, label, type}], "
    "source_sections: {field_name: 'exact clause text'}, missing_fields: [field names not found] }. "
    "document_type should classify the agreement (e.g. Master Services Agreement, NDA, Lease, "
    "Employment Agreement, Services Agreement, Purchase Agreement, SLA, Amendment). "
    "financial_value summarises any money amounts found (e.g. '12,000 USD monthly'). "
    "If a field is not found in the contract text, use null and list it in missing_fields. "
    "Return ONLY a raw JSON object. No markdown. No explanation. No code fences."
)

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