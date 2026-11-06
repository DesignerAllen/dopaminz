import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

// Pretendard Variable (자체 호스팅). 기본은 Regular(400), 강조는 SemiBold(600).
const noto = localFont({
  src: "../../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2",
  weight: "45 920",
  display: "swap",
  variable: "--font-sans",
  fallback: ["system-ui", "-apple-system", "Apple SD Gothic Neo", "Malgun Gothic", "sans-serif"],
});

// 공유 링크 미리보기(og:image 등)의 절대 주소 기준. SITE_URL 환경변수를 우선하되,
// 배포 환경에서 localhost 로 잘못 들어가 있으면 Vercel 이 알려주는 실제 주소를 쓴다.
function siteUrl(): URL {
  const env = process.env.SITE_URL;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined;
  const bad = !env || (process.env.NODE_ENV === "production" && /localhost|127\.0\.0\.1/.test(env));
  return new URL((bad ? vercel : env) ?? env ?? "http://localhost:3000");
}

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: "도파민즈 크루",
  description: "도파민즈 크루 전용 페이지입니다",
  openGraph: { type: "website", siteName: "도파민즈 크루", locale: "ko_KR", title: "도파민즈 크루", description: "도파민즈 크루 전용 페이지입니다", images: [{ url: "/og.png", width: 1200, height: 630, alt: "도파민즈 크루" }] },
  twitter: { card: "summary_large_image", title: "도파민즈 크루", description: "도파민즈 크루 전용 페이지입니다", images: ["/og.png"] },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#ffffff" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // 로컬 개발 전용 [케이스] 버튼: 운영 빌드에서는 이 분기가 통째로 제거되어 번들에 포함되지 않는다
  const DevCaseButton = process.env.NODE_ENV === "development" ? (await import("@/components/DevCaseButton")).default : null;
  return (
    <html lang="ko" className={cn(noto.className, noto.variable, "font-sans")}>
      <body>
        <div className="shell">{children}</div>
        {DevCaseButton && <DevCaseButton />}
        <Toaster />
      </body>
    </html>
  );
}
