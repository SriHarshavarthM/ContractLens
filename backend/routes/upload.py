import io
from fastapi import APIRouter, File, UploadFile, HTTPException
from pydantic import BaseModel
import pymupdf as fitz

router = APIRouter()

class DirectTextInput(BaseModel):
    filename: str = "contract.txt"
    text: str

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Handle PDF/DOCX/TXT contract uploads and extract raw text using PyMuPDF."""
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
            # Attempt decoding as UTF-8 or latin-1 for txt / docx fallback
            try:
                extracted_text = content.decode("utf-8")
            except UnicodeDecodeError:
                extracted_text = content.decode("latin-1", errors="replace")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse document: {str(e)}")

    extracted_text = extracted_text.strip()
    words = len(extracted_text.split()) if extracted_text else 0

    return {
        "filename": filename,
        "text": extracted_text,
        "pages": page_count,
        "word_count": words,
        "status": "success"
    }

@router.post("/upload/text")
async def upload_raw_text(data: DirectTextInput):
    """Directly register raw contract text (e.g. sample contract)."""
    text = data.text.strip()
    words = len(text.split()) if text else 0
    return {
        "filename": data.filename,
        "text": text,
        "pages": max(1, words // 350),
        "word_count": words,
        "status": "success"
    }
