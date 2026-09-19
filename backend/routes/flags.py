from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from services.gemini_client import call_gemini

router = APIRouter()

class FlagsRequest(BaseModel):
    text: str
    ref_date: Optional[str] = None

SYSTEM_PROMPT = (
    "You are a contract risk analyst. Identify clauses that are unusual, ambiguous, one-sided, potentially risky, or require attorney review. "
    "Return ONLY raw JSON: { flags: [{clause_text, reason, severity: 'High|Medium|Low', section_reference}] }. "
    "Return ONLY a raw JSON object. No markdown. No explanation. No code fences."
)

@router.post("/flags")
async def get_flags(req: FlagsRequest):
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Contract text is required")
    
    result = call_gemini(SYSTEM_PROMPT, req.text, ref_date_str=req.ref_date)
    return result
