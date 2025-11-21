alter table public.raffles
add column if not exists max_entries_per_user integer not null default 20 check (max_entries_per_user > 0);

