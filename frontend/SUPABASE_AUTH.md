# Supabase Auth — Setup & Owner Runbook

ContractLens authentication is now powered entirely by **Supabase Auth** (email/password).
The old in-memory demo login (`routes/auth.py`, `loginDemo`, fake users/tokens) has been
removed. This document covers what an owner must configure in the Supabase dashboard,
what env vars are read, and how to enable database-level isolation later.

## 1. Env vars

Create `backend/.env` (already exists locally) and `frontend/.env` with these names:

| File                          | Variable                 | Notes                                                                 |
| ----------------------------- | ------------------------ | --------------------------------------------------------------------- |
| `backend/.env` & `frontend/.env` | `SUPABASE_URL` / `VITE_SUPABASE_URL` | Project URL from **Settings → API**                            |
| `backend/.env` & `frontend/.env` | `SUPABASE_ANON_KEY` / `VITE_SUPABASE_ANON_KEY` | Public **anon** key — never the service_role key |
| `backend/.env`                | `SUPABASE_JWT_SECRET`    | Optional. Enables local HS256 signature check before remote verify (Settings → API → JWT secret) |

`*.env.example` files document these names without real values.

## 2. Supabase dashboard settings (owner actions — not part of the code change)

1. **Auth → Providers → Email**: keep enabled.
2. **Auth → URL configuration**:
   - *Site URL*: `http://localhost:5173` (frontend origin).
   - *Redirect URLs*: add `http://localhost:5173` (required for email-link flows).
3. **Auth → Email → Confirm email**: recommended ON. The UI already detects a
   "confirm your email" state after sign-up and shows guidance. If left OFF, users are
   signed in immediately after registering.
4. **Auth → Settings → JWT expiry**: default is fine (the SDK auto-refreshes; the backend
   verifies the current `access_token` on every request).

## 3. Database migration (owner action)

Run `backend/migrations/001_user_scoped_contracts.sql` **schema part only** in the
Supabase **SQL Editor**. It adds `contracts.user_id` (FK → `auth.users`) + index.

**Do NOT enable the RLS block yet** unless you first switch the backend data access to
per-user tokens (see §5). With RLS enabled while the backend still uses the shared anon
client, every query runs as the anonymous role and all rows become invisible, breaking
the app.

## 4. Current isolation model (already active)

- Every backend data route requires `Authorization: Bearer <access_token>` and resolves
  the user via **Supabase Auth** (`supabase.auth.get_user`), optionally prefixed by a
  local HS256 signature check when `SUPABASE_JWT_SECRET` is set.
- Uploads write `user_id = <verified sub>`.
- Reads/writes/deletes of contracts filter by `user_id` and run an ownership pre-check
  (`owns_contract`/`assert_owns_contract`) that returns **404** for non-owned rows.
- Analysis (extract/obligations/flags) persists only when the supplied `contract_id`
  belongs to the caller; otherwise it analyzes in-memory without persisting.
- This is **API-layer enforcement** — active now, independent of RLS.

## 5. Enabling database-level RLS later (optional hardening)

To make RLS the enforcement layer:

1. Swap each route's data access from the shared `supabase` client to a per-request
   client bound to the user's token via `get_data_client(current_user)` in
   `backend/services/supabase_client.py` (the user's JWT carries the identity so
   Postgres `auth.uid()` resolves correctly).
2. Uncomment the RLS block in `backend/migrations/001_user_scoped_contracts.sql` and run
   it.
3. Re-run the manual test checklist below — every list/detail/update/delete should
   behave identically (data isolation formerly proven by the API layer is then also
   proven at the database layer).

Once RLS is enabled with per-user clients, the extra `user_id` filters become
defense-in-depth and can stay.

## 6. Manual test checklist (owner/developer)

Backend: `cd backend && uvicorn main:app --port 8000` (deps: `pip install -r requirements.txt`).
Frontend: `cd frontend && npm install && npm run dev`.

1. Visit root → you land on the **login page** (no demo button).
2. Register a new account (or sign in). With Confirm email ON, you see the
   confirmation notice; click the emailed link, then sign back in.
3. Session persists across a full page reload (you go straight to the dashboard).
4. Upload a PDF → analysis streams → results appear. Check Supabase table
   `contracts` shows your `user_id`; `contract_extractions`/`obligations`/`flags` rows
   reference your contract.
5. In a private window, sign in as a **different** user → that account must NOT see the
   first user's contracts in the sidebar (list is scoped); direct `GET /contracts/{id}`
   of another user's id returns 404.
6. `GET /health` stays public; **every** `/extract`, `/obligations`, `/flags`,
   `/timeline`, `/summary`, `/compare`, `/qa`, `/alerts`, `/upload`, `/contracts`,
   `/debug/ai`, `/config/key`, and `/…/stream` call without a token returns `401`.
7. Sign out → UI returns to the login page and contract data is cleared from state.