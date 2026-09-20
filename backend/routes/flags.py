from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from services.gemini_client import call_gemini, GeminiRequestError
from services.supabase_client import data_client
from services.security import get_current_user
from services.ownership import owns_contract

router = APIRouter()

class FlagsRequest(BaseModel):
    text: str
    ref_date: Optional[str] = None
    contract_id: Optional[str] = None

SYSTEM_PROMPT = """
You are a senior contract risk attorney and risk analyst with expertise in identifying unfavorable,
ambiguous, and legally risky clauses in business contracts.

Your task: Perform a thorough clause-by-clause risk audit of this contract.
Flag every clause that a prudent attorney would recommend their client review carefully.

Flag a clause if it is ANY of the following:
- ONE-SIDED: Gives one party significantly more rights or protection than the other
- AMBIGUOUS: Uses vague language that could be interpreted multiple ways in a dispute
- LIABILITY RISK: Exposes a party to unlimited or disproportionate financial liability
- UNUSUAL: Deviates from standard industry practice in a material way
- MISSING PROTECTION: A standard protective clause that is absent from this contract
- DATA/IP RISK: Gives the other party broad rights over data, IP, or confidential information
- TERMINATION RISK: Allows termination under conditions that seem unfair or too broad
- JURISDICTION RISK: Forces dispute resolution in an inconvenient or one-sided jurisdiction
- INDEMNIFICATION RISK: Broad indemnification obligations not balanced by the other party
- AUTO-RENEWAL TRAP: Short notice window for a long auto-renewal term

For each flag:
- clause_text: The exact problematic text from the contract (verbatim, full clause)
- section_reference: The section number (e.g. "Section 9.1")
- flag_type: One of the categories above
- reason: Specific explanation of WHY this is risky — which party is exposed and how
- severity: "High" (could cause major financial loss or legal action) |
            "Medium" (unfavorable but manageable) |
            "Low" (worth noting but minor)
- affected_party: Which party is negatively affected by this clause
- suggested_revision: A brief plain-English suggestion for how to make this clause fairer

Return ONLY a raw JSON object:
{
  "flags": [
    {
      "clause_text": "",
      "section_reference": "",
      "flag_type": "",
      "reason": "",
      "severity": "High|Medium|Low",
      "affected_party": "",
      "suggested_revision": ""
    }
  ]
}

STRICT RULES:
- Return ONLY the JSON. No markdown. No explanation. Start with { end with }
- Flag aggressively — a thorough review of a business contract should find 6-15 flags minimum
- For "MISSING PROTECTION" flags, set clause_text to "NOT PRESENT IN CONTRACT"
- Never flag something trivial — every flag must have a genuine legal or business reason
"""

@router.post("/flags")
async def get_flags(req: FlagsRequest, current_user: dict = Depends(get_current_user)):
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Contract text is required")

    try:
        result = call_gemini(SYSTEM_PROMPT, req.text)
    except GeminiRequestError as e:
        raise HTTPException(status_code=502, detail=str(e))
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
                    "title": str(fl.get("title", "") or ""),
                    "clause_text": str(fl.get("clause_text", "")),
                    "reason": str(fl.get("reason", "")),
                    "severity": sev,
                    "section_reference": str(fl.get("section_reference", "")),
                    "page_reference": str(fl.get("page_reference", "") or ""),
                    "business_impact": str(fl.get("business_impact", "") or ""),
                    "review_consideration": str(fl.get("review_consideration", "") or ""),
                    "is_reviewed": False
                })
            if records:
                # Replace any previous flags for this contract so re-analysis
                # never mixes stale results with fresh ones.
                client.table("flags").delete().eq("contract_id", req.contract_id).execute()
            client.table("flags").insert(records).execute()
        except Exception as e:
            print(f"[flags.py] Supabase save error: {e}")

    return result