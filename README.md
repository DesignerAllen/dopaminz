# 도파민즈 크루 · 회비 관리 (Next.js + Supabase)

## 구현 현황 (기획안 F-01~F-12, S-01~S-07 전부)
- S-01 뷰어 인증 · 홈 · S-05 관리자 인증
- S-02 분기별 현황 `/status` · S-03 인원별 `/status/person` · S-04 회원 목록 `/members`
- S-06 관리자 모드 `/admin`(회원 등록·수정·상태·미노출 사유별 목록·경고) · S-07 설정 `/admin/settings`
- 관리자 모드에서 S-02/S-03 의 칸을 눌러 납부 체크·해제(해제 시 확인), 가입달은 "예외 납부 모드"로 체크
- 변경 이력(`audit_log`), 관리자 30분 무활동 자동 종료, F-12 이력 이관 스크립트(`npm run import-payments -- 파일.csv --dry`)

## 실행
1. Supabase 프로젝트를 만들고 SQL Editor에서 `supabase/migrations/0001_init.sql` 실행
2. `cp .env.example .env.local` 후 값 채우기 (SESSION_SECRET: `openssl rand -base64 48`)
3. 초기 비밀번호 저장 (뷰어 PIN, 관리자 비밀번호):
   ```bash
   npm run set-passwords -- 1234 'Admin!2026pw'
   ```
4. `npm install && npm run dev` → http://localhost:3000

## 보안 구조
- 브라우저는 Supabase에 직접 접근하지 않는다. 서버(`src/lib/supabase.ts`, service_role)만 접근하고 모든 테이블은 RLS 활성 + 정책 없음.
- 비밀번호는 bcrypt 해시로 저장. 세션은 httpOnly 서명 쿠키(JWT). `settings.session_version`이 바뀌면 기존 세션 무효.
- 권한 판단은 `src/lib/guard.ts`(`requireViewer`/`requireAdmin`)와 API에서 서버가 수행.
- 실패 횟수로 잠그지 않는다(기획 변경). 안전장치로 IP당 10분 20회까지만 시도 가능 (`login_attempts` 테이블).
