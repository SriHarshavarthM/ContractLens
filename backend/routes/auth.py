import uuid
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict

router = APIRouter(prefix="/auth", tags=["Authentication"])

# In-memory users store with demo account preloaded
DEMO_USER = {
    "id": "usr_demo_01",
    "name": "Panji Dwi",
    "email": "demo@contractlens.ai",
    "password": "demo123",
    "role": "Lead Legal Counsel & Contract Manager",
    "employee_id": "#EMP07",
    "avatar_initials": "PD",
}

USERS_DB: Dict[str, dict] = {
    "demo@contractlens.ai": DEMO_USER,
}

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: Optional[str] = "Contract Analyst"

class AuthResponse(BaseModel):
    success: bool
    token: str
    message: str
    user: dict

@router.get("/demo-credentials")
def get_demo_credentials():
    """Returns official demo login credentials for 1-click evaluation."""
    return {
        "email": DEMO_USER["email"],
        "password": DEMO_USER["password"],
        "name": DEMO_USER["name"],
        "role": DEMO_USER["role"],
        "instructions": "Click 'Quick Demo Login' or enter these credentials."
    }

@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest):
    email = req.email.strip().lower()
    password = req.password.strip()

    # If demo email, allow demo login effortlessly
    if email == "demo@contractlens.ai":
        user_data = DEMO_USER.copy()
        user_data.pop("password", None)
        return {
            "success": True,
            "token": f"cl_token_{uuid.uuid4().hex[:16]}",
            "message": "Login successful as Demo User",
            "user": user_data,
        }

    user = USERS_DB.get(email)
    if not user:
        raise HTTPException(status_code=401, detail="Account not found. Please register or use the Demo Account.")

    if user["password"] != password:
        raise HTTPException(status_code=401, detail="Invalid credentials. Please verify your password.")

    user_data = user.copy()
    user_data.pop("password", None)
    return {
        "success": True,
        "token": f"cl_token_{uuid.uuid4().hex[:16]}",
        "message": "Login successful",
        "user": user_data,
    }

@router.post("/register", response_model=AuthResponse)
def register(req: RegisterRequest):
    email = req.email.strip().lower()
    name = req.name.strip()
    password = req.password.strip()

    if not email or not password or not name:
        raise HTTPException(status_code=400, detail="Name, email, and password are required.")

    if email in USERS_DB:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    initials = "".join([part[0].upper() for part in name.split()[:2]]) or "US"
    new_user = {
        "id": f"usr_{uuid.uuid4().hex[:8]}",
        "name": name,
        "email": email,
        "password": password,
        "role": req.role or "Legal Reviewer",
        "employee_id": f"#EMP{len(USERS_DB) + 7:02d}",
        "avatar_initials": initials,
    }
    USERS_DB[email] = new_user

    user_data = new_user.copy()
    user_data.pop("password", None)

    return {
        "success": True,
        "token": f"cl_token_{uuid.uuid4().hex[:16]}",
        "message": "Registration successful",
        "user": user_data,
    }
