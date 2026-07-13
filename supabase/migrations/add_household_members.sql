-- Run this in your Supabase SQL Editor
--
-- Supports tracking joint vs. separate accounts for a shared household.
-- `household_members` holds custom-named people (e.g. "Tessa", "Alex") the
-- user adds from Settings. `cards.owner_ids` links an account to 0, 1, or
-- several members: empty = unassigned, one id = personal, 2+ ids = joint.
-- No FK constraint on the array (same precedent as transactions.labels) —
-- membership is resolved app-side against household_members.

-- ── Household Members ─────────────────────────────────────────────────────────

create table if not exists public.household_members (
  id         uuid        default gen_random_uuid() primary key,
  user_id    uuid        references auth.users not null,
  name       text        not null,
  color      text        not null,
  created_at timestamptz default now() not null
);

alter table public.household_members enable row level security;

create policy "household_members: users manage own rows"
  on public.household_members for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Account ownership ─────────────────────────────────────────────────────────

alter table public.cards add column if not exists owner_ids uuid[] not null default '{}';
