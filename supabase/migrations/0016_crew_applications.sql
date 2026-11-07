-- 크루 가입 신청서 (로그인 없이 /apply 에서 제출, 관리자 모드 '신청서' 탭에서 확인)
create table if not exists crew_applications (
  id            bigint generated always as identity primary key,
  name          text     not null check (char_length(name) between 1 and 50),
  birth_year    smallint not null check (birth_year between 1900 and 2100),
  gender        text     not null check (gender in ('남','녀')),
  instagram_id  text     not null check (instagram_id ~ '^[A-Za-z0-9._]{1,30}$'),
  experience    text     not null,
  gym_area      text     not null check (char_length(gym_area) between 1 and 100),
  bouldering_level text  not null check (char_length(bouldering_level) between 1 and 100),
  reason        text     not null check (char_length(reason) between 1 and 2000),
  created_at    timestamptz not null default now()
);
alter table crew_applications enable row level security;
