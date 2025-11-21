alter table public.entries
add column if not exists instagram_handle text;

alter table public.raffles
add column if not exists winner_instagram_handle text;

