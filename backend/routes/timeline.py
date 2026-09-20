from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from services.gemini_client import call_gemini, GeminiRequestError
from services.security import get_current_user
from services.supabase_client import data_client
from services.ownership import owns_contract

router = APIRouter()

class TimelineRequest(BaseModel):
    text: str
    ref_date: Optional[str] = None
    contract_id: Optional[str] = None

SYSTEM_PROMPT = (
    "Extract all dates and deadlines from this contract as a chronological timeline. "
    "Return ONLY raw JSON: { timeline: [{date, label, type: 'deadline|renewal|payment|termination|other', "
    "party, description, source_clause, page_reference: page number or ''}] } "
    "sorted by date ascending. Return ONLY a raw JSON object. No markdown. No explanation. No code fences."
)

@router.post("/timeline")
async def get_timeline(req: TimelineRequest, current_user: dict = Depends(get_current_user)):
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Contract text is required")

    try:
        result = call_gemini(SYSTEM_PROMPT, req.text, ref_date_str=req.ref_date)
    except GeminiRequestError as e:
        raise HTTPException(status_code=502, detail=str(e))

    # Persist the computed timeline against the owned contract row so it
    # restores after sign-out / reload. Best-effort: analysis still returns.
    client = data_client(current_user)
    if client and req.contract_id and owns_contract(current_user, req.contract_id):
        try:
            client.table("contracts").update({"timeline": result.get("timeline", [])}).eq(
                "id", req.contract_id
            ).eq("user_id", current_user["sub"]).execute()
        except Exception as e:
            print(f"[timeline.py] Supabase save error: {e}")

    return result