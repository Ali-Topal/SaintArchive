alter table public.entries
add column if not exists shipping_name text,
add column if not exists shipping_address text,
add column if not exists shipping_city text,
add column if not exists shipping_postcode text,
add column if not exists shipping_country text;

