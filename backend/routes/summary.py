from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from services.gemini_client import call_gemini, GeminiRequestError
from services.security import get_current_user
from services.supabase_client import data_client
from services.ownership import owns_contract

router = APIRouter()

class SummaryRequest(BaseModel):
    text: str
    ref_date: Optional[str] = None
    contract_id: Optional[str] = None

SYSTEM_PROMPT = """
You are a business contract summarizer writing for a CEO or CFO who has 2 minutes
to understand the most important aspects of this contract before a meeting.

Your summary must be:
- Written in plain English — no legal jargon
- Specific — include actual numbers, dates, party names (never say "the amount" — say "$12,000")
- Actionable — tell the reader what decisions or actions this contract requires of them
- Honest — highlight risks clearly, don't soften critical issues

Generate a comprehensive executive briefing with these exact sections:

1. headline: One sentence that captures the essence of this contract
   (e.g. "2-year SaaS hosting agreement with Acme Corp — auto-renews Dec 2025 — $144K/year commitment")

2. parties_summary: Who are the parties and what is each one's role in plain terms

3. what_we_get: What the signing party receives from this contract (services, products, rights)

4. what_we_owe: What the signing party must deliver or pay (obligations, payments, restrictions)

5. key_commitments: List of the 4-6 most important contractual commitments (specific, not vague)

6. critical_dates: List of the 3-6 most important upcoming dates with what must happen on each

7. financial_summary: Complete financial picture — total value, payment schedule, penalties,
   price escalators, what triggers additional costs

8. top_risks: The 3-5 most important risks or concerns in plain language
   (what could go wrong, what clauses are unfavorable)

9. recommended_actions: Specific actions the reader should take before signing or immediately
   after (negotiate X, calendar Y deadline, set up Z payment)

10. health_score: Integer 0-100 rating the overall fairness and clarity of this contract
    Scoring: start at 100, subtract:
    - 15 points per High severity risk flag
    - 7 points per Medium severity risk flag  
    - 3 points per Low severity risk flag
    - 5 points if any critical dates are within 30 days
    - 10 points if liability cap is below industry standard
    - 10 points if governing law is in an inconvenient jurisdiction
    Minimum score: 0

Return ONLY a raw JSON object:
{
  "headline": "",
  "parties_summary": "",
  "what_we_get": "",
  "what_we_owe": "",
  "key_commitments": ["", "", "", ""],
  "critical_dates": ["", "", ""],
  "financial_summary": "",
  "top_risks": ["", "", ""],
  "recommended_actions": ["", "", ""],
  "health_score": 0
}

STRICT RULES:
- Return ONLY the JSON. No markdown. No explanation. Start with { end with }
- Use real names, real numbers, real dates from the contract — never placeholders
- Every array must have at least 3 items — be thorough
"""

@router.post("/summary")
async def get_summary(req: SummaryRequest, current_user: dict = Depends(get_current_user)):
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Contract text is required")

    try:
        result = call_gemini(SYSTEM_PROMPT, req.text, ref_date_str=req.ref_date)
    except GeminiRequestError as e:
        raise HTTPException(status_code=502, detail=str(e))

    # Persist the computed summary against the owned contract row so it
    # restores after sign-out / reload. Best-effort: analysis still returns.
    client = data_client(current_user)
    if client and req.contract_id and owns_contract(current_user, req.contract_id):
        try:
            client.table("contracts").update({"summary": result}).eq(
                "id", req.contract_id
            ).eq("user_id", current_user["sub"]).execute()
        except Exception as e:
            print(f"[summary.py] Supabase save error: {e}")

    return result