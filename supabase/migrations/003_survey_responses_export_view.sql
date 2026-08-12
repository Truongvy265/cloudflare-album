create or replace view public.survey_responses_export
with (security_invoker = true)
as
select
  full_name as "Họ và Tên",
  email as "Email",
  phone as "SĐT",
  case
    when likes_photobooth then 'Có'
    else 'Không'
  end as "Bạn có thích chụp Photobooth không?",
  case price_range
    when '70000' then '70.000 VNĐ / lượt (Giá phổ thông)'
    when '100000' then '100.000 VNĐ / lượt (khung ảnh & phụ kiện độc lạ, chất lượng)'
    when 'over100000' then 'Trên 100.000 VNĐ / lượt (Nhiều hiệu ứng đặc biệt/file tặng kèm)'
    when 'other' then coalesce(nullif(price_other, ''), 'Mục khác')
  end as "Mức giá nào theo bạn là HỢP LÝ cho 1 lượt chụp Photobooth",
  case readiness
    when 'considering' then 'Suy nghĩ'
    when 'ready' then 'Sẵn sàng'
    when 'very_ready' then 'Rất Sẵn Sàng'
    when 'excited' then 'Đang rất là mong chờ'
  end as "Saigon Tếu có Photobooth bạn có sẵn sàng cho một lượt chụp không?",
  feedback as "Bạn có góp ý gì để trải nghiệm chụp Photobooth trở nên tuyệt vời hơn không?"
from public.survey_responses
order by created_at desc;

-- Dữ liệu cá nhân chỉ được xem trong Supabase Dashboard hoặc qua service role.
revoke all on public.survey_responses_export from anon, authenticated;
grant select on public.survey_responses_export to service_role;

comment on view public.survey_responses_export is
  'Bản khảo sát đã đổi tiêu đề và câu trả lời sang tiếng Việt, dùng để xem hoặc xuất CSV/Excel.';
