-- 관리자 회원 목록에 보여줄 개인 로그인 마지막 시점
alter table members add column if not exists last_login_at timestamptz;
