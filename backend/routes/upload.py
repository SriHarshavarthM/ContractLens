import io
from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from pydantic import BaseModel
import pymupdf as fitz
from services.supabase_client import data_client
from services.security import get_current_user

router = APIRouter()

def persist_contract(client, current_user: dict, name: str, text: str, metadata: dict = None):
    """Insert the contract row scoped to the verified user and return its DB id.

    Never falls back to a client-supplied/random id: persistence must succeed
    for the upload to be reported as successful. Errors surface so a failed
    database insert is never presented as persisted data.
    """
    if client is None:
        raise HTTPException(
            status_code=503,
            detail="Contract persistence unavailable: Supabase is not configured on the backend.",
        )
    meta = metadata or {}
    try:
        insert_res = client.table("contracts").insert({
            "name": name,
            "raw_text": text,
            "status": "active",
            "user_id": current_user["sub"],
            # Document metadata so list/history views never fabricate it.
            "file_type": meta.get("file_type", ""),
            "file_size_bytes": meta.get("file_size_bytes"),
            "pages": meta.get("pages"),
            "word_count": meta.get("word_count"),
            "analysis_status": "pending",
            "analyzed_at": None,
            "analysis_error": None,
        }).execute()
    except Exception as e:
        print(f"[upload.py] Supabase save error: {e}")
        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to persist the contract in the database. "
                "Apply migrations/002_contract_persistence.sql and ensure any "
                "enabled RLS policies allow authenticated users to insert rows."
            ),
        )

    inserted = insert_res.data if insert_res else None
    contract_id = inserted[0].get("id") if inserted else None
    if not contract_id:
        raise HTTPException(
            status_code=500,
            detail="Failed to persist the contract: the database returned no record.",
        )
    return contract_id

class DirectTextInput(BaseModel):
    filename: str = "contract.txt"
    text: str

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """Handle PDF/DOCX/TXT contract uploads, extract text, and save to Supabase scoped to the user."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    filename = file.filename
    content = await file.read()
    
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    file_type = filename.rsplit(".", 1)[-1].lower() if "." in filename else "txt"
    extracted_text = ""
    page_count = 1

    try:
        if filename.lower().endswith(".pdf"):
            doc = fitz.open(stream=content, filetype="pdf")
            page_count = len(doc)
            pages_text = []
            for i in range(page_count):
                page = doc.load_page(i)
                pages_text.append(page.get_text("text"))
            extracted_text = "\n\n".join(pages_text)
            doc.close()
        else:
            try:
                extracted_text = content.decode("utf-8")
            except UnicodeDecodeError:
                extracted_text = content.decode("latin-1", errors="replace")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse document: {str(e)}")

    extracted_text = extracted_text.strip()
    words = len(extracted_text.split()) if extracted_text else 0

    client = data_client(current_user)
    contract_id = persist_contract(client, current_user, filename, extracted_text, {
        "file_type": file_type,
        "file_size_bytes": len(content),
        "pages": page_count,
        "word_count": words,
    })

    return {
        "contract_id": contract_id,
        "filename": filename,
        "file_type": file_type,
        "file_size_bytes": len(content),
        "text": extracted_text,
        "pages": page_count,
        "word_count": words,
        "status": "success"
    }

@router.post("/upload/text")
async def upload_raw_text(
    data: DirectTextInput,
    current_user: dict = Depends(get_current_user),
):
    """Directly register raw contract text (e.g. sample contract) and save to Supabase scoped to the user."""
    text = data.text.strip()
    words = len(text.split()) if text else 0

    client = data_client(current_user)
    contract_id = persist_contract(client, current_user, data.filename, text, {
        "file_type": data.filename.rsplit(".", 1)[-1].lower() if "." in data.filename else "txt",
        "file_size_bytes": len(text.encode("utf-8")),
        "pages": max(1, words // 350),
        "word_count": words,
    })

    return {
        "contract_id": contract_id,
        "filename": data.filename,
        "text": text,
        "pages": max(1, words // 350),
        "word_count": words,
        "status": "success"
    }
