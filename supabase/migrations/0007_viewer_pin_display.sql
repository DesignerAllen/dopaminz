-- 관리자 설정 화면에 현재 뷰어 비밀번호(4자리)를 보여주기 위한 칸.
-- 로그인 검증은 계속 viewer_pin_hash(bcrypt)로 한다. 이 칸은 표시 전용이고 관리자 화면에서만 읽는다.
alter table settings add column if not exists viewer_pin_display text check (viewer_pin_display ~ '^\d{4}$');
