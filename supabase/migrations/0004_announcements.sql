-- 공지사항. id 는 추측하기 어려운 uuid(공유 링크에 사용). updated_at 은 수정한 적이 없으면 null.
create table if not exists announcements (
  id         uuid primary key default gen_random_uuid(),
  title      text not null check (char_length(title) between 1 and 100),
  content    text not null check (char_length(content) between 1 and 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz
);
create index if not exists announcements_created_at on announcements (created_at desc);
alter table announcements enable row level security; -- 정책 없음: 서버(service_role)만 접근
