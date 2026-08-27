drop view if exists public.survey_responses_export;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'survey_responses'
      and column_name = 'willing_to_pay_talent_frame' and data_type = 'boolean'
  ) then
    alter table public.survey_responses
      alter column willing_to_pay_talent_frame type text
        using case when willing_to_pay_talent_frame is true then 'Có'
                   when willing_to_pay_talent_frame is false then 'Không' end;
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'survey_responses'
      and column_name = 'would_buy_ticket' and data_type = 'boolean'
  ) then
    alter table public.survey_responses
      alter column would_buy_ticket type text
        using case when would_buy_ticket is true then 'Có'
                   when would_buy_ticket is false then 'Không' end;
  end if;
end $$;

alter table public.survey_responses
  drop constraint if exists survey_responses_willing_to_pay_talent_frame_check,
  drop constraint if exists survey_responses_would_buy_ticket_check,
  drop constraint if exists survey_responses_perceived_value_check;

alter table public.survey_responses
  add constraint survey_responses_willing_to_pay_talent_frame_check
    check (willing_to_pay_talent_frame is null or char_length(willing_to_pay_talent_frame) between 1 and 500),
  add constraint survey_responses_would_buy_ticket_check
    check (would_buy_ticket is null or char_length(would_buy_ticket) between 1 and 500),
  add constraint survey_responses_perceived_value_check
    check (perceived_value is null or char_length(perceived_value) between 1 and 120);

create view public.survey_responses_export
with (security_invoker = true)
as
select
  email as "Email",
  phone as "SĐT",
  willing_to_pay_talent_frame as "Bạn có sẵn sàng trả tiền cho Photobooth có frame Talent không?",
  would_buy_ticket as "Áp dụng chung với quyền lợi vé, bạn có sẵn sàng mua vé ngay không?",
  perceived_value as "Hiện tại Photobooth này đáng giá bao nhiêu?",
  improvement_feedback as "Bạn thấy Photobooth này thiếu gì? Cần bổ sung gì không?"
from public.survey_responses
order by created_at desc;

revoke all on public.survey_responses_export from anon, authenticated;
grant select on public.survey_responses_export to service_role;

comment on view public.survey_responses_export is
  'Sáu câu trả lời khảo sát dạng văn bản, dùng để xem hoặc xuất CSV/Excel.';
