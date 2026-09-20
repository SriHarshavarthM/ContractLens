-- 004_analysis_metadata.sql
-- Purpose: persist the richer document metadata and structured analysis fields
-- the redesigned results page and contract library display, plus every column
-- the backend routes now insert/select.
--
-- Covered:
--   * contracts: document metadata (file_type, file_size_bytes, pages,
--     word_count, document_type) and the analysis lifecycle fields
--     (analysis_status, analyzed_at, analysis_error) so history/restore flows
--     can render honest states (pending / running / completed / failed).
--   * contract_extractions: document_type, governing_law, financial_value,
--     important_dates (structured JSON).
--   * flags: title, business_impact, review_consideration, page_reference so
--     risk review shows a proper title/impact/next-step instead of raw text.
--   * obligations: obligation_type and frequency.
--
-- Additive and idempotent: every statement is safe to re-run, and no existing
-- column or value is dropped or rewritten. New columns on existing RLS-enabled
-- tables are covered by the parent-ownership policies already created in
-- 002_contract_persistence.sql.
--
-- Older rows keep their existing values; NULL analysis columns simply render
-- as "not analyzed yet" in the UI.

alter table public.contracts add column if not exists "file_type" text;
alter table public.contracts add column if not exists "file_size_bytes" bigint;
alter table public.contracts add column if not exists "pages" integer;
alter table public.contracts add column if not exists "word_count" integer;
alter table public.contracts add column if not exists "document_type" text;
alter table public.contracts add column if not exists "analysis_status" text default 'pending';
alter table public.contracts add column if not exists "analyzed_at" timestamptz;
alter table public.contracts add column if not exists "analysis_error" text;

alter table public.contract_extractions add column if not exists "document_type" text;
alter table public.contract_extractions add column if not exists "governing_law" text;
alter table public.contract_extractions add column if not exists "financial_value" text;
alter table public.contract_extractions add column if not exists "important_dates" jsonb;

alter table public.flags add column if not exists "title" text;
alter table public.flags add column if not exists "business_impact" text;
alter table public.flags add column if not exists "review_consideration" text;
alter table public.flags add column if not exists "page_reference" text;

alter table public.obligations add column if not exists "obligation_type" text;
alter table public.obligations add column if not exists "frequency" text;