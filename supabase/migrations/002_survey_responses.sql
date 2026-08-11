create table if not exists public.survey_responses (
  id uuid primary key default gen_random_uuid(),
  photo_session_id uuid references public.photo_sessions(id) on delete set null,
  session_token text not null check (char_length(session_token) between 20 and 80),
  full_name text not null check (char_length(full_name) between 2 and 120),
  email text not null check (char_length(email) <= 254),
  phone text not null check (char_length(phone) between 8 and 20),
  likes_photobooth boolean not null,
  price_range text not null check (price_range in ('70000', '100000', 'over100000', 'other')),
  price_other text check (price_other is null or char_length(price_other) <= 120),
  readiness text not null check (readiness in ('considering', 'ready', 'very_ready', 'excited')),
  feedback text not null check (char_length(feedback) between 2 and 1000),
  consent boolean not null check (consent = true),
  survey_version integer not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists survey_responses_session_idx on public.survey_responses(photo_session_id);
create index if not exists survey_responses_token_idx on public.survey_responses(session_token);
create index if not exists survey_responses_created_at_idx on public.survey_responses(created_at desc);
alter table public.survey_responses enable row level security;

-- Không tạo policy công khai. Chỉ Cloudflare Pages Functions dùng service-role key
-- mới được ghi khảo sát; trình duyệt không bao giờ nhận khóa Supabase.
comment on table public.survey_responses is 'Phản hồi khảo sát bắt buộc trước khi mở album photobooth.';
