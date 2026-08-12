alter table public.photo_sessions
  drop constraint if exists photo_sessions_image_count_check;

alter table public.photo_sessions
  add constraint photo_sessions_image_count_check
  check (image_count between 1 and 9);
