from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from services.gemini_client import call_gemini
from services.security import get_current_user

router = APIRouter()

class CompareRequest(BaseModel):
    contract_a: str
    contract_b: str
    contract_a_title: Optional[str] = "Contract Version 1"
    contract_b_title: Optional[str] = "Contract Version 2"
    ref_date: Optional[str] = None

SYSTEM_PROMPT = (
    "You are a contract comparison engine. Given Contract A and Contract B, identify all meaningful differences. "
    "Return ONLY raw JSON: { changes: [{type: 'added|removed|modified', section, contract_a_text, contract_b_text, significance: 'High|Medium|Low', explanation}] }. "
    "Return ONLY a raw JSON object. No markdown. No explanation. No code fences."
)

@router.post("/compare")
async def compare_contracts(req: CompareRequest, current_user: dict = Depends(get_current_user)):
    if not req.contract_a.strip() or not req.contract_b.strip():
        raise HTTPException(status_code=400, detail="Both Contract A and Contract B are required")
    
    combined_content = f"--- CONTRACT A ({req.contract_a_title}) ---\n{req.contract_a}\n\n--- CONTRACT B ({req.contract_b_title}) ---\n{req.contract_b}"
    result = call_gemini(SYSTEM_PROMPT, combined_content, ref_date_str=req.ref_date)
    return result
