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


def get_data_client(user: dict):
    """Return a Supabase client bound to a verified user's access token.

    Required before enabling database-level Row Level Security: with the plain
    anon-key client, Postgres treats every query as the anonymous role and RLS
    policies keyed on auth.uid() would block all access. Binding the user's
    verified (and locally signature-checked) access token makes auth.uid()
    resolve to the request's owner so the RLS block in
    migrations/001_user_scoped_contracts.sql becomes the enforcement layer.

    Not used by the current routes yet — they enforce ownership in the API
    layer. See the "Enabling RLS" section of the final report.
    """
    if not SUPABASE_URL or not SUPABASE_KEY:
        return None
    token = (user or {}).get("token")
    if not token:
        return None
    try:
        client = create_client(SUPABASE_URL, SUPABASE_KEY)
        client.auth.set_session(access_token=token, refresh_token="")
        return client
    except Exception as e:
        print(f"[supabase_client] Error creating user-bound client: {e}")
        return None
