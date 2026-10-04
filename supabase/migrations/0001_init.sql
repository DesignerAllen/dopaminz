-- 도파민즈 크루 회비 관리 · 초기 스키마 (Supabase SQL Editor 또는 supabase db push)
create table if not exists members (
  id            bigint generated always as identity primary key,
  name          text not null,
  joined_at     date not null,
  instagram_id  text check (instagram_id ~ '^[A-Za-z0-9._]{1,30}$'),
  status        text not null default '회원' check (status in ('회원','미노출')),
  hidden_reason text check (hidden_reason in ('자진 탈퇴','경고 탈퇴','기타')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check ((status = '미노출') = (hidden_reason is not null))
);

create table if not exists payments (
  id           bigint generated always as identity primary key,
  member_id    bigint not null references members(id),
  year_month   char(7) not null check (year_month ~ '^\d{4}-\d{2}$'),
  is_exception boolean not null default false,
  paid_at      timestamptz not null default now(),
  unique (member_id, year_month)
);

create table if not exists settings (
  id                  smallint primary key default 1 check (id = 1),
  viewer_pin_hash     text not null,
  admin_password_hash text not null,
  session_version     int  not null default 1,  -- 뷰어 비밀번호 변경 시 +1 → 기존 세션 무효화
  notice_fee          text not null default '',
  notice_account      text not null default '',
  updated_at          timestamptz not null default now()
);

create table if not exists audit_log (
  id bigint generated always as identity primary key,
  action text not null, member_id bigint, year_month char(7), detail jsonb,
  at timestamptz not null default now()
);

-- 서버리스 환경용 로그인 시도 기록 (잠금·IP 제한)
create table if not exists login_attempts (
  id      bigint generated always as identity primary key,
  scope   text not null check (scope in ('viewer','admin')),
  ip      text not null,
  success boolean not null,
  at      timestamptz not null default now()
);
create index if not exists login_attempts_scope_at on login_attempts (scope, at desc);
create index if not exists login_attempts_ip_at on login_attempts (ip, at desc);

-- RLS: 정책을 만들지 않아 anon/authenticated 직접 접근 전부 차단. 서버(service_role)만 접근.
alter table members        enable row level security;
alter table payments       enable row level security;
alter table settings       enable row level security;
alter table audit_log      enable row level security;
alter table login_attempts enable row level security;
