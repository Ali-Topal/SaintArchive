alter table public.entries
add column if not exists size text check (size in ('S', 'M', 'L', 'XL'));

