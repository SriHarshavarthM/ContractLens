from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from services.gemini_client import call_gemini
from services.security import get_current_user

router = APIRouter()

class SummaryRequest(BaseModel):
    text: str
    ref_date: Optional[str] = None

SYSTEM_PROMPT = (
    "You are a business contract summarizer. Generate a concise executive summary for a senior business stakeholder. "
    "Return ONLY raw JSON: { headline, parties_summary, key_commitments: [string], critical_dates: [string], "
    "financial_terms, risk_highlights: [string], recommended_actions: [string] }. "
    "Return ONLY a raw JSON object. No markdown. No explanation. No code fences."
)

@router.post("/summary")
async def get_summary(req: SummaryRequest, current_user: dict = Depends(get_current_user)):
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Contract text is required")
    
    result = call_gemini(SYSTEM_PROMPT, req.text, ref_date_str=req.ref_date)
    return result
