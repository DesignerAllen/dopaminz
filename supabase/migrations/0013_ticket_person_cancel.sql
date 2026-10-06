-- 크루권 이용자별 취소: 이용자 행은 지우지 않고 취소 시각만 남긴다(취소 내역 보존).
-- 취소된 이용자는 납부·금액·잔여 횟수 계산에서 빠지고, 모든 이용자가 취소되면 신청 자체도 'canceled' 가 된다.
alter table ticket_request_people add column if not exists canceled_at timestamptz;

-- 기존에 신청 단위로 취소된 건은 이용자도 같은 시각에 취소된 것으로 맞춘다.
update ticket_request_people p
   set canceled_at = coalesce(r.canceled_at, now())
  from ticket_requests r
 where p.request_id = r.id and r.status = 'canceled' and p.canceled_at is null;
