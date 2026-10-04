-- 공지사항 상단 고정. 기본은 고정 아님.
alter table announcements add column if not exists pinned boolean not null default false;
