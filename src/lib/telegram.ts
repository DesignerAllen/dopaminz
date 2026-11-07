import "server-only";

/** 텔레그램 알림. 환경변수가 없거나 전송이 실패해도 예외를 던지지 않는다(알림 실패가 신청서 제출을 막으면 안 된다). */
export async function notifyTelegram(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text, disable_web_page_preview: true }),
      signal: AbortSignal.timeout(4000),
    });
  } catch {
    // 무시
  }
}
