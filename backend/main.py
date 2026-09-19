import os
from fastapi import FastAPI
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
    auth,
)
from services import gemini_client

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
app.include_router(auth.router, tags=["Authentication"])
app.include_router(upload.router, tags=["Upload"])
app.include_router(extract.router, tags=["Extraction"])
app.include_router(obligations.router, tags=["Obligations"])
app.include_router(timeline.router, tags=["Timeline"])
app.include_router(flags.router, tags=["Flags"])
app.include_router(compare.router, tags=["Compare"])
app.include_router(qa.router, tags=["Q&A"])
app.include_router(summary.router, tags=["Summary"])
app.include_router(alerts.router, tags=["Alerts"])

class ApiKeyUpdate(BaseModel):
    api_key: str

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "app": "ContractLens AI",
        "gemini_configured": bool(gemini_client.GEMINI_API_KEY),
        "model": gemini_client.active_model_name or "gemini-flash-latest",
        "fallback_mode": False,
    }

@app.post("/config/key")
def update_api_key(data: ApiKeyUpdate):
    success = gemini_client.set_api_key(data.api_key)
    return {
        "status": "success" if success else "error",
        "gemini_configured": bool(gemini_client.GEMINI_API_KEY),
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
