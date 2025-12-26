-- High score table for Pig Jump
-- Run this in Supabase SQL editor.

create table if not exists public.high_scores (
  player_id text primary key,
  best_score integer not null default 0,
  updated_at timestamptz not null default now()
);

-- Keep updated_at current on updates
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_high_scores_updated_at on public.high_scores;
create trigger trg_high_scores_updated_at
before update on public.high_scores
for each row execute function public.set_updated_at();

-- RLS guidance:
-- If you only write/read via Vercel serverless functions using the Service Role key,
-- you can leave RLS enabled or disabled. Service Role bypasses RLS.
-- If you ever call Supabase directly from the browser with anon key, enable RLS and add safe policies.


