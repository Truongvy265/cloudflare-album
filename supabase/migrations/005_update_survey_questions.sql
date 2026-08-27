alter table public.survey_responses
  alter column full_name drop not null,
  alter column likes_photobooth drop not null,
  alter column price_range drop not null,
  alter column readiness drop not null,
  alter column feedback drop not null;

alter table public.survey_responses
  add column if not exists willing_to_pay_talent_frame boolean,
  add column if not exists would_buy_ticket boolean,
  add column if not exists perceived_value text,
  add column if not exists improvement_feedback text;

comment on column public.survey_responses.willing_to_pay_talent_frame is 'Khách có sẵn sàng trả tiền cho Photobooth có frame Talent không.';
comment on column public.survey_responses.would_buy_ticket is 'Khách có sẵn sàng mua vé ngay khi áp dụng quyền lợi vé không.';
comment on column public.survey_responses.perceived_value is 'Mức giá khách đánh giá cho Photobooth, tính theo VNĐ mỗi lượt.';
comment on column public.survey_responses.improvement_feedback is 'Điểm còn thiếu hoặc đề xuất bổ sung cho Photobooth.';