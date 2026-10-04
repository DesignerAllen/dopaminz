-- 미노출일. 이미 미노출인 회원은 비어 있는 상태(null)로 둔다.
alter table members add column if not exists hidden_at date;
