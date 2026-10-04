-- 공지사항 노출 상태. 기존 공지는 모두 '노출'.
alter table announcements add column if not exists status text not null default '노출' check (status in ('노출','미노출'));
