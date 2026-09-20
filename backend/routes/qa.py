from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict
from services.gemini_client import call_gemini, GeminiRequestError
from services.security import get_current_user

router = APIRouter()

class Message(BaseModel):
    role: str
    content: str

class QARequest(BaseModel):
    contract_text: str
    question: str
    history: Optional[List[Dict[str, str]]] = []
    ref_date: Optional[str] = None

SYSTEM_PROMPT = """
You are a highly precise contract Q&A assistant. You only answer questions based on
the exact text of the contract provided. You never guess or infer beyond what is written.

The user has asked: {question}

Instructions:
1. Search the ENTIRE contract text carefully for every clause relevant to this question
2. Construct a precise, complete answer using only what the contract actually says
3. If the contract does not address the question, say so explicitly — never invent an answer
4. Cite every section you relied on — section number AND the exact clause text
5. If multiple sections are relevant, cite ALL of them
6. Assign confidence based on how explicitly the contract addresses the question:
   "High" = contract directly and unambiguously answers the question
   "Medium" = contract partially addresses it or the answer requires interpretation
   "Low" = contract does not clearly address it — answer is based on implication only

Return ONLY a raw JSON object:
{
  "answer": "Complete, precise answer to the question in plain English",
  "confidence": "High|Medium|Low",
  "sources": [
    {
      "section": "Section X.X",
      "clause_text": "Exact verbatim text of the relevant clause",
      "relevance": "Brief explanation of why this clause is relevant to the question"
    }
  ],
  "caveat": "Any important limitation or nuance the user should know (or null)"
}

STRICT RULES:
- Return ONLY the JSON. No markdown. No explanation. Start with { end with }
- Never say "I think" or "it appears" — state what the contract says
- If the answer is definitively not in the contract, set answer to exactly:
  "This question is not addressed in the provided contract text."
- Always include at least one source if the answer exists
"""

@router.post("/qa")
async def answer_question(req: QARequest, current_user: dict = Depends(get_current_user)):
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
    prompt = SYSTEM_PROMPT.replace("{question}", req.question)
    try:
        result = call_gemini(prompt, user_content, ref_date_str=req.ref_date)
    except GeminiRequestError as e:
        raise HTTPException(status_code=502, detail=str(e))
    return result
