-- Run this in your Supabase SQL Editor

-- ── Goals ─────────────────────────────────────────────────────────────────────
-- Generic table for financial-goal simulators (house, car, etc). Type-specific
-- data lives in `config` (jsonb) so new goal types don't need new columns.

create table if not exists public.goals (
  id          uuid        default gen_random_uuid() primary key,
  user_id     uuid        references auth.users not null,
  type        text        not null,
  name        text        not null,
  status      text        not null default 'draft',
  config      jsonb       not null default '{}',
  started_at  timestamptz,
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

alter table public.goals enable row level security;

create policy "goals: users manage own rows"
  on public.goals for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
