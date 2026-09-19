import os
import jwt
from fastapi import Header, HTTPException
from typing import Optional
from services.supabase_client import supabase


def _parse_bearer_token(authorization: Optional[str]) -> Optional[str]:
    """Extract the access token from an `Authorization: Bearer <token>` header."""
    if not authorization or not authorization.strip():
        return None
    parts = authorization.split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    token = parts[1].strip()
    return token or None


def _verify_token_locally(token: str) -> Optional[dict]:
    """Optional fast-path signature/claim verification when SUPABASE_JWT_SECRET is set.

    Supabase issues HS256-signed JWTs (project JWT secret). When the secret is
    available we reject tokens that fail signature/expiry/audience checks before
    contacting Supabase Auth. Verifying against the secret is never the sole
    source of truth — the remote lookup below is authoritative.
    """
    secret = os.getenv("SUPABASE_JWT_SECRET", "").strip()
    if not secret:
        return None

    aud = os.getenv("SUPABASE_JWT_AUD", "authenticated").strip()
    iss_prefix = os.getenv("SUPABASE_URL", "").strip()

    try:
        payload = jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
            audience=aud,
            options={"require": ["exp", "sub"]},
        )
    except jwt.InvalidTokenError:
        return None

    if iss_prefix and payload.get("iss") and not payload["iss"].startswith(iss_prefix.rstrip("/") + "/"):
        return None

    return payload


def _verify_token_remotely(token: str) -> dict:
    """Authoritative verification: ask Supabase Auth for the user behind this token.

    This validates the signature against the project's signing config, rejects
    expired/revoked tokens, and returns the verified user record.
    """
    if not supabase:
        raise HTTPException(
            status_code=503,
            detail="Access token verification is unavailable: Supabase is not configured on the backend.",
        )
    try:
        user_resp = supabase.auth.get_user(token)
        user = user_resp.user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired session token.")
    if not user or not user.id:
        raise HTTPException(status_code=401, detail="Invalid or expired session token.")

    return {
        "sub": str(user.id),
        "id": str(user.id),
        "email": user.email or "",
        "role": (user.role or "authenticated"),
        "token": token,
    }


async def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    """FastAPI dependency that returns the verified Supabase user for a request.

    Rejects missing, malformed, invalid, or expired tokens with HTTP 401.
    The identity is cryptographically verified with Supabase Auth — never
    accepted from arbitrary request bodies.
    """
    token = _parse_bearer_token(authorization)
    if not token:
        raise HTTPException(
            status_code=401,
            detail="Missing or malformed Authorization header. Expected: Authorization: Bearer <token>",
        )

    # Fast-path signature check when the JWT secret is configured.
    if os.getenv("SUPABASE_JWT_SECRET", "").strip():
        if _verify_token_locally(token) is None:
            raise HTTPException(status_code=401, detail="Invalid or expired session token.")

    return _verify_token_remotely(token)


def require_user(user: dict) -> dict:
    """Assert a verified user is present; used for endpoints already guarded by a dependency."""
    if not user or not user.get("sub"):
        raise HTTPException(status_code=401, detail="Not authenticated.")
    return user