import os
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

from routes import (
    upload,
    extract,
    obligations,
    timeline,
    flags,
    compare,
    qa,
    summary,
    alerts,
    contracts,
)
from services import gemini_client
from services.security import get_current_user
from services.ownership import owns_contract

app = FastAPI(
    title="ContractLens Backend API",
    description="Business Contract Review & Obligation Tracking Agent API",
    version="1.0.0",
)

# Enable CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route modules
app.include_router(contracts.router, tags=["Contracts"])
app.include_router(upload.router, tags=["Upload"])
app.include_router(extract.router, tags=["Extraction"])
app.include_router(obligations.router, tags=["Obligations"])
app.include_router(timeline.router, tags=["Timeline"])
app.include_router(flags.router, tags=["Flags"])
app.include_router(compare.router, tags=["Compare"])
app.include_router(qa.router, tags=["Q&A"])
app.include_router(summary.router, tags=["Summary"])
app.include_router(alerts.router, tags=["Alerts"])

import asyncio
import json
import threading
from fastapi.responses import StreamingResponse
from services.gemini_client import call_gemini_stream, PRIMARY_MODEL
from services.supabase_client import data_client
from routes.extract import SYSTEM_PROMPT as EXTRACT_SYSTEM_PROMPT, sanitize_date as sanitize_extract_date
from routes.obligations import SYSTEM_PROMPT as OBLIGATIONS_SYSTEM_PROMPT, sanitize_date as sanitize_oblig_date
from routes.summary import SYSTEM_PROMPT as SUMMARY_SYSTEM_PROMPT

class ApiKeyUpdate(BaseModel):
    api_key: str

@app.get("/health")
def health_check():
    from services.gemini_client import USE_FALLBACK, GEMINI_API_KEY, PRIMARY_MODEL
    return {
        "status": "healthy",
        "app": "ContractLens AI",
        "gemini_configured": bool(GEMINI_API_KEY),
        "model": PRIMARY_MODEL if not USE_FALLBACK else "fallback-engine",
        "fallback_mode": USE_FALLBACK,
    }

@app.get("/debug/ai")
async def debug_ai(current_user: dict = Depends(get_current_user)):
    from services.gemini_client import USE_FALLBACK, GEMINI_API_KEY, PRIMARY_MODEL
    return {
        "api_key_loaded": bool(GEMINI_API_KEY),
        "using_fallback": USE_FALLBACK,
        "model": PRIMARY_MODEL if not USE_FALLBACK else "fallback-engine",
        "authenticated_user": current_user["sub"],
        "status": "AI active" if not USE_FALLBACK else "Fallback mode"
    }

def save_extraction_supabase(payload: dict, data: dict, current_user: dict):
    contract_id = payload.get("contract_id")
    client = data_client(current_user)
    if client and contract_id and owns_contract(current_user, contract_id):
        try:
            ext_payload = {
                "contract_id": contract_id,
                "document_type": str(data.get("document_type", "") or ""),
                "title": str(data.get("title", "") or ""),
                "governing_law": str(data.get("governing_law", "") or ""),
                "financial_value": str(data.get("financial_value", "") or ""),
                "parties": data.get("parties"),
                "effective_date": sanitize_extract_date(data.get("effective_date")),
                "expiration_date": sanitize_extract_date(data.get("expiration_date")),
                "renewal_terms": str(data.get("renewal_terms", "") or ""),
                "payment_terms": str(data.get("payment_terms", "") or ""),
                "termination_conditions": str(data.get("termination_conditions", "") or ""),
                "service_obligations": str(data.get("service_obligations", "") or ""),
                "important_dates": data.get("important_dates", []),
                "source_sections": data.get("source_sections"),
                "health_score": 78
            }
            # Replace any previous extraction so re-analysis never mixes stale
            # fragments with fresh results.
            client.table("contract_extractions").delete().eq("contract_id", contract_id).execute()
            client.table("contract_extractions").insert(ext_payload).execute()
            doc_type = str(data.get("document_type", "") or "")
            if doc_type:
                client.table("contracts").update({"document_type": doc_type}).eq(
                    "id", contract_id
                ).eq("user_id", current_user["sub"]).execute()
        except Exception as e:
            print(f"[extract/stream] Supabase save error: {e}")

def save_obligations_supabase(payload: dict, data: dict, current_user: dict):
    contract_id = payload.get("contract_id")
    obligations_list = data.get("obligations", [])
    client = data_client(current_user)
    if client and contract_id and obligations_list and owns_contract(current_user, contract_id):
        try:
            records = []
            for ob in obligations_list:
                urgency = ob.get("urgency", "Medium")
                if urgency not in ["Critical", "High", "Medium", "Low"]:
                    urgency = "Medium"
                records.append({
                    "contract_id": contract_id,
                    "party": str(ob.get("party", "")),
                    "description": str(ob.get("description", "")),
                    "deadline": sanitize_oblig_date(ob.get("deadline")),
                    "urgency": urgency,
                    "source_clause": str(ob.get("source_clause", "")),
                    "obligation_type": str(ob.get("obligation_type", "") or ""),
                    "frequency": str(ob.get("frequency", "") or ""),
                    "is_dismissed": False
                })
            if records:
                # Replace any previous obligations so re-analysis never mixes
                # stale results with fresh ones.
                client.table("obligations").delete().eq("contract_id", contract_id).execute()
            client.table("obligations").insert(records).execute()
        except Exception as e:
            print(f"[obligations/stream] Supabase save error: {e}")

def make_stream_response(system_prompt: str, payload: dict, current_user: dict, post_process_fn=None):
    contract_text = payload.get("text", "")

    async def event_generator():
        loop = asyncio.get_running_loop()
        queue = asyncio.Queue()

        def on_chunk(text: str):
            loop.call_soon_threadsafe(queue.put_nowait, {"type": "chunk", "text": text})

        def on_complete(result: dict):
            if post_process_fn:
                try:
                    post_process_fn(payload, result, current_user)
                except Exception as e:
                    print(f"[stream post_process error]: {e}")
            loop.call_soon_threadsafe(queue.put_nowait, {"type": "complete", "data": result})

        def on_error(error: str):
            loop.call_soon_threadsafe(queue.put_nowait, {"type": "error", "message": error})

        thread = threading.Thread(
            target=call_gemini_stream,
            kwargs={
                "system_prompt": system_prompt,
                "user_content": contract_text,
                "on_chunk": on_chunk,
                "on_complete": on_complete,
                "on_error": on_error,
            }
        )
        thread.start()

        while True:
            event = await queue.get()
            yield f"data: {json.dumps(event)}\n\n"
            if event["type"] in ("complete", "error"):
                break

        thread.join(timeout=35)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        }
    )

@app.post("/extract/stream")
async def extract_stream(payload: dict, current_user: dict = Depends(get_current_user)):
    return make_stream_response(EXTRACT_SYSTEM_PROMPT, payload, current_user, save_extraction_supabase)

@app.post("/obligations/stream")
async def obligations_stream(payload: dict, current_user: dict = Depends(get_current_user)):
    from datetime import date
    today = payload.get("ref_date") or date.today().isoformat()
    prompt = OBLIGATIONS_SYSTEM_PROMPT.replace("{today}", today)
    return make_stream_response(prompt, payload, current_user, save_obligations_supabase)

@app.post("/summary/stream")
async def summary_stream(payload: dict, current_user: dict = Depends(get_current_user)):
    return make_stream_response(SUMMARY_SYSTEM_PROMPT, payload, current_user)

@app.post("/config/key")
def update_api_key(data: ApiKeyUpdate, current_user: dict = Depends(get_current_user)):
    success = gemini_client.set_api_key(data.api_key)
    return {
        "status": "success" if success else "error",
        "gemini_configured": bool(gemini_client.GEMINI_API_KEY),
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
