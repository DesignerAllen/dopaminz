-- 센터별 입장코드(안내 문구). 크루권 신청 목록 화면에 보여준다.
alter table ticket_centers add column if not exists entry_code text check (char_length(entry_code) <= 100);
