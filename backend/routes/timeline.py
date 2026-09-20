from datetime import date
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

SYSTEM_PROMPT = """
You are a contract deadline and timeline specialist.

Your task: Extract EVERY date, deadline, and time-sensitive event from this contract
and arrange them in a complete chronological timeline.

Look for ALL of these:
- Contract start and end dates
- Payment due dates and billing cycles
- Renewal notice deadlines
- Termination notice periods
- Delivery milestones and go-live dates
- Audit and reporting deadlines
- SLA review periods
- Notice periods for any contractual action
- Penalty trigger dates
- Any date mentioned anywhere in the contract

For each timeline event:
- date: ISO format YYYY-MM-DD. If relative to today ({today}), calculate the actual date
- label: Short 3-5 word label (e.g. "Payment Due", "Renewal Notice Deadline")
- type: "payment" | "renewal" | "termination" | "deadline" | "milestone" | "reporting" | "other"
- party: Who is responsible — use exact party name from contract or "Both" if mutual
- description: Full explanation of what happens on this date and why it matters
- days_from_today: Integer — how many days from today ({today}) until this event
  (negative if already passed)
- urgency: "Critical" (<7 days) | "High" (7-30 days) | "Medium" (30-90 days) | "Low" (>90 days)
- source_clause: Section number and exact clause text

Return ONLY a raw JSON object, events sorted by date ascending:
{
  "timeline": [
    {
      "date": "YYYY-MM-DD",
      "label": "",
      "type": "payment|renewal|termination|deadline|milestone|reporting|other",
      "party": "",
      "description": "",
      "days_from_today": 0,
      "urgency": "Critical|High|Medium|Low",
      "source_clause": ""
    }
  ]
}

STRICT RULES:
- Return ONLY the JSON. No markdown. No explanation. Start with { end with }
- Include EVERY date found — a thorough timeline has 8-15 events minimum
- Today's date: {today}
- Sort all events by date ascending (earliest first)
"""

@router.post("/timeline")
async def get_timeline(req: TimelineRequest, current_user: dict = Depends(get_current_user)):
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Contract text is required")

    today = req.ref_date or date.today().isoformat()
    prompt = SYSTEM_PROMPT.replace("{today}", today)

    try:
        result = call_gemini(prompt, req.text, ref_date_str=today)
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