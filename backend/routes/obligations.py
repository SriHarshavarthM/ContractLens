from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from services.gemini_client import call_gemini

router = APIRouter()

class ObligationsRequest(BaseModel):
    text: str
    ref_date: Optional[str] = None

SYSTEM_PROMPT = (
    "You are a contract obligations analyst. Identify every obligation for every party. "
    "Return ONLY raw JSON: { obligations: [{party, description, deadline, urgency: 'Critical|High|Medium|Low', source_clause}] }. "
    "Urgency rules — Critical: <7 days or non-negotiable legal consequence. High: <30 days or financial penalty. "
    "Medium: standard delivery. Low: informational. "
    "Return ONLY a raw JSON object. No markdown. No explanation. No code fences."
)

@router.post("/obligations")
async def get_obligations(req: ObligationsRequest):
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Contract text is required")
    
    result = call_gemini(SYSTEM_PROMPT, req.text, ref_date_str=req.ref_date)
    return result
