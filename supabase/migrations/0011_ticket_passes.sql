-- 센터별 크루권 횟수(구매분). 시작일~종료일 안에 사용한 신청 인원만큼 차감해서 잔여 횟수를 계산한다.
create table if not exists ticket_passes (
  id bigint generated always as identity primary key,
  center_id bigint not null references ticket_centers(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  quantity integer not null check (quantity > 0 and quantity <= 100000),
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);
create index if not exists ticket_passes_center_idx on ticket_passes(center_id);
alter table ticket_passes enable row level security;
