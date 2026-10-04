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

export const metadata: Metadata = {
  // 공유 링크 미리보기(og:url 등)의 절대 주소 기준. 배포 후 SITE_URL 환경변수로 실제 주소를 지정한다.
  metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3000"),
  title: "도파민즈 크루",
  description: "도파민즈 크루 회비 납부 현황",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={cn(noto.className, noto.variable, "font-sans")}>
      <body>
        <div className="shell">{children}</div>
        <Toaster position="bottom-center" />
      </body>
    </html>
  );
}
