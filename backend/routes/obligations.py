from datetime import date
import re
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from services.gemini_client import call_gemini, GeminiRequestError
from services.supabase_client import data_client
from services.security import get_current_user
from services.ownership import owns_contract

router = APIRouter()

class ObligationsRequest(BaseModel):
    text: str
    ref_date: Optional[str] = None
    contract_id: Optional[str] = None

SYSTEM_PROMPT = """
You are a legal obligations analyst specializing in contract compliance and deadline tracking.

Your task: Identify and extract EVERY obligation, commitment, and duty that each party
must fulfill under this contract. Be exhaustive — miss nothing.

An obligation is any action, deliverable, payment, report, notice, or restriction that
a party is REQUIRED to do or refrain from doing. Look for words like:
"shall", "must", "will", "agrees to", "is required to", "is obligated to",
"is responsible for", "covenants to", "undertakes to", "warrants that".

For EACH obligation found, extract:
- party: The exact party name who bears this obligation
- description: Clear, specific description of what they must do (not vague — be specific)
- deadline: The specific date or deadline. If relative ("within 30 days of invoice"),
  calculate from today's date (use {today}) and provide the actual date
- deadline_type: "fixed" (specific date) | "relative" (calculated from an event) |
  "recurring" (repeats on schedule) | "conditional" (triggered by an event)
- recurrence: If recurring, state frequency (monthly/quarterly/annually/etc.)
- urgency: Assign based on these STRICT rules:
    "Critical" = deadline within 7 days OR non-compliance causes immediate contract termination
    "High"     = deadline within 30 days OR non-compliance causes financial penalty
    "Medium"   = deadline within 90 days OR standard contractual delivery obligation
    "Low"      = informational, best-effort, or deadline beyond 90 days
- consequence: What happens if this obligation is NOT met (penalty, termination, interest, etc.)
- source_clause: The exact section number AND full clause text this obligation comes from

Return ONLY a raw JSON object:
{
  "obligations": [
    {
      "party": "",
      "description": "",
      "deadline": "YYYY-MM-DD",
      "deadline_type": "fixed|relative|recurring|conditional",
      "recurrence": "",
      "urgency": "Critical|High|Medium|Low",
      "consequence": "",
      "source_clause": ""
    }
  ]
}

STRICT RULES:
- Return ONLY the JSON. No markdown. No explanation. Start with { end with }
- Find ALL obligations — a typical enterprise contract has 10-25 obligations minimum
- Never group multiple obligations into one — each obligation gets its own object
- If no deadline is stated, set deadline to null but still include the obligation
- Today's date for relative deadline calculation: {today}
"""

def sanitize_date(d):
    if not d:
        return None
    m = re.search(r"\d{4}-\d{2}-\d{2}", str(d))
    return m.group(0) if m else None

@router.post("/obligations")
async def get_obligations(req: ObligationsRequest, current_user: dict = Depends(get_current_user)):
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Contract text is required")

    today = req.ref_date or date.today().isoformat()
    prompt = SYSTEM_PROMPT.replace("{today}", today)

    try:
        result = call_gemini(prompt, req.text)
    except GeminiRequestError as e:
        raise HTTPException(status_code=502, detail=str(e))
    obligations_list = result.get("obligations", [])

    client = data_client(current_user)
    if client and req.contract_id and owns_contract(current_user, req.contract_id):
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
                    "obligation_type": str(ob.get("obligation_type", "") or ""),
                    "frequency": str(ob.get("frequency", "") or ""),
                    "is_dismissed": False
                })
            if records:
                # Replace any previous obligations for this contract so
                # re-analysis never mixes stale results with fresh ones.
                client.table("obligations").delete().eq("contract_id", req.contract_id).execute()
            client.table("obligations").insert(records).execute()
        except Exception as e:
            print(f"[obligations.py] Supabase save error: {e}")

    return result