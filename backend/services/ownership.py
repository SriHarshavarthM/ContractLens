from fastapi import HTTPException
from services.supabase_client import data_client


def owns_contract(user: dict, contract_id) -> bool:
    """Return True when the verified user owns the given contract row.

    This is the backend-authoritative ownership check applied to every
    contract-scoped read and write. It is independent of (and complementary to)
    any database-level Row Level Security policy.
    """
    if not user or not user.get("sub") or not contract_id:
        return False
    client = data_client(user)
    if client is None:
        return False
    try:
        res = (
            client.table("contracts")
            .select("id")
            .eq("id", contract_id)
            .eq("user_id", user["sub"])
            .limit(1)
            .execute()
        )
        return bool(res.data)
    except Exception as e:
        print(f"[ownership] Ownership check failed: {e}")
        return False


def assert_owns_contract(user: dict, contract_id) -> None:
    """Raise HTTP 404 (not 403) to avoid leaking whether a contract exists."""
    if not owns_contract(user, contract_id):
        raise HTTPException(status_code=404, detail="Contract not found or access denied.")