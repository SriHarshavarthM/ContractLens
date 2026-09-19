import re
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from services.gemini_client import call_gemini
from services.supabase_client import supabase
from services.security import get_current_user
from services.ownership import owns_contract

router = APIRouter()

class ObligationsRequest(BaseModel):
    text: str
    ref_date: Optional[str] = None
    contract_id: Optional[str] = None

SYSTEM_PROMPT = (
    "You are a contract obligations analyst. Identify every obligation for every party. "
    "Return ONLY raw JSON: { obligations: [{party, description, deadline, urgency: 'Critical|High|Medium|Low', source_clause}] }. "
    "Urgency rules — Critical: <7 days or non-negotiable legal consequence. High: <30 days or financial penalty. "
    "Medium: standard delivery. Low: informational. "
    "Return ONLY a raw JSON object. No markdown. No explanation. No code fences."
)

def sanitize_date(d):
    if not d:
        return None
    m = re.search(r"\d{4}-\d{2}-\d{2}", str(d))
    return m.group(0) if m else None

@router.post("/obligations")
async def get_obligations(req: ObligationsRequest, current_user: dict = Depends(get_current_user)):
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Contract text is required")
    
    result = call_gemini(SYSTEM_PROMPT, req.text)
    obligations_list = result.get("obligations", [])

    if supabase and req.contract_id and owns_contract(current_user, req.contract_id):
        try:
            records = []
            for ob in obligations_list:
                urgency = ob.get("urgency", "Medium")
                if urgency not in ["Critical", "High", "Medium", "Low"]:
                    urgency = "Medium"
                records.append({
                    "contract_id": req.contract_id,
                    "party": str(ob.get("party", "")),
                    "description": str(ob.get("description", "")),
                    "deadline": sanitize_date(ob.get("deadline")),
                    "urgency": urgency,
                    "source_clause": str(ob.get("source_clause", "")),
                    "is_dismissed": False
                })
            supabase.table("obligations").insert(records).execute()
        except Exception as e:
            print(f"[obligations.py] Supabase save error: {e}")

    return result
