import os
import json
import re
from dotenv import load_dotenv
from fastapi import HTTPException

# Load environment variables
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()

# Candidate models in order of priority
CANDIDATE_MODELS = [
    "gemini-flash-latest",
    "gemini-3.6-flash",
    "gemini-2.5-flash",
    "gemini-pro-latest",
]

genai_model = None
active_model_name = None

def init_gemini(api_key: str):
    global GEMINI_API_KEY, genai_model, active_model_name
    GEMINI_API_KEY = api_key.strip()
    if not GEMINI_API_KEY:
        genai_model = None
        active_model_name = None
        return False

    import google.generativeai as genai
    genai.configure(api_key=GEMINI_API_KEY)

    for model_name in CANDIDATE_MODELS:
        try:
            model = genai.GenerativeModel(model_name)
            # Lightweight verification
            genai_model = model
            active_model_name = model_name
            print(f"[Gemini] Successfully initialized model: {model_name}")
            return True
        except Exception as e:
            print(f"[Gemini] Candidate {model_name} failed: {e}")
            continue

    print("[Gemini] Warning: No candidate models could be initialized.")
    return False

# Initialize on module load if key exists
if GEMINI_API_KEY:
    try:
        init_gemini(GEMINI_API_KEY)
    except Exception as e:
        print(f"[Gemini] Startup initialization error: {e}")

def set_api_key(api_key: str) -> bool:
    return init_gemini(api_key)

def call_gemini(system_prompt: str, user_content: str, ref_date_str: str = None) -> dict:
    """
    Directly call Google Gemini API.
    Raises HTTPException on missing key or API failure (Demo engine removed).
    """
    global GEMINI_API_KEY, genai_model, active_model_name

    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=400,
            detail="GEMINI_API_KEY is not configured in backend/.env or settings."
        )

    if genai_model is None:
        success = init_gemini(GEMINI_API_KEY)
        if not success or genai_model is None:
            raise HTTPException(
                status_code=500,
                detail="Failed to initialize Gemini AI model. Please check your API key and quotas."
            )

    full_prompt = (
        f"{system_prompt}\n\n"
        f"Contract Content:\n{user_content}\n\n"
        "Output Requirement: Return ONLY a valid JSON object. No explanations, no markdown fences. "
        "Your response MUST start with '{' and end with '}'."
    )

    try:
        response = genai_model.generate_content(full_prompt)
        text = response.text.strip()

        # Clean markdown code fences if returned by model
        if "```" in text:
            text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
            text = re.sub(r"\s*```$", "", text)
            text = text.strip()

        # Find boundary of JSON object
        first_brace = text.find("{")
        last_brace = text.rfind("}")
        if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
            text = text[first_brace:last_brace + 1]

        parsed = json.loads(text)
        return parsed

    except json.JSONDecodeError as json_err:
        # Retry with clean extraction if partial formatting occurred
        try:
            match = re.search(r"(\{.*\})", text, re.DOTALL)
            if match:
                return json.loads(match.group(1))
        except Exception:
            pass
        raise HTTPException(
            status_code=502,
            detail=f"Gemini returned non-JSON output: {str(json_err)}"
        )
    except Exception as api_err:
        raise HTTPException(
            status_code=502,
            detail=f"Gemini API invocation error: {str(api_err)}"
        )
