-- Shared checklist ticks for the Ireland trip app.
-- No login by design: anyone with the app link can read and tick items.
create table if not exists public.ireland_checks (
  key text primary key,          -- "<itemId>:<personId>"
  done boolean not null default false,
  by text,                        -- who ticked it (person id)
  updated_at timestamptz not null default now()
);

alter table public.ireland_checks enable row level security;

create policy "anyone can read" on public.ireland_checks for select to anon using (true);
create policy "anyone can insert" on public.ireland_checks for insert to anon with check (true);
create policy "anyone can update" on public.ireland_checks for update to anon using (true) with check (true);

alter publication supabase_realtime add table public.ireland_checks;
