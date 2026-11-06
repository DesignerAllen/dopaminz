// 마지막으로 로그인/등록한 크루원 이름을 이 기기(브라우저)에 기억한다. 로그아웃 뒤 로그인 화면에서 비밀번호만 입력하게 하려는 용도.
const KEY = "dc_last_member";

export function rememberMember(id: number) {
  try {
    localStorage.setItem(KEY, String(id));
  } catch {
    // 저장소를 쓸 수 없는 환경(사생활 보호 모드 등)에서는 기억하지 않는다
  }
}

export function recalledMember(): number | null {
  try {
    const v = Number(localStorage.getItem(KEY));
    return Number.isInteger(v) && v > 0 ? v : null;
  } catch {
    return null;
  }
}
