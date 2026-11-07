-- 신청서 처리 상태: 신규 → 가입완료(회원 등록 시) / 반려(반려취소 시 신규로 복귀)
alter table crew_applications add column if not exists status text not null default '신규';
alter table crew_applications drop constraint if exists crew_applications_status_check;
alter table crew_applications add constraint crew_applications_status_check check (status in ('신규','가입완료','반려'));
-- 회원으로 등록된 경우 연결된 회원
alter table crew_applications add column if not exists member_id bigint references members(id);
