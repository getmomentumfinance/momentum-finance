-- Run this in your Supabase SQL Editor

-- ── Trade Images ──────────────────────────────────────────────────────────────

create table if not exists public.trade_images (
  id             uuid        default gen_random_uuid() primary key,
  user_id        uuid        references auth.users not null,
  transaction_id uuid        not null,
  storage_path   text        not null,
  file_name      text,
  created_at     timestamptz default now() not null
);

alter table public.trade_images enable row level security;

create policy "trade_images: users manage own rows"
  on public.trade_images for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Trade Comments ────────────────────────────────────────────────────────────

create table if not exists public.trade_comments (
  id             uuid        default gen_random_uuid() primary key,
  user_id        uuid        references auth.users not null,
  transaction_id uuid        not null,
  content        text        not null,
  created_at     timestamptz default now() not null,
  updated_at     timestamptz default now() not null
);

alter table public.trade_comments enable row level security;

create policy "trade_comments: users manage own rows"
  on public.trade_comments for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Storage bucket ────────────────────────────────────────────────────────────
-- Creates the bucket if it doesn't already exist.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('trade-images', 'trade-images', false, 5242880, array['image/jpeg','image/png','image/webp','image/gif','image/heic'])
on conflict (id) do nothing;

create policy "trade-images: upload own"
  on storage.objects for insert
  with check (bucket_id = 'trade-images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "trade-images: read own"
  on storage.objects for select
  using (bucket_id = 'trade-images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "trade-images: delete own"
  on storage.objects for delete
  using (bucket_id = 'trade-images' and auth.uid()::text = (storage.foldername(name))[1]);
