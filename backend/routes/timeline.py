from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from services.gemini_client import call_gemini
from services.security import get_current_user

router = APIRouter()

class TimelineRequest(BaseModel):
    text: str
    ref_date: Optional[str] = None

SYSTEM_PROMPT = (
    "Extract all dates and deadlines from this contract as a chronological timeline. "
    "Return ONLY raw JSON: { timeline: [{date, label, type: 'deadline|renewal|payment|termination|other', party, description, source_clause}] } "
    "sorted by date ascending. Return ONLY a raw JSON object. No markdown. No explanation. No code fences."
)

@router.post("/timeline")
async def get_timeline(req: TimelineRequest, current_user: dict = Depends(get_current_user)):
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Contract text is required")
    
    result = call_gemini(SYSTEM_PROMPT, req.text, ref_date_str=req.ref_date)
    return result
