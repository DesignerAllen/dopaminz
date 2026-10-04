-- 공지 공유 링크용 짧은 번호(/notices/12). 기존 공지는 작성일 순서대로 1부터 번호를 받고, 새 공지는 이어서 번호가 붙는다.
-- 예전 uuid 링크도 계속 열린다.
create sequence if not exists announcements_no_seq;
alter table announcements add column if not exists no bigint unique;
update announcements a set no = r.n
  from (select id, row_number() over (order by created_at, id) as n from announcements) r
  where a.id = r.id and a.no is null;
select setval('announcements_no_seq', coalesce((select max(no) from announcements), 0) + 1, false);
alter table announcements alter column no set default nextval('announcements_no_seq');
alter table announcements alter column no set not null;
