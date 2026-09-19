from fastapi import APIRouter, HTTPException, Path, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from services.supabase_client import supabase

router = APIRouter()

class StatusUpdate(BaseModel):
    status: str

@router.get("/contracts")
async def list_contracts():
    """List all contracts from Supabase with basic metadata and health_score."""
    if not supabase:
        return []
    
    try:
        # Fetch contracts
        res = supabase.table("contracts").select("id, name, status, uploaded_at").order("uploaded_at", desc=True).execute()
        contracts_list = res.data or []

        # Enrich with health_score from contract_extractions if available
        for c in contracts_list:
            c_id = c.get("id")
            c["health_score"] = 78 # default
            if c_id:
                ext_res = supabase.table("contract_extractions").select("health_score").eq("contract_id", c_id).limit(1).execute()
                if ext_res.data and len(ext_res.data) > 0 and ext_res.data[0].get("health_score") is not None:
                    c["health_score"] = ext_res.data[0].get("health_score")

        return contracts_list
    except Exception as e:
        print(f"[contracts.py] Error listing contracts: {e}")
        return []

@router.get("/contracts/{contract_id}")
async def get_contract_detail(contract_id: str = Path(...)):
    """Get full contract + extractions + obligations + flags for a contract."""
    if not supabase:
        raise HTTPException(status_code=503, detail="Supabase connection not configured")

    try:
        c_res = supabase.table("contracts").select("*").eq("id", contract_id).single().execute()
        contract = c_res.data
        if not contract:
            raise HTTPException(status_code=404, detail="Contract not found")

        ext_res = supabase.table("contract_extractions").select("*").eq("contract_id", contract_id).execute()
        ob_res = supabase.table("obligations").select("*").eq("contract_id", contract_id).execute()
        flags_res = supabase.table("flags").select("*").eq("contract_id", contract_id).execute()

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
async def delete_contract(contract_id: str = Path(...)):
    """Delete contract and all related records (CASCADE handles related tables)."""
    if not supabase:
        raise HTTPException(status_code=503, detail="Supabase connection not configured")

    try:
        res = supabase.table("contracts").delete().eq("id", contract_id).execute()
        return {"status": "success", "deleted_id": contract_id}
    except Exception as e:
        print(f"[contracts.py] Error deleting contract {contract_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/contracts/{contract_id}/status")
async def update_contract_status(contract_id: str, data: StatusUpdate):
    """Update status field (active/expiring/expired)."""
    if not supabase:
        raise HTTPException(status_code=503, detail="Supabase connection not configured")

    valid_statuses = ["active", "expiring", "expired"]
    if data.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Status must be one of: {valid_statuses}")

    try:
        res = supabase.table("contracts").update({"status": data.status}).eq("id", contract_id).execute()
        return {"status": "success", "contract_id": contract_id, "new_status": data.status}
    except Exception as e:
        print(f"[contracts.py] Error updating status for {contract_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
