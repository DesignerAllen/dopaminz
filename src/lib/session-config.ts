export const SESSION_COOKIE = "dc_session";
export const VIEWER_TTL_SEC = 60 * 60 * 24 * 7; // 뷰어 세션 7일(접속할 때마다 다시 7일로 갱신)
export const REFRESH_AFTER_SEC = 60 * 60; // 마지막 발급 후 1시간이 지난 뒤의 접속에서만 새로 발급(매 요청마다 쿠키를 쓰지 않도록)
