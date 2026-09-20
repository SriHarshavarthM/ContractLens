-- 003_analysis_persistence.sql
-- Purpose: persist the analysis views that were previously computed per-request
-- and never saved, so a contract's full analysis restores after the user signs
-- out / signs in or reloads the page.
--
-- What is covered:
--   * contract_extractions, obligations and flags already persist to their own
--     child tables (see routes/extract.py, obligations.py, flags.py).
--   * timeline / summary / alerts were dropped (lost) after every session. This
--     migration adds three jsonb columns to public.contracts; the routes now
--     `update` those columns (guarded by API-layer ownership + the existing
--     contracts_update_own RLS policy when Row Level Security is enabled).
--
-- Idempotent: every statement is safe to re-run.

alter table public.contracts add column if not exists "summary" jsonb;
alter table public.contracts add column if not exists "timeline" jsonb;
alter table public.contracts add column if not exists "alerts" jsonb;