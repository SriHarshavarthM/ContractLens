from fastapi import APIRouter, HTTPException, Path, Query, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from services.supabase_client import data_client
from services.security import get_current_user
from services.ownership import assert_owns_contract

router = APIRouter()

class StatusUpdate(BaseModel):
    status: Optional[str] = None
    analysis_status: Optional[str] = None
    analysis_error: Optional[str] = None

VALID_CONTRACT_STATUSES = ["active", "expiring", "expired"]
VALID_ANALYSIS_STATUSES = ["pending", "running", "completed", "failed"]

@router.get("/contracts")
async def list_contracts(current_user: dict = Depends(get_current_user)):
    """List the authenticated user's contracts from Supabase with metadata and health_score."""
    client = data_client(current_user)
    if client is None:
        return []

    try:
        # Fetch only contracts owned by the verified user. Include the analysis
        # jsonb columns (and raw_text) so a restored session can rehydrate the
        # sidebar and analysis views without extra round-trips where possible.
        res = client.table("contracts").select(
            "id, name, status, uploaded_at, raw_text, summary, timeline, alerts, "
            "analysis_status, analysis_error, analyzed_at, document_type, file_type, pages, word_count, file_size_bytes"
        ).eq("user_id", current_user["sub"]).order("uploaded_at", desc=True).execute()
        contracts_list = res.data or []

        # Enrich with health_score from contract_extractions if available
        for c in contracts_list:
            c_id = c.get("id")
            c["health_score"] = 78 # default
            if c_id:
                ext_res = client.table("contract_extractions").select("health_score").eq("contract_id", c_id).limit(1).execute()
                if ext_res.data and len(ext_res.data) > 0 and ext_res.data[0].get("health_score") is not None:
                    c["health_score"] = ext_res.data[0].get("health_score")

        return contracts_list
    except Exception as e:
        print(f"[contracts.py] Error listing contracts: {e}")
        raise HTTPException(
            status_code=503,
            detail=(
                "Could not load contracts from the database. "
                "Apply migrations/002_contract_persistence.sql and confirm the "
                "contracts table has the expected columns before listing."
            ),
        )

@router.get("/contracts/{contract_id}")
async def get_contract_detail(
    contract_id: str = Path(...),
    current_user: dict = Depends(get_current_user),
):
    """Get full contract + extractions + obligations + flags for a contract the user owns."""
    client = data_client(current_user)
    if client is None:
        raise HTTPException(status_code=503, detail="Supabase connection not configured")

    # Ownership check first: a user may only read their own contract.
    assert_owns_contract(current_user, contract_id)

    try:
        c_res = client.table("contracts").select("*").eq("id", contract_id).eq("user_id", current_user["sub"]).single().execute()
        contract = c_res.data
        if not contract:
            raise HTTPException(status_code=404, detail="Contract not found")

        ext_res = client.table("contract_extractions").select("*").eq("contract_id", contract_id).execute()
        ob_res = client.table("obligations").select("*").eq("contract_id", contract_id).execute()
        flags_res = client.table("flags").select("*").eq("contract_id", contract_id).execute()

        extracted_data = ext_res.data[0] if (ext_res.data and len(ext_res.data) > 0) else None

        return {
            "id": contract["id"],
            "name": contract["name"],
            "raw_text": contract.get("raw_text", ""),
            "status": contract.get("status", "active"),
            "uploaded_at": contract.get("uploaded_at"),
            "analysis_status": contract.get("analysis_status", "pending"),
            "analysis_error": contract.get("analysis_error"),
            "analyzed_at": contract.get("analyzed_at"),
            "document_type": contract.get("document_type"),
            "file_type": contract.get("file_type"),
            "pages": contract.get("pages"),
            "word_count": contract.get("word_count"),
            "file_size_bytes": contract.get("file_size_bytes"),
            "extractedData": extracted_data,
            "obligations": ob_res.data or [],
            "flags": flags_res.data or [],
            "timeline": contract.get("timeline") or [],
            "summary": contract.get("summary"),
            "alerts": contract.get("alerts"),
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[contracts.py] Error fetching contract {contract_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/contracts/{contract_id}")
async def delete_contract(
    contract_id: str = Path(...),
    current_user: dict = Depends(get_current_user),
):
    """Delete a contract owned by the user (CASCADE handles related records)."""
    client = data_client(current_user)
    if client is None:
        raise HTTPException(status_code=503, detail="Supabase connection not configured")

    assert_owns_contract(current_user, contract_id)

    try:
        res = client.table("contracts").delete().eq("id", contract_id).eq("user_id", current_user["sub"]).execute()
        return {"status": "success", "deleted_id": contract_id}
    except Exception as e:
        print(f"[contracts.py] Error deleting contract {contract_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/contracts/{contract_id}/status")
async def update_contract_status(
    contract_id: str,
    data: StatusUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Update status and/or analysis lifecycle fields for a contract owned by the user.

    Supports the display status (active/expiring/expired) and the analysis
    pipeline status (pending/running/completed/failed). When an analysis is
    marked completed, `analyzed_at` is set; when failed, `analysis_error` can
    be stored so the UI can show the honest reason instead of fabricating one.
    """
    client = data_client(current_user)
    if client is None:
        raise HTTPException(status_code=503, detail="Supabase connection not configured")

    assert_owns_contract(current_user, contract_id)

    payload = {}
    if data.status is not None:
        if data.status not in VALID_CONTRACT_STATUSES:
            raise HTTPException(status_code=400, detail=f"Status must be one of: {VALID_CONTRACT_STATUSES}")
        payload["status"] = data.status

    if data.analysis_status is not None:
        if data.analysis_status not in VALID_ANALYSIS_STATUSES:
            raise HTTPException(status_code=400, detail=f"analysis_status must be one of: {VALID_ANALYSIS_STATUSES}")
        payload["analysis_status"] = data.analysis_status
        if data.analysis_status == "completed":
            payload["analyzed_at"] = datetime.now(timezone.utc).isoformat()
            payload["analysis_error"] = None
        if data.analysis_status == "failed":
            payload["analyzed_at"] = None

    if data.analysis_error is not None:
        payload["analysis_error"] = data.analysis_error[:2000]

    if not payload:
        raise HTTPException(status_code=400, detail="Nothing to update")

    try:
        res = client.table("contracts").update(payload).eq("id", contract_id).eq("user_id", current_user["sub"]).execute()
        return {"status": "success", "contract_id": contract_id, "new_status": data.status, "analysis_status": data.analysis_status}
    except Exception as e:
        print(f"[contracts.py] Error updating status for {contract_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
