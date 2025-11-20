# Supabase Environment Setup

Create a `.env.local` file in the project root (same level as `package.json`) and define the public Supabase credentials used by both the browser and server helpers:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

- `NEXT_PUBLIC_SUPABASE_URL` is the REST URL shown in your Supabase project settings.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is the public anonymous key.

Restart `npm run dev` after adding or changing these values so Next.js picks them up.

## Waitlist table

Create the `waitlist` table for newsletter signups:

```sql
create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);
```

## Raffle gallery column

To support multiple images per raffle, add an array column:

```sql
alter table public.raffles
add column if not exists image_urls text[];
```

## Raffle display ordering

To manually control the order of active raffles on the homepage, add a numeric priority column (lower numbers surface first):

```sql
alter table public.raffles
add column if not exists sort_priority integer;
```

## Storage bucket for image uploads

1. In Supabase → Storage, create a bucket (e.g. `raffles`). Allow public read if you want direct image URLs.
2. Add the following secrets to `.env.local` (and production env):

```
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_STORAGE_BUCKET=raffles
```

> ⚠️ Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only. Never expose it to the browser.

