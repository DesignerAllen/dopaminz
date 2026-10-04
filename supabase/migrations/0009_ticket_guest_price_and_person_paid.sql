-- 크루권: 1) 항목별 게스트 단가  2) 이용자별 금액·납부 체크

-- 1) 게스트 단가: 비워 두면(null) 크루원 단가와 같다.
alter table ticket_items add column if not exists guest_price integer check (guest_price >= 0);

-- 신청 건: 게스트 단가 스냅샷과 인원 구성
alter table ticket_requests
  add column if not exists guest_unit_price integer check (guest_unit_price >= 0),
  add column if not exists member_count integer,
  add column if not exists guest_count integer;

-- 2) 이용자별 금액(신청 시점 단가)과 납부 여부
alter table ticket_request_people
  add column if not exists unit_price integer check (unit_price >= 0),
  add column if not exists paid boolean not null default false,
  add column if not exists paid_at timestamptz;

-- 기존 데이터 채우기(기존 신청은 모두 같은 단가였으므로 합계가 바뀌지 않는다)
update ticket_requests set guest_unit_price = unit_price where guest_unit_price is null;

update ticket_request_people p
   set unit_price = r.unit_price
  from ticket_requests r
 where p.request_id = r.id and p.unit_price is null;

update ticket_request_people p
   set paid = true, paid_at = r.paid_at
  from ticket_requests r
 where p.request_id = r.id and r.paid and not p.paid;

update ticket_requests r
   set member_count = (select count(*) from ticket_request_people p where p.request_id = r.id and not p.is_guest),
       guest_count  = (select count(*) from ticket_request_people p where p.request_id = r.id and p.is_guest)
 where member_count is null or guest_count is null;
