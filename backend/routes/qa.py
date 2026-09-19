from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict
from services.gemini_client import call_gemini

router = APIRouter()

class Message(BaseModel):
    role: str
    content: str

class QARequest(BaseModel):
    contract_text: str
    question: str
    history: Optional[List[Dict[str, str]]] = []
    ref_date: Optional[str] = None

SYSTEM_PROMPT = (
    "You are a contract Q&A assistant. Answer the user's question based ONLY on the contract text provided. "
    "Cite the specific section your answer comes from. "
    "Return ONLY raw JSON: { answer, confidence: 'High|Medium|Low', source_section, source_text }. "
    "Return ONLY a raw JSON object. No markdown. No explanation. No code fences."
)

@router.post("/qa")
async def answer_question(req: QARequest):
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question is required")
    if not req.contract_text.strip():
        raise HTTPException(status_code=400, detail="Contract text is required")

    history_context = ""
    if req.history:
        history_context = "\nPrior conversation history:\n" + "\n".join(
            [f"{m.get('role', 'user')}: {m.get('content', '')}" for m in req.history[-4:]]
        )

    user_content = f"{req.contract_text}\n\n{history_context}\n\nUser Question: {req.question}"
    result = call_gemini(SYSTEM_PROMPT, user_content, ref_date_str=req.ref_date)
    return result
