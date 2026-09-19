from fastapi import APIRouter, HTTPException, Path, Query, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from services.supabase_client import data_client
from services.security import get_current_user
from services.ownership import assert_owns_contract

router = APIRouter()

class StatusUpdate(BaseModel):
    status: str

@router.get("/contracts")
async def list_contracts(current_user: dict = Depends(get_current_user)):
    """List the authenticated user's contracts from Supabase with metadata and health_score."""
    client = data_client(current_user)
    if client is None:
        return []

    try:
        # Fetch only contracts owned by the verified user.
        res = client.table("contracts").select("id, name, status, uploaded_at").eq("user_id", current_user["sub"]).order("uploaded_at", desc=True).execute()
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
            "extractedData": extracted_data,
            "obligations": ob_res.data or [],
            "flags": flags_res.data or [],
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
    """Update status field (active/expiring/expired) for a contract owned by the user."""
    client = data_client(current_user)
    if client is None:
        raise HTTPException(status_code=503, detail="Supabase connection not configured")

    assert_owns_contract(current_user, contract_id)

    valid_statuses = ["active", "expiring", "expired"]
    if data.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Status must be one of: {valid_statuses}")

    try:
        res = client.table("contracts").update({"status": data.status}).eq("id", contract_id).eq("user_id", current_user["sub"]).execute()
        return {"status": "success", "contract_id": contract_id, "new_status": data.status}
    except Exception as e:
        print(f"[contracts.py] Error updating status for {contract_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
