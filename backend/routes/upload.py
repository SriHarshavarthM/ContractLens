import io
import uuid
from fastapi import APIRouter, File, UploadFile, HTTPException
from pydantic import BaseModel
import pymupdf as fitz
from services.supabase_client import supabase

router = APIRouter()

class DirectTextInput(BaseModel):
    filename: str = "contract.txt"
    text: str

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Handle PDF/DOCX/TXT contract uploads, extract text, and save to Supabase."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    filename = file.filename
    content = await file.read()
    
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

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

    contract_id = None
    if supabase:
        try:
            insert_res = supabase.table("contracts").insert({
                "name": filename,
                "raw_text": extracted_text,
                "status": "active"
            }).execute()
            if insert_res.data and len(insert_res.data) > 0:
                contract_id = insert_res.data[0].get("id")
        except Exception as e:
            print(f"[upload.py] Supabase save error: {e}")

    if not contract_id:
        contract_id = str(uuid.uuid4())

    return {
        "contract_id": contract_id,
        "filename": filename,
        "text": extracted_text,
        "pages": page_count,
        "word_count": words,
        "status": "success"
    }

@router.post("/upload/text")
async def upload_raw_text(data: DirectTextInput):
    """Directly register raw contract text (e.g. sample contract) and save to Supabase."""
    text = data.text.strip()
    words = len(text.split()) if text else 0

    contract_id = None
    if supabase:
        try:
            insert_res = supabase.table("contracts").insert({
                "name": data.filename,
                "raw_text": text,
                "status": "active"
            }).execute()
            if insert_res.data and len(insert_res.data) > 0:
                contract_id = insert_res.data[0].get("id")
        except Exception as e:
            print(f"[upload.py] Supabase save error: {e}")

    if not contract_id:
        contract_id = str(uuid.uuid4())

    return {
        "contract_id": contract_id,
        "filename": data.filename,
        "text": text,
        "pages": max(1, words // 350),
        "word_count": words,
        "status": "success"
    }
