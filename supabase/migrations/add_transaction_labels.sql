-- Run this in your Supabase SQL Editor
--
-- Adds a multi-value labels column to transactions (e.g. "Recurring", "Subscription")
-- so users can tag and filter transactions themselves, replacing the dedicated
-- Recurring/Subscription features. Replaces the old single-value, investment-only
-- `label` column (source of that data is being removed — see drop_portfolio_and_widgets.sql).

alter table public.transactions add column if not exists labels text[] not null default '{}';
alter table public.transactions drop column if exists label;
