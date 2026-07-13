-- Run this in your Supabase SQL Editor
--
-- Supports per-person budget splits for household budgeting: each person's
-- manually-entered contribution toward a shared category budget. This is a
-- pure display/breakdown annotation keyed by household_member_id -> amount —
-- it does NOT participate in spend calculation. The authoritative total stays
-- monthly_limit (read by calcBudgetSpend, unchanged); the app keeps
-- monthly_limit in sync as the sum of member_splits whenever a split is used.

alter table public.budgets add column if not exists member_splits jsonb not null default '{}';
