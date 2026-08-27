create table if not exists public.survey_responses (
  id uuid primary key default gen_random_uuid(),
  photo_session_id uuid references public.photo_sessions(id) on delete set null,
  session_token text not null check (char_length(session_token) between 20 and 80),
  full_name text check (full_name is null or char_length(full_name) between 2 and 120),
  email text not null check (char_length(email) <= 254),
  phone text not null check (char_length(phone) between 8 and 20),
  likes_photobooth boolean,
  price_range text check (price_range is null or price_range in ('70000', '100000', 'over100000', 'other')),
  price_other text check (price_other is null or char_length(price_other) <= 120),
  readiness text check (readiness is null or readiness in ('considering', 'ready', 'very_ready', 'excited')),
  feedback text check (feedback is null or char_length(feedback) between 2 and 1000),
  willing_to_pay_talent_frame text check (willing_to_pay_talent_frame is null or char_length(willing_to_pay_talent_frame) between 1 and 500),
  would_buy_ticket text check (would_buy_ticket is null or char_length(would_buy_ticket) between 1 and 500),
  perceived_value text check (perceived_value is null or char_length(perceived_value) between 1 and 120),
  improvement_feedback text check (improvement_feedback is null or char_length(improvement_feedback) between 2 and 1000),
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
