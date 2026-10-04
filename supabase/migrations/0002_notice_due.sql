-- 공지에 표시할 납부일 (예: '매월 1일')
alter table settings add column if not exists notice_due text not null default '매월 1일';
