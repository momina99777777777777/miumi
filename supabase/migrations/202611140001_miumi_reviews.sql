-- Miumi public app reviews
-- Run this once in the Supabase SQL Editor for your Miumi project.

create extension if not exists pgcrypto;

create table if not exists public.miumi_reviews (
  id uuid primary key default gen_random_uuid(),
  display_name text not null default 'Miumi visitor'
    check (char_length(display_name) between 1 and 40),
  rating integer not null check (rating between 1 and 5),
  message text not null check (char_length(trim(message)) between 1 and 600),
  created_at timestamptz not null default now()
);

alter table public.miumi_reviews enable row level security;

drop policy if exists "Anyone can read Miumi reviews" on public.miumi_reviews;
create policy "Anyone can read Miumi reviews"
  on public.miumi_reviews for select
  to anon, authenticated
  using (true);

drop policy if exists "Visitors can submit Miumi reviews" on public.miumi_reviews;
create policy "Visitors can submit Miumi reviews"
  on public.miumi_reviews for insert
  to anon, authenticated
  with check (
    char_length(display_name) between 1 and 40
    and rating between 1 and 5
    and char_length(trim(message)) between 1 and 600
  );

grant select, insert on public.miumi_reviews to anon, authenticated;
