-- 002_contract_persistence.sql
-- Purpose: guarantee the `contracts` table has the exact columns the upload,
-- list, detail, update, delete and ownership code paths require, and (opt-in)
-- enable Row Level Security now that backend data access uses per-user clients.
--
-- The backend now resolves a Supabase client bound to the END USER's verified
-- access token for all data access (see `data_client(user)` in
-- services/supabase_client.py). That makes `auth.uid()` resolve to the actual
-- request owner, so the RLS policies below work correctly. Run section 1-2
-- FIRST; section 3 (RLS) is safe to enable alongside or later.

-- =========================================================
-- 1) Ensure the columns the app code inserts/selects exist.
--    Every statement is idempotent and safe to re-run.
-- =========================================================
alter table public.contracts
    add column if not exists user_id uuid references auth.users (id) on delete cascade;

alter table public.contracts
    add column if not exists raw_text text;

alter table public.contracts
    add column if not exists status text default 'active';

alter table public.contracts
    add column if not exists uploaded_at timestamptz default now();

create index if not exists idx_contracts_user_id
    on public.contracts (user_id);

-- =========================================================
-- 2) Clean-up: rows uploaded while the app was unauthenticated have a NULL
--    user_id and are never returned to any user (API layer + RLS both require
--    ownership). Reassign such rows to a specific user if they should be kept:
-- =========================================================
-- update public.contracts set user_id = '<your_user_uuid>' where user_id is null;

-- =========================================================
-- 3) Row Level Security (OPT-IN, safe with per-user data clients).
--    Enable ONLY when you want database-level enforcement in addition to the
--    existing API-layer ownership checks. Requires the `user_id` column above.
-- =========================================================
alter table public.contracts enable row level security;
alter table public.contract_extractions enable row level security;
alter table public.obligations enable row level security;
alter table public.flags enable row level security;

drop policy if exists "contracts_select_own"    on public.contracts;
drop policy if exists "contracts_insert_own"    on public.contracts;
drop policy if exists "contracts_update_own"    on public.contracts;
drop policy if exists "contracts_delete_own"    on public.contracts;

create policy "contracts_select_own" on public.contracts
    for select using (user_id = auth.uid());
create policy "contracts_insert_own" on public.contracts
    for insert with check (user_id = auth.uid());
create policy "contracts_update_own" on public.contracts
    for update using (user_id = auth.uid());
create policy "contracts_delete_own" on public.contracts
    for delete using (user_id = auth.uid());

drop policy if exists "extractions_via_parent" on public.contract_extractions;
drop policy if exists "obligations_via_parent" on public.obligations;
drop policy if exists "flags_via_parent"       on public.flags;

create policy "extractions_via_parent" on public.contract_extractions
    for all
    using (exists (
        select 1 from public.contracts c
        where c.id = contract_extractions.contract_id and c.user_id = auth.uid()));
create policy "obligations_via_parent" on public.obligations
    for all
    using (exists (
        select 1 from public.contracts c
        where c.id = obligations.contract_id and c.user_id = auth.uid()));
create policy "flags_via_parent" on public.flags
    for all
    using (exists (
        select 1 from public.contracts c
        where c.id = flags.contract_id and c.user_id = auth.uid()));