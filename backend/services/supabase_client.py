import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")

supabase: Client = None

if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("[supabase_client] Supabase connected.")
    except Exception as e:
        print(f"[supabase_client] Error connecting to Supabase: {e}")
        supabase = None
else:
    print("[supabase_client] WARNING: No Supabase credentials. Storage disabled.")
