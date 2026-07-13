-- Run this in your Supabase SQL Editor
--
-- Removes the investing (Portfolio) feature and the Cards/Subscriptions/Wishlist/
-- Recurring/Planned/Pending dashboard widgets, narrowing the app to core budgeting.
-- Can be run independently of add_transaction_labels.sql (no shared columns).

-- ── Portfolio / investing ─────────────────────────────────────────────────────

-- Historical invest-type transactions have no meaning once ticker/quantity/price
-- columns below are dropped — remove them rather than leave orphaned rows.
delete from public.transactions where type = 'invest';

drop table if exists public.trade_images;
drop table if exists public.trade_comments;
drop table if exists public.tickers;

-- Supabase blocks direct DELETE on storage.objects/storage.buckets (must go
-- through the Storage API). Delete the 'trade-images' bucket manually instead:
-- Dashboard → Storage → select 'trade-images' → Delete bucket (deletes its objects too).

alter table public.transactions
  drop column if exists ticker,
  drop column if exists quantity,
  drop column if exists price_per_unit,
  drop column if exists direction,
  drop column if exists stop_loss,
  drop column if exists target_price;

-- ── Cards / Subscriptions / Wishlist / Recurring / Planned / Pending widgets ──

drop table if exists public.pending_items;
drop table if exists public.subscription_payments;
drop table if exists public.subscriptions;
drop table if exists public.recurring_bill_payments;
drop table if exists public.recurring_bills;
drop table if exists public.planned_bills;
drop table if exists public.wishlist;
drop table if exists public.price_change_alerts;
