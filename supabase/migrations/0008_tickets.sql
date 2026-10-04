-- 크루권: 센터 → 지점, 센터별 항목(사용 구분)과 금액, 신청(+이용자), 입금 여부, 취소.
-- 신청 건에는 센터/지점/항목 이름과 단가를 그 시점 값으로 함께 저장한다(나중에 이름·가격을 바꿔도 지난 신청은 그대로).

create table if not exists ticket_centers (
  id         bigint generated always as identity primary key,
  name       text not null unique check (char_length(name) between 1 and 30),
  sort_order int  not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists ticket_branches (
  id         bigint generated always as identity primary key,
  center_id  bigint not null references ticket_centers(id),
  name       text not null check (char_length(name) between 1 and 30),
  sort_order int  not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  unique (center_id, name)
);

-- 항목: 센터마다 자유롭게 추가 (예: 크루 모임 16,000 / 개인·게스트 17,000). 지점은 센터의 금액을 따른다.
create table if not exists ticket_items (
  id         bigint generated always as identity primary key,
  center_id  bigint not null references ticket_centers(id),
  name       text not null check (char_length(name) between 1 and 30),
  price      integer not null check (price >= 0),
  sort_order int  not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  unique (center_id, name)
);

create table if not exists ticket_requests (
  id           bigint generated always as identity primary key,
  used_on      date not null,
  center_id    bigint not null references ticket_centers(id),
  branch_id    bigint references ticket_branches(id),
  item_id      bigint not null references ticket_items(id),
  center_name  text not null,
  branch_name  text,
  item_name    text not null,
  unit_price   integer not null check (unit_price >= 0),
  people_count integer not null check (people_count between 1 and 50),
  total_price  integer not null check (total_price >= 0),
  status       text not null default 'active' check (status in ('active','canceled')),
  paid         boolean not null default false,
  paid_at      timestamptz,
  canceled_at  timestamptz,
  created_at   timestamptz not null default now(),
  check (not (paid and status = 'canceled'))
);
create index if not exists ticket_requests_order on ticket_requests (used_on desc, created_at desc);

create table if not exists ticket_request_people (
  id         bigint generated always as identity primary key,
  request_id bigint not null references ticket_requests(id) on delete cascade,
  position   int  not null,
  member_id  bigint references members(id),
  name       text not null check (char_length(name) between 1 and 30),
  is_guest   boolean not null default false,
  check ((member_id is null) = is_guest)
);
create index if not exists ticket_request_people_request on ticket_request_people (request_id);

-- RLS: 정책 없음 → 서버(service_role)만 접근
alter table ticket_centers        enable row level security;
alter table ticket_branches       enable row level security;
alter table ticket_items          enable row level security;
alter table ticket_requests       enable row level security;
alter table ticket_request_people enable row level security;

-- 초기 데이터: 서울숲(구로·잠실·종로점), 손상원(지점은 관리자 설정에서 추가). 금액은 두 센터 동일.
insert into ticket_centers (name, sort_order) values ('서울숲', 1), ('손상원', 2) on conflict (name) do nothing;

insert into ticket_branches (center_id, name, sort_order)
select c.id, b.name, b.ord from ticket_centers c
join (values ('구로점', 1), ('잠실점', 2), ('종로점', 3)) as b(name, ord) on true
where c.name = '서울숲'
on conflict (center_id, name) do nothing;

insert into ticket_items (center_id, name, price, sort_order)
select c.id, i.name, i.price, i.ord from ticket_centers c
join (values ('크루 모임', 16000, 1), ('개인·게스트', 17000, 2)) as i(name, price, ord) on true
on conflict (center_id, name) do nothing;
