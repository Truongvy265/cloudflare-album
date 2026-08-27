create or replace view public.survey_responses_export
with (security_invoker = true)
as
select
  email as "Email",
  phone as "SĐT",
  case when willing_to_pay_talent_frame then 'Có' when willing_to_pay_talent_frame is false then 'Không' end as "Bạn có sẵn sàng trả tiền cho Photobooth có frame Talent không?",
  case when would_buy_ticket then 'Có' when would_buy_ticket is false then 'Không' end as "Áp dụng chung với quyền lợi vé, bạn có sẵn sàng mua vé ngay không?",
  perceived_value as "Hiện tại Photobooth này đáng giá bao nhiêu?",
  improvement_feedback as "Bạn thấy Photobooth này thiếu gì? Cần bổ sung gì không?"
from public.survey_responses
order by created_at desc;

-- Dữ liệu cá nhân chỉ được xem trong Supabase Dashboard hoặc qua service role.
revoke all on public.survey_responses_export from anon, authenticated;
grant select on public.survey_responses_export to service_role;

comment on view public.survey_responses_export is
  'Bản khảo sát đã đổi tiêu đề và câu trả lời sang tiếng Việt, dùng để xem hoặc xuất CSV/Excel.';
