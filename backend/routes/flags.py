from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from services.gemini_client import call_gemini
from services.supabase_client import data_client
from services.security import get_current_user
from services.ownership import owns_contract

router = APIRouter()

class FlagsRequest(BaseModel):
    text: str
    ref_date: Optional[str] = None
    contract_id: Optional[str] = None

SYSTEM_PROMPT = (
    "You are a contract risk analyst. Identify clauses that are unusual, ambiguous, one-sided, potentially risky, or require attorney review. "
    "Return ONLY raw JSON: { flags: [{clause_text, reason, severity: 'High|Medium|Low', section_reference}] }. "
    "Return ONLY a raw JSON object. No markdown. No explanation. No code fences."
)

@router.post("/flags")
async def get_flags(req: FlagsRequest, current_user: dict = Depends(get_current_user)):
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Contract text is required")
    
    result = call_gemini(SYSTEM_PROMPT, req.text)
    flags_list = result.get("flags", [])

    client = data_client(current_user)
    if client and req.contract_id and owns_contract(current_user, req.contract_id):
        try:
            records = []
            for fl in flags_list:
                sev = fl.get("severity", "Medium")
                if sev not in ["High", "Medium", "Low"]:
                    sev = "Medium"
                records.append({
                    "contract_id": req.contract_id,
                    "clause_text": str(fl.get("clause_text", "")),
                    "reason": str(fl.get("reason", "")),
                    "severity": sev,
                    "section_reference": str(fl.get("section_reference", "")),
                    "is_reviewed": False
                })
            client.table("flags").insert(records).execute()
        except Exception as e:
            print(f"[flags.py] Supabase save error: {e}")

    return result
