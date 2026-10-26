-- 클메이트 찾기: 크루원 개인 로그인(PIN) + 성향 테스트 결과
alter table members add column if not exists pin_hash text;
alter table members add column if not exists pin_set_at timestamptz;

-- 개인 로그인 시도도 같은 표에 기록한다(scope 'member' 추가)
alter table login_attempts drop constraint if exists login_attempts_scope_check;
alter table login_attempts add constraint login_attempts_scope_check check (scope in ('viewer','admin','member'));

-- 성향 테스트 결과 (크루원당 최신 1건)
create table if not exists climb_profiles (
  member_id   bigint primary key references members(id),
  axes        smallint[] not null,  -- 축별 오른쪽 성향 선택 수 [0~3] x4 (교류,움직임,세션,접근)
  type_key    text not null,        -- 예: '0101' (축별 왼쪽=0, 오른쪽=1)
  visibility  text not null default 'crew' check (visibility in ('crew','private')),
  answers     smallint[] not null,  -- 12문항 원응답(0=왼쪽 성향, 1=오른쪽 성향). 문항 개편 시 재계산용
  updated_at  timestamptz not null default now()
);
alter table climb_profiles enable row level security;
