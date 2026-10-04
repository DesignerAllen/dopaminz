import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // 같은 Wi-Fi의 폰에서 개발 서버(http://<맥 IP>:3000)에 접속할 수 있게 허용 (개발 모드 전용)
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.16.*.*"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "no-referrer" },
        ],
      },
    ];
  },
};

export default nextConfig;
