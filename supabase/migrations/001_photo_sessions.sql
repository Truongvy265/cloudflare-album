create extension if not exists pgcrypto;

create table if not exists public.photo_sessions (
  id uuid primary key default gen_random_uuid(),
  token text not null unique check (char_length(token) between 20 and 80),
  mode text not null check (mode in ('quick2', 'photobooth')),
  image_count integer not null check (image_count between 1 and 6),
  images jsonb not null check (jsonb_typeof(images) = 'array'),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days')
);

create index if not exists photo_sessions_token_idx on public.photo_sessions (token);
create index if not exists photo_sessions_expires_at_idx on public.photo_sessions (expires_at);

alter table public.photo_sessions enable row level security;

-- No public policies are created. Cloudflare Pages Functions access this table
-- with SUPABASE_SERVICE_ROLE_KEY; browsers never receive Supabase credentials.

comment on table public.photo_sessions is 'Private photobooth album metadata; accessed only through Cloudflare Pages Functions.';
